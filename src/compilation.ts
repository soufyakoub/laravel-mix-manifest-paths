import fs from "fs";
import chokidar from "chokidar";
import {escapeRegExp, intersection, template, TemplateExecutor} from "lodash";
import {DepGraph} from "dependency-graph";
import {hashContent, readManifestCached, writeManifest} from "./manifest";
import config from "./config";
import {mix} from "./template_funcs";
import path from "path";
import {cacheClearableMemoize, ResolvedEntry} from "./helpers";

export type OnEntryCompiled = (entry: ResolvedEntry, output: string) => void;

export type CompilationWatcher = chokidar.FSWatcher & {
	on(event: "entry-compiled", listener: OnEntryCompiled): CompilationWatcher;
};

function getTemplate(entry: ResolvedEntry): TemplateExecutor {
	const content = fs.readFileSync(entry.src, "utf-8");
	const {right: r, left: l} = entry.options.delimiters;
	const e_r = escapeRegExp(r);
	const e_l = escapeRegExp(l);
	const templateOptions = {
		interpolate: new RegExp(`${e_l}(.+?)${e_r}`, "g"),
		escape: new RegExp(`${e_l}!(.+?)!${e_r}`, "g"),
		evaluate: null,
	};

	// @ts-expect-error `templateOptions.evaluate` should accept `null`.
	// eslint-disable-next-line max-len
	// see https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/test/template.js#L226
	return template(content, templateOptions);
}

const getTemplateCached = cacheClearableMemoize(getTemplate, (entry) => entry.src);

function collectDeps(entry: ResolvedEntry, depGraph: DepGraph<ResolvedEntry>) {
	const oldDeps = depGraph.directDependenciesOf(entry.public_url);

	for (const oldDep of oldDeps) {
		depGraph.removeDependency(entry.public_url, oldDep);
	}

	const depCollector = (public_url: string) => {
		if (!depGraph.hasNode(public_url)) {
			return;
		}

		const dependency = depGraph.getNodeData(public_url);

		depGraph.addDependency(entry.public_url, dependency.public_url);
	};

	const render = getTemplateCached(entry);

	render({mix: depCollector});
}

// The public_url property is the unique id of each node.
function buildDepGraph(entries: ResolvedEntry[]) {
	const depGraph = new DepGraph<ResolvedEntry>();

	for (const entry of entries) {
		depGraph.addNode(entry.public_url, entry);
	}

	for (const entry of entries) {
		collectDeps(entry, depGraph);
	}

	return depGraph;
}

function compile(
	entries: ResolvedEntry[],
	depGraph: DepGraph<ResolvedEntry>,
	onEntryCompiled?: OnEntryCompiled,
) {
	const manifest = readManifestCached();
	const getNodeData = depGraph.getNodeData.bind(depGraph);
	const topologicalOrder = depGraph.overallOrder().map(getNodeData);
	// lodash.intersection keeps the order based on the first array.
	const toCompile = intersection(topologicalOrder, entries);

	for (const entry of toCompile) {
		const render = getTemplateCached(entry);
		const output = render({mix});

		fs.mkdirSync(path.dirname(entry.dest), {recursive: true});
		fs.writeFileSync(entry.dest, output);

		const hash = hashContent(output);
		const public_url = entry.public_url;

		if (config.useVersioning) {
			manifest.set(public_url, `${public_url}?id=${hash}`);
		} else {
			manifest.set(public_url, public_url);
		}

		onEntryCompiled?.(entry, output);
	}

	writeManifest(manifest);
}

const onChangeFactory = (
	watcher: CompilationWatcher,
	entries: ResolvedEntry[],
	depGraph: DepGraph<ResolvedEntry>,
) => (filepath: string): void => {
	getTemplateCached.cache.clear();
	readManifestCached.cache.clear();

	const relevantEntries = entries.filter((entry) => entry.src === filepath);
	const toCompile = new Set<ResolvedEntry>();
	const getNodeData = depGraph.getNodeData.bind(depGraph);

	for (const entry of relevantEntries) {

		collectDeps(entry, depGraph);

		toCompile.add(entry);

		const deps = depGraph.dependantsOf(entry.public_url).map(getNodeData);

		for (const dep of deps) {
			toCompile.add(dep);
		}
	}

	const onEntryCompiled: OnEntryCompiled = (entry, output) => {
		watcher.emit("entry-compiled", entry, output);
	};

	compile(Array.from(toCompile), depGraph, onEntryCompiled);

	getTemplateCached.cache.clear();
	readManifestCached.cache.clear();
};

export function build(entries: ResolvedEntry[], onEntryCompiled?: OnEntryCompiled) {
	getTemplateCached.cache.clear();
	readManifestCached.cache.clear();

	const depGraph = buildDepGraph(entries);

	compile(entries, depGraph, onEntryCompiled);

	getTemplateCached.cache.clear();
	readManifestCached.cache.clear();

	return depGraph;
}

export function watch(
	entries: ResolvedEntry[],
	depGraph: DepGraph<ResolvedEntry>,
): CompilationWatcher {
	const watcher = chokidar.watch(
		entries.map((entry) => entry.src),
		{usePolling: config.usePolling},
	);

	const onChange = onChangeFactory(watcher, entries, depGraph);

	watcher.on("change", onChange);

	return watcher;
}
