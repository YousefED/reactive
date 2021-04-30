module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    reactive: "<rootDir>/packages/reactive-core/src",
  },
};
