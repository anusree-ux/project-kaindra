const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

/**
 * Uploads a design asset buffer (image or PDF) to Cloudinary under modasphere/designs
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @param {string} originalname
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string, resourceType: string, fileName: string}>}
 */
const uploadDesignAsset = (
  fileBuffer,
  mimetype,
  originalname = "asset",
  folder = "modasphere/designs"
) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";

    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new AppError(
              `Cloudinary design asset upload failed: ${error.message}`,
              500
            )
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType,
          fileName: originalname,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a design asset from Cloudinary using publicId and resourceType
 * @param {string} publicId
 * @param {string} resourceType - "image" | "raw"
 */
const deleteDesignAsset = async (publicId, resourceType = "image") => {
  try {
    const targetResourceType = ["image", "raw"].includes(resourceType)
      ? resourceType
      : "image";
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: targetResourceType,
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    throw new AppError(
      `Failed to delete asset from Cloudinary: ${error.message}`,
      500
    );
  }
};

module.exports = {
  uploadDesignAsset,
  deleteDesignAsset,
};
