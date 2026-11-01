const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

const CLOUDINARY_REVIEWS_FOLDER =
  process.env.CLOUDINARY_REVIEWS_FOLDER || "kaindra_modamart_reviews";

/**
 * Uploads a review image buffer to Cloudinary under the dedicated ModaMart reviews directory
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadReviewImage = (fileBuffer, folder = CLOUDINARY_REVIEWS_FOLDER) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Cloudinary review image upload failed: ${error.message}`, 500)
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
 * Deletes a review image from Cloudinary by publicId
 * @param {string} publicId
 */
const deleteReviewImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Failed to delete Cloudinary review image ${publicId}:`, error);
    throw new AppError(
      `Failed to delete image from Cloudinary: ${error.message}`,
      500
    );
  }
};

module.exports = {
  uploadReviewImage,
  deleteReviewImage,
  CLOUDINARY_REVIEWS_FOLDER,
};
