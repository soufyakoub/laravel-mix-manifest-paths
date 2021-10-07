import path from "path";
import {exec} from "child_process";
import {promisify} from "util";
import stringToArgv from "string-argv";
import {Api} from "laravel-mix";

const originalArgv = process.argv;

jest.setTimeout(15000);

beforeEach(() => {
	jest.resetModules();
	process.argv = {...originalArgv};
});

// laravel-mix's cli launches a webpack sub process
// used to execute the webpack.mix.js config.
async function deriveWebpackArgv(command: string) {
	interface Dump {
		script: string;
		env: {
			NODE_ENV: string;
			MIX_FILE: string;
		};
	}

	const execPromise = promisify(exec);
	const env = {...process.env, TESTING: "true"};
	const {stdout} = await execPromise(command, {env});
	const dump = JSON.parse(stdout) as Dump;

	return stringToArgv(dump.script);
}

describe("build mode", () => {
	test("defaults to cwd as public dir", async () => {
		process.argv = await deriveWebpackArgv("npx mix");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: false,
			isHot: false,
			usePolling: false,
			useVersioning: false,
			hot_url: null,
		});
	});

	test("sets public_dir to 'public'", async () => {
		process.argv = await deriveWebpackArgv("npx mix");

		const {default: config} = await import("../src/config");

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.setPublicPath("public");

		expect(config).toEqual({
			public_dir: path.resolve("public"),
			manifest_path: path.resolve("public", "mix-manifest.json"),
			isWatching: false,
			isHot: false,
			usePolling: false,
			useVersioning: false,
			hot_url: null,
		});
	});

	test("uses versioning", async () => {
		process.argv = await deriveWebpackArgv("npx mix");

		const {default: config} = await import("../src/config");

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.version();

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: false,
			isHot: false,
			usePolling: false,
			useVersioning: true,
			hot_url: null,
		});
	});

	test("doesn't use versioning in production unless required", async () => {
		process.argv = await deriveWebpackArgv("npx mix -p");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: false,
			isHot: false,
			usePolling: false,
			useVersioning: false,
			hot_url: null,
		});

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.version();

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: false,
			isHot: false,
			usePolling: false,
			useVersioning: true,
			hot_url: null,
		});
	});
});

describe("watch mode", () => {
	test("defaults to cwd as public dir", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: false,
			usePolling: false,
			useVersioning: false,
			hot_url: null,
		});
	});

	test("sets public_dir to 'public'", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch");

		const {default: config} = await import("../src/config");

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.setPublicPath("public");

		expect(config).toEqual({
			public_dir: path.resolve("public"),
			manifest_path: path.resolve("public", "mix-manifest.json"),
			isWatching: true,
			isHot: false,
			usePolling: false,
			useVersioning: false,
			hot_url: null,
		});
	});

	test("uses versioning", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch");

		const {default: config} = await import("../src/config");

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.version();

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: false,
			usePolling: false,
			useVersioning: true,
			hot_url: null,
		});
	});

	test("uses hot module replacement", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch --hot");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: true,
			usePolling: false,
			useVersioning: false,
			hot_url: "http://localhost:8080",
		});
	});

	test("uses hot module replacement with https", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch --hot --https");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: true,
			usePolling: false,
			useVersioning: false,
			hot_url: "https://localhost:8080",
		});
	});

	test("does not use versioning when using hot module replacement", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch --hot --https");

		const {default: config} = await import("../src/config");

		// the dynamic import function doesn't provide type safety here,
		// the resolved type is the webpack's Stats interface.
		// no idea why though.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const laravel_mix = require("laravel-mix") as Api;

		laravel_mix.version();

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: true,
			usePolling: false,
			useVersioning: false,
			hot_url: "https://localhost:8080",
		});
	});

	test("uses polling", async () => {
		process.argv = await deriveWebpackArgv("npx mix watch -- --watch-options-poll=1000");

		const {default: config} = await import("../src/config");

		expect(config).toEqual({
			public_dir: path.resolve("."),
			manifest_path: path.resolve("mix-manifest.json"),
			isWatching: true,
			isHot: false,
			usePolling: true,
			useVersioning: false,
			hot_url: null,
		});
	});
});
