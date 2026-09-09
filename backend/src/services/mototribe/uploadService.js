const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImageToCloudinary = (fileBuffer, folder = "mototribe/rides") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Cloudinary upload failed: ${error.message}`, 500)
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
 * Deletes an image from Cloudinary by publicId
 * @param {string} publicId
 */
const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
    throw new AppError(
      `Failed to delete image from Cloudinary: ${error.message}`,
      500
    );
  }
};

module.exports = {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
};
