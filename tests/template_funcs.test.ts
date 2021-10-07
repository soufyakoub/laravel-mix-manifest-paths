import path from "path";
import {Config} from "../src/config";

const readManifestCachedMock = jest.fn<Map<string, string>, []>();

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

jest.mock("../src/manifest", () => ({
	...jest.requireActual("../src/manifest"),
	readManifestCached: readManifestCachedMock,
}));

describe("mix", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		const manifest = new Map<string, string>();

		manifest.set("/unversioned.css", "/versioned.css");
		readManifestCachedMock.mockReturnValue(manifest);

		jest.resetModules();
		process.env = {...originalEnv};
	});

	test("returns the versioned public url", async () => {
		const {mix} = await import("../src/template_funcs");

		expect(mix("/unversioned.css")).toBe("/versioned.css");
	});

	test("removes protocol part from config.hot_url", async () => {
		const {default: config} = await import("../src/config");
		const {mix} = await import("../src/template_funcs");

		config.isHot = true;
		config.hot_url = "https://laravel.com/docs";

		expect(mix("/unversioned.css")).toBe("//laravel.com/docs/unversioned.css");

		config.hot_url = "http://laravel.com/docs";

		expect(mix("/unversioned.css")).toBe("//laravel.com/docs/unversioned.css");
	});

	test("ignores empty env.MIX_ASSET_URL", async () => {
		const {mix} = await import("../src/template_funcs");

		process.env.MIX_ASSET_URL = "";

		expect(mix("/unversioned.css")).toBe("/versioned.css");
	});

	test("prepends env.MIX_ASSET_URL", async () => {
		const {mix} = await import("../src/template_funcs");

		process.env.MIX_ASSET_URL = "https://www.test.com";

		expect(mix("/unversioned.css")).toBe("https://www.test.com/versioned.css");
	});

	test("env.MIX_HOT_PROXY_URL takes precedence over config.hot_url", async () => {
		const {default: config} = await import("../src/config");
		const {mix} = await import("../src/template_funcs");

		config.isHot = true;
		config.hot_url = "https://laravel.com/docs";
		process.env.MIX_HOT_PROXY_URL = "https://www.test.com";

		expect(mix("/unversioned.css")).toBe("https://www.test.com/unversioned.css");
	});

	test("throws when the public url doesn't exist in the manifest", async () => {
		const {mix} = await import("../src/template_funcs");

		readManifestCachedMock().clear();

		expect(() => mix("/unversioned.css"))
			.toThrow("Unable to locate Mix file: '/unversioned.css'.");

		expect(() => mix("unversioned.css"))
			.toThrow("Unable to locate Mix file: 'unversioned.css'.");

		expect(() => mix(""))
			.toThrow("Unable to locate Mix file: ''.");

		expect(() => mix("/blabla.js"))
			.toThrow("Unable to locate Mix file: '/blabla.js'.");
	});
});
