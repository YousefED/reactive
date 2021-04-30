module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@reactivedata/reactive$": "<rootDir>/packages/reactive-core/src",
  },
};
