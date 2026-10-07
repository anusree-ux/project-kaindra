const request = require("supertest");
const app = require("../../src/app");
const Design = require("../../src/models/modasphere/Design");
const DesignerProfile = require("../../src/models/modasphere/DesignerProfile");
const DesignComment = require("../../src/models/modasphere/DesignComment");
const { createTestUser } = require("../helpers/testUser");
const cloudinary = require("../../src/config/cloudinary");

describe("ModaStudio - Design Workspace API", () => {
  let owner;
  let editor;
  let viewer;
  let stranger;

  beforeEach(async () => {
    await Design.deleteMany({});
    await DesignerProfile.deleteMany({});
    await DesignComment.deleteMany({});
    jest.clearAllMocks();

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      let cb = callback;
      let opts = options;
      if (typeof options === "function") {
        cb = options;
        opts = {};
      }
      const folder = (opts && opts.folder) || "modasphere/designs";
      const resourceType = (opts && opts.resource_type) || "image";
      const publicId = `${folder}/mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const ext = resourceType === "raw" ? "pdf" : "png";
      const result = {
        secure_url: `https://res.cloudinary.com/test/${publicId}.${ext}`,
        public_id: publicId,
        resource_type: resourceType,
      };
      return {
        end: jest.fn((buffer) => {
          if (cb) cb(null, result);
        }),
      };
    });
    cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

    owner = await createTestUser({ name: "Studio Owner", role: "user" });
    editor = await createTestUser({ name: "Studio Editor", role: "user" });
    viewer = await createTestUser({ name: "Studio Viewer", role: "user" });
    stranger = await createTestUser({ name: "Stranger User", role: "user" });
  });

  describe("1. Designer Profile Endpoints", () => {
    test("PUT /api/modasphere/designer-profile creates or updates profile", async () => {
      const res = await request(app)
        .put("/api/modasphere/designer-profile")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          displayName: "Haute Couture Studio",
          bio: "Specializing in eco-friendly silk gowns and avant-garde tailoring.",
          specialties: ["Haute Couture", "Sustainable Fashion"],
          portfolioUrl: "https://hautecouture.example.com",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.profile.displayName).toBe("Haute Couture Studio");
      expect(res.body.data.profile.specialties).toContain("Sustainable Fashion");

      const getMeRes = await request(app)
        .get("/api/modasphere/designer-profile/me")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(getMeRes.statusCode).toBe(200);
      expect(getMeRes.body.data.profile.displayName).toBe("Haute Couture Studio");
    });
  });

  describe("2. Design Creation & List Endpoints", () => {
    test("POST /api/modasphere/designs starts design as draft", async () => {
      const res = await request(app)
        .post("/api/modasphere/designs")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          title: "Autumn Capsule Collection 2026",
          description: "Minimalist streetwear capsule using recycled cotton.",
          category: "streetwear",
          tags: ["autumn", "minimalist", "recycled"],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.design.status).toBe("draft");
      expect(res.body.data.design.visibility).toBe("private");
      expect(res.body.data.design.myRole).toBe("owner");
    });

    test("GET /api/modasphere/designs/me returns owned and collaborated designs with myRole", async () => {
      const designRes = await request(app)
        .post("/api/modasphere/designs")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ title: "Shared Leather Jacket Design" });

      const designId = designRes.body.data.design._id;

      // Add editor collaborator
      await request(app)
        .post(`/api/modasphere/designs/${designId}/collaborators`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ userId: editor.userId, role: "editor" });

      // Owner fetches /designs/me
      const ownerMe = await request(app)
        .get("/api/modasphere/designs/me")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(ownerMe.statusCode).toBe(200);
      expect(ownerMe.body.data.designs.length).toBe(1);
      expect(ownerMe.body.data.designs[0].myRole).toBe("owner");

      // Editor fetches /designs/me
      const editorMe = await request(app)
        .get("/api/modasphere/designs/me")
        .set("Authorization", `Bearer ${editor.token}`);

      expect(editorMe.statusCode).toBe(200);
      expect(editorMe.body.data.designs.length).toBe(1);
      expect(editorMe.body.data.designs[0].myRole).toBe("editor");
    });

    test("GET /api/modasphere/designs/public excludes private and collaborators-only designs", async () => {
      // 1. Private design
      await Design.create({
        ownerId: owner.userId,
        title: "Private Design",
        visibility: "private",
      });

      // 2. Collaborators-only design
      await Design.create({
        ownerId: owner.userId,
        title: "Collaborators Design",
        visibility: "collaborators",
        collaborators: [{ userId: editor.userId, role: "editor" }],
      });

      // 3. Public design
      await Design.create({
        ownerId: owner.userId,
        title: "Public Avant-Garde Coat",
        category: "outerwear",
        visibility: "public",
      });

      const res = await request(app)
        .get("/api/modasphere/designs/public")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.designs.length).toBe(1);
      expect(res.body.data.designs[0].title).toBe("Public Avant-Garde Coat");
    });
  });

  describe("3. Permission Matrix: Owner / Editor / Viewer / Stranger", () => {
    let designId;

    beforeEach(async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Matrix Test Design",
        visibility: "collaborators",
        collaborators: [
          { userId: editor.userId, role: "editor" },
          { userId: viewer.userId, role: "viewer" },
        ],
        assets: [
          {
            url: "https://res.cloudinary.com/test/sketch.png",
            publicId: "modasphere/designs/sketch_101",
            resourceType: "image",
            fileName: "sketch.png",
            uploadedBy: owner.userId,
          },
        ],
      });
      designId = design._id.toString();
    });

    test("Read permission check (GET /designs/:id)", async () => {
      // Owner can read
      const resOwner = await request(app)
        .get(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${owner.token}`);
      expect(resOwner.statusCode).toBe(200);
      expect(resOwner.body.data.design.myRole).toBe("owner");

      // Editor can read
      const resEditor = await request(app)
        .get(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${editor.token}`);
      expect(resEditor.statusCode).toBe(200);
      expect(resEditor.body.data.design.myRole).toBe("editor");

      // Viewer can read
      const resViewer = await request(app)
        .get(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${viewer.token}`);
      expect(resViewer.statusCode).toBe(200);
      expect(resViewer.body.data.design.myRole).toBe("viewer");

      // Stranger blocked
      const resStranger = await request(app)
        .get(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${stranger.token}`);
      expect(resStranger.statusCode).toBe(403);
    });

    test("Edit permission check (PATCH /designs/:id)", async () => {
      // Editor can edit title/description/tags/category
      const resEditor = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${editor.token}`)
        .send({ title: "Updated Title by Editor" });

      expect(resEditor.statusCode).toBe(200);
      expect(resEditor.body.data.design.title).toBe("Updated Title by Editor");

      // Viewer cannot edit
      const resViewer = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${viewer.token}`)
        .send({ title: "Attempt by Viewer" });

      expect(resViewer.statusCode).toBe(403);

      // Stranger cannot edit
      const resStranger = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${stranger.token}`)
        .send({ title: "Attempt by Stranger" });

      expect(resStranger.statusCode).toBe(403);
    });

    test("Only owner can change status and visibility (editor rejected)", async () => {
      // Editor attempt to change status -> 403
      const resEditorStatus = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${editor.token}`)
        .send({ status: "in_progress" });

      expect(resEditorStatus.statusCode).toBe(403);
      expect(resEditorStatus.body.message).toMatch(
        /Only the design owner can change status or visibility/i
      );

      // Editor attempt to change visibility -> 403
      const resEditorVis = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${editor.token}`)
        .send({ visibility: "public" });

      expect(resEditorVis.statusCode).toBe(403);

      // Owner can change status & visibility
      const resOwner = await request(app)
        .patch(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ status: "in_progress", visibility: "public" });

      expect(resOwner.statusCode).toBe(200);
      expect(resOwner.body.data.design.status).toBe("in_progress");
      expect(resOwner.body.data.design.visibility).toBe("public");
    });

    test("Delete design permission check (DELETE /designs/:id)", async () => {
      // Editor cannot delete -> 403
      const resEditor = await request(app)
        .delete(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${editor.token}`);

      expect(resEditor.statusCode).toBe(403);

      // Owner can delete design
      const resOwner = await request(app)
        .delete(`/api/modasphere/designs/${designId}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(resOwner.statusCode).toBe(200);

      // Verify Cloudinary destroy was called for asset
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "modasphere/designs/sketch_101",
        { resource_type: "image" }
      );
    });
  });

  describe("4. Status Rules & Asset Validation", () => {
    test("Setting status to ready_for_production is rejected with 0 assets", async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Empty Design without Assets",
        status: "draft",
        assets: [],
      });

      const res = await request(app)
        .patch(`/api/modasphere/designs/${design._id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ status: "ready_for_production" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/At least 1 asset is required/i);
    });

    test("Setting status to ready_for_production succeeds when design has >= 1 asset", async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Design with Specs",
        status: "draft",
        assets: [
          {
            url: "https://res.cloudinary.com/test/spec.pdf",
            publicId: "modasphere/designs/spec_doc",
            resourceType: "raw",
            fileName: "spec.pdf",
          },
        ],
      });

      const res = await request(app)
        .patch(`/api/modasphere/designs/${design._id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ status: "ready_for_production" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.design.status).toBe("ready_for_production");
    });
  });

  describe("5. File Uploads & Asset Management", () => {
    let designId;

    beforeEach(async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Upload Test Workspace",
        status: "draft",
        collaborators: [{ userId: editor.userId, role: "editor" }],
      });
      designId = design._id.toString();
    });

    test("Owner and editor can upload image and PDF files", async () => {
      const res = await request(app)
        .post(`/api/modasphere/designs/${designId}/assets`)
        .set("Authorization", `Bearer ${editor.token}`)
        .attach("files", Buffer.from("fake-image-bytes"), "pattern.png")
        .attach("files", Buffer.from("fake-pdf-bytes"), "techpack.pdf");

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      const assets = res.body.data.design.assets;
      expect(assets.length).toBe(2);
      expect(assets.some((a) => a.resourceType === "raw")).toBe(true);
      expect(assets.some((a) => a.resourceType === "image")).toBe(true);
    });

    test("Disallowed file types are rejected by multer filter", async () => {
      const res = await request(app)
        .post(`/api/modasphere/designs/${designId}/assets`)
        .set("Authorization", `Bearer ${owner.token}`)
        .attach("files", Buffer.from("executable-binary"), "malware.exe");

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Only image files and PDFs are allowed/i);
    });
  });

  describe("6. Collaborator Management Rules", () => {
    test("Re-adding an existing collaborator updates their role instead of duplicating", async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Collaborator Test",
        collaborators: [{ userId: editor.userId, role: "viewer" }],
      });

      // Re-add editor with 'editor' role
      const res = await request(app)
        .post(`/api/modasphere/designs/${design._id}/collaborators`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ userId: editor.userId, role: "editor" });

      expect(res.statusCode).toBe(200);
      const collaborators = res.body.data.design.collaborators;
      expect(collaborators.length).toBe(1);
      expect(collaborators[0].role).toBe("editor");
    });

    test("Cannot add owner as collaborator", async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Owner Collab Test",
      });

      const res = await request(app)
        .post(`/api/modasphere/designs/${design._id}/collaborators`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ userId: owner.userId, role: "editor" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Cannot add owner as a collaborator/i);
    });
  });

  describe("7. Design Comments", () => {
    test("Viewer or above can add and read comments", async () => {
      const design = await Design.create({
        ownerId: owner.userId,
        title: "Comment Test Design",
        visibility: "public",
      });

      // Stranger (viewer because public) adds comment
      const commentRes = await request(app)
        .post(`/api/modasphere/designs/${design._id}/comments`)
        .set("Authorization", `Bearer ${stranger.token}`)
        .send({ message: "Love the collar detailing!" });

      expect(commentRes.statusCode).toBe(201);
      expect(commentRes.body.data.comment.message).toBe("Love the collar detailing!");

      // Get comments
      const getCommentsRes = await request(app)
        .get(`/api/modasphere/designs/${design._id}/comments`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(getCommentsRes.statusCode).toBe(200);
      expect(getCommentsRes.body.data.comments.length).toBe(1);
    });
  });
});
