const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

/**
 * Uploads an image buffer to Cloudinary under the ModaSphere products directory
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadProductImage = (fileBuffer, folder = "modasphere/products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Cloudinary product image upload failed: ${error.message}`, 500)
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
 * Deletes a product image from Cloudinary by publicId
 * @param {string} publicId
 */
const deleteProductImage = async (publicId) => {
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
  uploadProductImage,
  deleteProductImage,
};
