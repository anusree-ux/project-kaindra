module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 60000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
