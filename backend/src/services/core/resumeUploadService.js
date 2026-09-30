const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

/**
 * Uploads a resume buffer to Cloudinary as a raw file.
 * Raw preserves the original binary (PDF, DOCX, etc.) without any transformation.
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadResumeToCloudinary = (fileBuffer, originalName = "resume") => {
  return new Promise((resolve, reject) => {
    // Strip the file extension so Cloudinary doesn't double it
    // e.g. "Shreya_Resume.pdf" → "Shreya_Resume"
    const baseName = originalName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `${Date.now()}_${baseName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kaindra/resumes",
        resource_type: "raw",
        public_id: publicId,
        // Do NOT set format — Cloudinary auto-appends the original extension for raw files
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Cloudinary resume upload failed: ${error.message}`, 500)
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a resume file from Cloudinary by publicId
 * @param {string} publicId
 */
const deleteResumeFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;
    // Raw files need resource_type: "raw" for deletion
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error(`Failed to delete Cloudinary resume ${publicId}:`, error);
  }
};

module.exports = {
  uploadResumeToCloudinary,
  deleteResumeFromCloudinary,
};
