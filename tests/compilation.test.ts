import crypto from "crypto";
import fs from "fs";
import path from "path";
import EventEmitter from "events";
import {sortBy} from "lodash";
import mock_fs from "mock-fs";
import {DepGraph} from "dependency-graph";
import laravel_mix from "laravel-mix";
import {build, watch} from "../src/compilation";
import {defaultOptions} from "../src/options";
import {ResolvedEntry} from "../src/helpers";

jest.mock("chokidar", () => ({
	watch: () => new EventEmitter(),
}));

beforeEach(() => {
	mock_fs({
		resources: {
			"a.txt": "random txt {{mix('/txt/b.txt')}} qsdh"
			+ "\n{{mix('/txt/sub/b.txt')}}",
			"b.txt": "blabla {{mix('/js/app.js')}}"
			+ "\nmore blabla {{mix('/css/app.css')}}"
			+ "\n{{! mix('/txt/<c>.txt') !}}",
			"sub": {
				"<c>.txt": "ufhqfjh {{mix('/README.md')}}"
				+ "\nergtseyerqei zeot h zei",
				"d.txt": "ufhqfjh {{mix('/README.md')}}"
				+ "\nergtseyerqei zeot h zei"
				+ "\n1234567UFDF {{mix('/txt/a.txt')}}",
			},
		},
		public: {
			"mix-manifest.json": JSON.stringify({
				"/js/app.js": "/js/app.js?id=752e64981810d0203520",
				"/css/app.css": "/css/app.css?id=68b329da9893e34099c7",
				"/README.md": "/README.md?id=bf15a78c28f46e55abc5",
			}),
		},
	});
});

afterEach(() => {
	mock_fs.restore();
});

laravel_mix.setPublicPath("public");
laravel_mix.version();

export function md5(content: string, length?: number) {
	return crypto
		.createHash("md5")
		.update(content)
		.digest("hex")
		.slice(0, length);
}

const entries: ResolvedEntry[] = [
	{
		src: path.resolve("resources/a.txt"),
		dest: path.resolve("public/txt/a.txt"),
		public_url: "/txt/a.txt",
		options: {...defaultOptions},
	},
	{
		src: path.resolve("resources/b.txt"),
		dest: path.resolve("public/txt/b.txt"),
		public_url: "/txt/b.txt",
		options: {...defaultOptions},
	},
	{
		src: path.resolve("resources/b.txt"),
		dest: path.resolve("public/txt/sub/b.txt"),
		public_url: "/txt/sub/b.txt",
		options: {...defaultOptions},
	},
	{
		src: path.resolve("resources/sub/<c>.txt"),
		dest: path.resolve("public/txt/<c>.txt"),
		public_url: "/txt/<c>.txt",
		options: {...defaultOptions},
	},
	{
		src: path.resolve("resources/sub/d.txt"),
		dest: path.resolve("public/txt/d.txt"),
		public_url: "/txt/d.txt",
		options: {...defaultOptions},
	},
];

