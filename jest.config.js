module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    reactive: "<rootDir>/packages/resactive-core/src",
  },
};
