const crypto = require("crypto");
const path = require("path");
const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

const uploadAcademyTaskSubmission = (fileBuffer, originalName) =>
  new Promise((resolve, reject) => {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);
    const publicId = `${crypto.randomUUID()}_${baseName || "submission"}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "modasphere/academy/task-submissions",
        public_id: publicId,
        resource_type: "raw",
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(
              `Cloudinary task submission upload failed: ${error.message}`,
              502,
            ),
          );
          return;
        }
        if (!result?.secure_url || !result?.public_id) {
          reject(
            new AppError(
              "Cloudinary task submission upload returned an invalid result.",
              502,
            ),
          );
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(fileBuffer);
  });

const deleteAcademyTaskSubmission = async (publicId) => {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError("Unable to remove the previous task submission.", 502);
  }
};

module.exports = {
  uploadAcademyTaskSubmission,
  deleteAcademyTaskSubmission,
};
