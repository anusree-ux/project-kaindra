const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "default_dev_secret_key_change_me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  database: {
    url: process.env.DATABASE_URL || "mongodb://localhost:27017/kaindra",
  },
};
