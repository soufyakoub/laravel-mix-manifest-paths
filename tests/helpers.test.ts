import fs from "fs";
import path from "path";
import mock_fs from "mock-fs";
import {defaultOptions} from "../src/options";
import {Config} from "../src/config";
import {merge, sortBy} from "lodash";
import {
	cacheClearableMemoize,
	RawEntry,
	ResolvedEntry,
	resolveRawEntries,
	resolveRawEntry,
} from "../src/helpers";

jest.mock("../src/config", () => {
	const mockConfig: Config = {
		public_dir: path.resolve("public"),
		manifest_path: path.resolve("public", "mix-manifest.json"),
		isHot: false,
		hot_url: null,
		isWatching: false,
		usePolling: false,
		useVersioning: false,
	};

	return mockConfig;
});

beforeEach(() => {
	mock_fs({
		resources: {
			js: {
				"1.js": "",
				"2.jsx": "",
			},
			ts: {
				"1.ts": "",
				"2.tsx": "",
			},
		},
	});
});

afterEach(() => {
	mock_fs.restore();
});

describe("cacheClearableMemoize", () => {
	test("clears internal cache", () => {
		const fn = () => ({});

		const memoizedFn = cacheClearableMemoize(fn);

		const result1 = memoizedFn();
		const result2 = memoizedFn();

		expect(result1).toBe(result2);

		memoizedFn.cache.clear();

		const result3 = memoizedFn();
		const result4 = memoizedFn();

		expect(result3).not.toBe(result1);
		expect(result3).toBe(result4);
	});
});

describe("resolveEntry", () => {
	test("flattens dest paths", () => {
		const rawEntry: RawEntry = {
			from: "resources/**",
			to: "public",
			options: {...defaultOptions},
		};

		let expectedEntries: ResolvedEntry[] = [
			{
				src: path.resolve("resources/js/1.js"),
				dest: path.resolve("public/1.js"),
				public_url: "/1.js",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/js/2.jsx"),
				dest: path.resolve("public/2.jsx"),
				public_url: "/2.jsx",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/ts/1.ts"),
				dest: path.resolve("public/1.ts"),
				public_url: "/1.ts",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/ts/2.tsx"),
				dest: path.resolve("public/2.tsx"),
				public_url: "/2.tsx",
				options: {...rawEntry.options},
			},
		];

		let entries = resolveRawEntry(rawEntry);

		entries = sortBy(entries, "dest");
		expectedEntries = sortBy(expectedEntries, "dest");

		expect(entries).toEqual(expectedEntries);
	});

	test("keeps structure of files in the glob's parent dir", () => {
		const rawEntry: RawEntry = {
			from: "resources/**",
			to: "public",
			options: {...defaultOptions, flatten: false},
		};

		let expectedEntries: ResolvedEntry[] = [
			{
				src: path.resolve("resources/js/1.js"),
				dest: path.resolve("public/js/1.js"),
				public_url: "/js/1.js",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/js/2.jsx"),
				dest: path.resolve("public/js/2.jsx"),
				public_url: "/js/2.jsx",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/ts/1.ts"),
				dest: path.resolve("public/ts/1.ts"),
				public_url: "/ts/1.ts",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/ts/2.tsx"),
				dest: path.resolve("public/ts/2.tsx"),
				public_url: "/ts/2.tsx",
				options: {...rawEntry.options},
			},
		];

		let entries = resolveRawEntry(rawEntry);

		entries = sortBy(entries, "dest");
		expectedEntries = sortBy(expectedEntries, "dest");

		expect(entries).toEqual(expectedEntries);
	});

	test("merges options with defaultOptions", () => {
		const rawEntry: RawEntry = {
			from: "resources/js/**",
			to: "public",
			options: merge(
				{},
				defaultOptions,
				{delimiters: {left: "<<"}},
			),
		};

		let expectedEntries: ResolvedEntry[] = [
			{
				src: path.resolve("resources/js/1.js"),
				dest: path.resolve("public/1.js"),
				public_url: "/1.js",
				options: {...rawEntry.options},
			},
			{
				src: path.resolve("resources/js/2.jsx"),
				dest: path.resolve("public/2.jsx"),
				public_url: "/2.jsx",
				options: {...rawEntry.options},
			},
		];

		let entries = resolveRawEntry(rawEntry);

		entries = sortBy(entries, "dest");
		expectedEntries = sortBy(expectedEntries, "dest");

		expect(entries).toEqual(expectedEntries);
	});
});

describe("resolveEntries", () => {
	test("later entry overrides previous entry with same dest", () => {
		fs.writeFileSync("resources/1.js", "");

		const rawEntries: RawEntry[] = [
			{from: "resources/js/**", to: "public", options: {...defaultOptions}},
			{from: "resources/ts/**", to: "public", options: {...defaultOptions}},
			{from: "resources/1.js", to: "public", options: {...defaultOptions, flatten: false}},
		];

		let expectedEntries: ResolvedEntry[] = [
			{
				src: path.resolve("resources/1.js"),
				dest: path.resolve("public/1.js"),
				public_url: "/1.js",
				options: {...defaultOptions, flatten: false},
			},
			{
				src: path.resolve("resources/js/2.jsx"),
				dest: path.resolve("public/2.jsx"),
				public_url: "/2.jsx",
				options: {...defaultOptions},
			},
			{
				src: path.resolve("resources/ts/1.ts"),
				dest: path.resolve("public/1.ts"),
				public_url: "/1.ts",
				options: {...defaultOptions},
			},
			{
				src: path.resolve("resources/ts/2.tsx"),
				dest: path.resolve("public/2.tsx"),
				public_url: "/2.tsx",
				options: {...defaultOptions},
			},
		];

		let entries = resolveRawEntries(rawEntries);

		entries = sortBy(entries, "dest");
		expectedEntries = sortBy(expectedEntries, "dest");

		expect(entries).toEqual(expectedEntries);
	});
});
