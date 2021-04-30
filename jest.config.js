module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    ".*reactivdeactive": "<rootDir>/packages/reactive-core/src",
  },
};
