module.exports = {
  preset: "tsd-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "@reactivedata/reactive": "<rootDir>/packages/resactive-core/src",
  },
};
