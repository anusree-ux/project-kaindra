const request = require("supertest");
const app = require("../../src/app");
const Admin = require("../../src/models/core/Admin");
const NewsPost = require("../../src/models/core/NewsPost");
const { signAccessToken } = require("../../src/utils/jwt");
const { createTestUser } = require("../helpers/testUser");
const cloudinary = require("../../src/config/cloudinary");

describe("News and Blogs API", () => {
  let admin;
  let adminToken;

  beforeEach(async () => {
    admin = await Admin.create({
      email: `news-admin-${Date.now()}-${Math.random()}@example.com`,
      password: "test-password-123",
    });
    adminToken = signAccessToken({ id: admin._id, role: "admin" });
  });

  test("public visitors can only list and retrieve published posts", async () => {
    const [published, draft] = await NewsPost.create([
      {
        title: "Published story",
        description: "A public summary",
        content: "Published article content",
        status: "published",
        publishedAt: new Date(),
        createdBy: admin._id,
      },
      {
        title: "Private draft",
        description: "An admin-only summary",
        content: "Draft article content",
        status: "draft",
        createdBy: admin._id,
      },
    ]);

    const listResponse = await request(app).get("/api/news");
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data.posts.map((post) => post._id)).toEqual([
      published.id,
    ]);

    const articleResponse = await request(app).get(`/api/news/${published.id}`);
    expect(articleResponse.statusCode).toBe(200);
    expect(articleResponse.body.data.post.content).toBe(
      "Published article content"
    );

    const draftResponse = await request(app).get(`/api/news/${draft.id}`);
    expect(draftResponse.statusCode).toBe(404);
  });

  test("admin-only endpoints reject unauthenticated and non-admin users", async () => {
    const unauthenticatedResponse = await request(app).get("/api/news/admin");
    expect(unauthenticatedResponse.statusCode).toBe(401);

    const { token } = await createTestUser();
    const nonAdminResponse = await request(app)
      .get("/api/news/admin")
      .set("Authorization", `Bearer ${token}`);
    expect(nonAdminResponse.statusCode).toBe(403);
  });

  test("admin can create, publish, edit, unpublish, and delete a post", async () => {
    const createResponse = await request(app)
      .post("/api/news/admin")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "New story",
        description: "A short summary",
        content: "A longer article body.",
      });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.data.post.status).toBe("draft");
    const postId = createResponse.body.data.post._id;

    const publishResponse = await request(app)
      .patch(`/api/news/admin/${postId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "published" });
    expect(publishResponse.statusCode).toBe(200);
    expect(publishResponse.body.data.post.publishedAt).toBeTruthy();

    const editResponse = await request(app)
      .put(`/api/news/admin/${postId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Updated story",
        description: "Updated summary",
        content: "Updated article body.",
        imageUrl: "",
      });
    expect(editResponse.statusCode).toBe(200);
    expect(editResponse.body.data.post.title).toBe("Updated story");

    const unpublishResponse = await request(app)
      .patch(`/api/news/admin/${postId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "draft" });
    expect(unpublishResponse.statusCode).toBe(200);
    expect(unpublishResponse.body.data.post.publishedAt).toBeNull();

    const hiddenArticleResponse = await request(app).get(`/api/news/${postId}`);
    expect(hiddenArticleResponse.statusCode).toBe(404);

    const deleteResponse = await request(app)
      .delete(`/api/news/admin/${postId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(await NewsPost.findById(postId)).toBeNull();
  });

  test("admin can upload a supported cover image and saves its Cloudinary URL", async () => {
    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => ({
      end: jest.fn(() =>
        callback(null, {
          secure_url: "https://res.cloudinary.com/test/news-covers/cover.webp",
          public_id: "kaindra/news-covers/cover",
        })
      ),
    }));

    const response = await request(app)
      .post("/api/news/admin")
      .set("Authorization", "Bearer " + adminToken)
      .field("title", "Cover image story")
      .field("description", "A story with an uploaded cover")
      .field("content", "Article content.")
      .attach("image", Buffer.from("test image"), {
        filename: "cover.webp",
        contentType: "image/webp",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.post.imageUrl).toBe(
      "https://res.cloudinary.com/test/news-covers/cover.webp"
    );

    const savedPost = await NewsPost.findById(response.body.data.post._id);
    expect(savedPost.imageUrl).toBe(response.body.data.post.imageUrl);
  });

  test("admin cover image upload rejects unsupported file types", async () => {
    const response = await request(app)
      .post("/api/news/admin")
      .set("Authorization", "Bearer " + adminToken)
      .field("title", "Unsupported cover")
      .field("description", "A story with an unsupported cover")
      .field("content", "Article content.")
      .attach("image", Buffer.from("not an image"), {
        filename: "cover.gif",
        contentType: "image/gif",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/JPG, JPEG, PNG, or WebP/i);
  });

  test("admin news statistics count posts published in the last 30 days", async () => {
    await NewsPost.create([
      {
        title: "Recent",
        description: "Recent summary",
        content: "Recent content",
        status: "published",
        publishedAt: new Date(),
        createdBy: admin._id,
      },
      {
        title: "Old",
        description: "Old summary",
        content: "Old content",
        status: "published",
        publishedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
      },
      {
        title: "Draft",
        description: "Draft summary",
        content: "Draft content",
        status: "draft",
        createdBy: admin._id,
      },
    ]);

    const response = await request(app)
      .get("/api/news/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual({
      totalPosts: 3,
      publishedPosts: 2,
      drafts: 1,
      recentlyPublished: 1,
    });
  });

  test("malformed post IDs return not found instead of a server error", async () => {
    const response = await request(app)
      .put("/api/news/admin/not-an-object-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Updated",
        description: "Updated summary",
        content: "Updated content",
      });

    expect(response.statusCode).toBe(404);
  });
});