test("build", () => {
	const depGraph = build(entries);

	const manifest_str = fs.readFileSync("public/mix-manifest.json", "utf-8");
	const manifest = JSON.parse(manifest_str) as unknown;
	const a = fs.readFileSync("public/txt/a.txt", "utf-8");
	const b = fs.readFileSync("public/txt/b.txt", "utf-8");
	const sub_b = fs.readFileSync("public/txt/sub/b.txt", "utf-8");
	const c = fs.readFileSync("public/txt/<c>.txt", "utf-8");
	const d = fs.readFileSync("public/txt/d.txt", "utf-8");

	const expected_c = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei";
	const expected_b = "blabla /js/app.js?id=752e64981810d0203520"
		+ "\nmore blabla /css/app.css?id=68b329da9893e34099c7"
		+ `\n/txt/&lt;c&gt;.txt?id=${md5(expected_c, 20)}`;
	const expected_sub_b = expected_b;
	const expected_a = `random txt /txt/b.txt?id=${md5(expected_b, 20)} qsdh`
	+ `\n/txt/sub/b.txt?id=${md5(expected_sub_b, 20)}`;
	const expected_d = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei"
		+ `\n1234567UFDF /txt/a.txt?id=${md5(expected_a, 20)}`;
	const expectedManifest = {
		"/js/app.js": "/js/app.js?id=752e64981810d0203520",
		"/css/app.css": "/css/app.css?id=68b329da9893e34099c7",
		"/README.md": "/README.md?id=bf15a78c28f46e55abc5",
		"/txt/a.txt": `/txt/a.txt?id=${md5(expected_a, 20)}`,
		"/txt/b.txt": `/txt/b.txt?id=${md5(expected_b, 20)}`,
		"/txt/sub/b.txt": `/txt/sub/b.txt?id=${md5(expected_sub_b, 20)}`,
		"/txt/<c>.txt": `/txt/<c>.txt?id=${md5(expected_c, 20)}`,
		"/txt/d.txt": `/txt/d.txt?id=${md5(expected_d, 20)}`,
	};

	expect(b).toBe(expected_b);
	expect(sub_b).toBe(expected_b);
	expect(a).toBe(expected_a);
	expect(c).toBe(expected_c);
	expect(d).toBe(expected_d);
	expect(manifest).toEqual(expectedManifest);

	const directDependenciesOf = depGraph.directDependenciesOf.bind(depGraph);

	// b--->c
	// ^	^
	// |	|
	// a--->sub/b
	// ^
	// |
	// d
	expect(directDependenciesOf("/txt/d.txt")).toEqual(["/txt/a.txt"]);
	expect(directDependenciesOf("/txt/a.txt").sort()).toEqual(["/txt/b.txt", "/txt/sub/b.txt"]);
	expect(directDependenciesOf("/txt/b.txt")).toEqual(["/txt/<c>.txt"]);
	expect(directDependenciesOf("/txt/sub/b.txt")).toEqual(["/txt/<c>.txt"]);
	expect(directDependenciesOf("/txt/<c>.txt")).toEqual([]);
	expect(depGraph.size()).toBe(5);
});

