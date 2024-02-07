module.exports = {
	collectCoverageFrom: ["src/*.ts"],
	coverageDirectory: "tests/coverage",
	preset: "ts-jest/presets/js-with-ts",
	testEnvironment: "node",
	testMatch: ["<rootDir>/tests/**/*.test.ts"],
	transformIgnorePatterns: [
		`/node_modules/(?!url-join)`,
	],
};
