const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async function globalSetup() {
  const instance = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000,
    },
  });
  const uri = instance.getUri();
  global.__MONGOINSTANCE = instance;
  process.env.DATABASE_URL = uri;
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = "test";
};
