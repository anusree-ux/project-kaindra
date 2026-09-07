const cloudinary = require("cloudinary").v2;
const env = require("./environment");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: env.cloudinary.apiKey || process.env.CLOUDINARY_API_KEY,
  api_secret: env.cloudinary.apiSecret || process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
