import path from "path";
import fs from "fs";
import mock_fs from "mock-fs";
import config, {Config} from "../src/config";
import {readManifest, writeManifest} from "../src/manifest";

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
	mock_fs();
});

afterEach(() => {
	mock_fs.restore();
});

test("reads manifest from FS", () => {
	const manifestJSON = {
		"/unversioned.css": "/versioned.css",
		"/unversioned.js": "/versioned.js",
	};

	fs.mkdirSync(path.dirname(config.manifest_path), {recursive: true});
	fs.writeFileSync(config.manifest_path, JSON.stringify(manifestJSON));

	const manifestMap = readManifest();

	expect(manifestMap.get("/unversioned.css")).toBe("/versioned.css");
	expect(manifestMap.get("/unversioned.js")).toBe("/versioned.js");
	expect(manifestMap.size).toBe(2);
});

test("writes manifest to FS", () => {
	const manifestMap = new Map([
		["/unversioned.css", "/versioned.css"],
		["/unversioned.js", "/versioned.js"],
	]);

	writeManifest(manifestMap);

	const manifest_content = fs.readFileSync(config.manifest_path, "utf-8");
	const manifestJSON = JSON.parse(manifest_content) as unknown;

	expect(manifestJSON).toEqual({
		"/unversioned.css": "/versioned.css",
		"/unversioned.js": "/versioned.js",
	});
});
