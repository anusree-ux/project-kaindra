const cloudinary = require("../../config/cloudinary");
const AppError = require("../../utils/AppError");

const uploadNewsCoverImage = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kaindra/news-covers",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(
              `Cloudinary news cover upload failed: ${error.message}`,
              502
            )
          );
          return;
        }

        if (!result?.secure_url) {
          reject(
            new AppError(
              "Cloudinary news cover upload returned an invalid result.",
              502
            )
          );
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });

module.exports = { uploadNewsCoverImage };
