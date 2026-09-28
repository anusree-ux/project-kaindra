module.exports = {
  testEnvironment: "node",
  globalSetup: "<rootDir>/tests/globalSetup.js",
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 60000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