test("watch", () => {
	const build_c = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei";
	const build_b = "blabla /js/app.js?id=752e64981810d0203520"
		+ "\nmore blabla /css/app.css?id=68b329da9893e34099c7"
		+ `\n/txt/&lt;c&gt;.txt?id=${md5(build_c, 20)}`;
	const build_sub_b = build_b;
	const build_a = `random txt /txt/b.txt?id=${md5(build_b, 20)} qsdh`
	+ `\n/txt/sub/b.txt?id=${md5(build_sub_b, 20)}`;
	const build_d = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei"
		+ `\n1234567UFDF /txt/a.txt?id=${md5(build_a, 20)}`;
	const buildManifest = {
		"/js/app.js": "/js/app.js?id=752e64981810d0203520",
		"/css/app.css": "/css/app.css?id=68b329da9893e34099c7",
		"/README.md": "/README.md?id=bf15a78c28f46e55abc5",
		"/txt/a.txt": `/txt/a.txt?id=${md5(build_a, 20)}`,
		"/txt/b.txt": `/txt/b.txt?id=${md5(build_b, 20)}`,
		"/txt/sub/b.txt": `/txt/sub/b.txt?id=${md5(build_b, 20)}`,
		"/txt/<c>.txt": `/txt/<c>.txt?id=${md5(build_c, 20)}`,
		"/txt/d.txt": `/txt/d.txt?id=${md5(build_d, 20)}`,
	};

	const depGraph = new DepGraph<ResolvedEntry>();

	for (const entry of entries) {
		depGraph.addNode(entry.public_url, entry);
	}

	// b--->c
	// ^	^
	// |	|
	// a--->sub/b
	// ^
	// |
	// d
	depGraph.addDependency("/txt/d.txt", "/txt/a.txt");
	depGraph.addDependency("/txt/a.txt", "/txt/b.txt");
	depGraph.addDependency("/txt/a.txt", "/txt/sub/b.txt");
	depGraph.addDependency("/txt/b.txt", "/txt/<c>.txt");
	depGraph.addDependency("/txt/sub/b.txt", "/txt/<c>.txt");

	fs.mkdirSync("public/txt/sub", {recursive: true});
	fs.writeFileSync("public/txt/a.txt", build_b);
	fs.writeFileSync("public/txt/b.txt", build_a);
	fs.writeFileSync("public/txt/sub/b.txt", build_sub_b);
	fs.writeFileSync("public/txt/<c>.txt", build_c);
	fs.writeFileSync("public/txt/d.txt", build_d);
	fs.writeFileSync("public/mix-manifest.json", JSON.stringify(buildManifest));

	const watcher = watch(entries, depGraph);
	const updated_b = "blabla {{mix('/js/app.js')}}"
		+ "\nmore blabla {{mix('/css/app.css')}}";

	fs.writeFileSync("resources/b.txt", updated_b);

	const onEntryCompiled = jest.fn();

	watcher.on("entry-compiled", onEntryCompiled);
	watcher.emit("change", path.resolve("resources/b.txt"));

	const manifest_str = fs.readFileSync("public/mix-manifest.json", "utf-8");
	const manifest = JSON.parse(manifest_str) as unknown;
	const a = fs.readFileSync("public/txt/a.txt", "utf-8");
	const b = fs.readFileSync("public/txt/b.txt", "utf-8");
	const sub_b = fs.readFileSync("public/txt/sub/b.txt", "utf-8");
	const c = fs.readFileSync("public/txt/<c>.txt", "utf-8");
	const d = fs.readFileSync("public/txt/d.txt", "utf-8");

	const expected_c = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei";
	const expected_b = "blabla /js/app.js?id=752e64981810d0203520"
		+ "\nmore blabla /css/app.css?id=68b329da9893e34099c7";
	const expected_sub_b = expected_b;
	const expected_a = `random txt /txt/b.txt?id=${md5(expected_b, 20)} qsdh`
	+ `\n/txt/sub/b.txt?id=${md5(expected_sub_b, 20)}`;
	const expected_d = "ufhqfjh /README.md?id=bf15a78c28f46e55abc5"
		+ "\nergtseyerqei zeot h zei"
		+ `\n1234567UFDF /txt/a.txt?id=${md5(expected_a, 20)}`;
	const expectedManifest = {
		"/js/app.js": "/js/app.js?id=752e64981810d0203520",
		"/css/app.css": "/css/app.css?id=68b329da9893e34099c7",
		"/README.md": "/README.md?id=bf15a78c28f46e55abc5",
		"/txt/a.txt": `/txt/a.txt?id=${md5(expected_a, 20)}`,
		"/txt/b.txt": `/txt/b.txt?id=${md5(expected_b, 20)}`,
		"/txt/sub/b.txt": `/txt/sub/b.txt?id=${md5(expected_sub_b, 20)}`,
		"/txt/<c>.txt": `/txt/<c>.txt?id=${md5(expected_c, 20)}`,
		"/txt/d.txt": `/txt/d.txt?id=${md5(expected_d, 20)}`,
	};

	expect(b).toBe(expected_b);
	expect(sub_b).toBe(expected_b);
	expect(a).toBe(expected_a);
	expect(c).toBe(expected_c);
	expect(d).toBe(expected_d);
	expect(manifest).toEqual(expectedManifest);

	const directDependenciesOf = depGraph.directDependenciesOf.bind(depGraph);

	// b	c
	// ^
	// |
	// a--->sub/b
	// ^
	// |
	// d
	expect(directDependenciesOf("/txt/d.txt")).toEqual(["/txt/a.txt"]);
	expect(directDependenciesOf("/txt/a.txt").sort()).toEqual(["/txt/b.txt", "/txt/sub/b.txt"]);
	expect(directDependenciesOf("/txt/b.txt")).toEqual([]);
	expect(directDependenciesOf("/txt/sub/b.txt")).toEqual([]);
	expect(directDependenciesOf("/txt/<c>.txt")).toEqual([]);
	expect(depGraph.size()).toBe(5);

	const calls = onEntryCompiled.mock.calls;
	const expectedCalls: [ResolvedEntry, string][] = [
		[
			{
				src: path.resolve("resources/a.txt"),
				dest: path.resolve("public/txt/a.txt"),
				public_url: "/txt/a.txt",
				options: {...defaultOptions},
			},
			expected_a,
		],
		[
			{
				src: path.resolve("resources/b.txt"),
				dest: path.resolve("public/txt/b.txt"),
				public_url: "/txt/b.txt",
				options: {...defaultOptions},
			},
			expected_b,
		],
		[
			{
				src: path.resolve("resources/b.txt"),
				dest: path.resolve("public/txt/sub/b.txt"),
				public_url: "/txt/sub/b.txt",
				options: {...defaultOptions},
			},
			expected_sub_b,
		],
		[
			{
				src: path.resolve("resources/sub/d.txt"),
				dest: path.resolve("public/txt/d.txt"),
				public_url: "/txt/d.txt",
				options: {...defaultOptions},
			},
			expected_d,
		],
	];

	expect(sortBy(calls, "[0].dest")).toEqual(sortBy(expectedCalls, "[0].dest"));
});
