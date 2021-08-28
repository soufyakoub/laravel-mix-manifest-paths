module.exports = {
	collectCoverageFrom: ["src/*.ts"],
	coverageDirectory: "tests/coverage",
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["<rootDir>/tests/**/*.test.ts"],
};
