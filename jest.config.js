module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: false,
      diagnostics: false,
      diagnostics: {
        pathRegex: /\.(spec|test)\.ts$/,
      }
    },
    SpreadsheetApp: {},
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleDirectories: [
    'node_modules',
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
}