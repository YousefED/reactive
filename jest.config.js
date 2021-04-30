module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    "@reactivedata/reactive": "<rootDir>/packages/resactive-core/src",
  },
};
