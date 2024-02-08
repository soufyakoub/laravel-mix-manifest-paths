import { Stats } from "webpack";
import chalk from "chalk";
import laravel_mix from "laravel-mix";
import { Options, defaultOptions } from "./options";
import config from "./config";
import {
	build,
	CompilationWatcher,
	OnEntryCompiled,
	watch,
} from "./compilation";
import { resolveRawEntries, RawEntry } from "./helpers";
import { merge } from "lodash";
import {
	assertIsOptions,
	assertIsTruthyString,
	assertIsTruthyStringArray,
} from "./validation";

export { Options } from "./options";

// Augment laravel-mix Api interface with the new available method.
declare module "laravel-mix" {
	interface Api {
		/**
		 * Compile files specified by `from` as templates
		 * with Laravel's `mix` helper available to them, and output them in `to`.
		 * @param from A glob or array of globs that matches source files to compile.
		 * @param to The output directory.
		 * @param options An object to override default options.
		 */
		manifestPaths(
			from: string | string[],
			to: string,
			options?: Options,
		): this;
	}
}

export default class ManifestPaths {
	public rawEntries: RawEntry[] = [];

	private defaultOptions = { ...defaultOptions };

	public setDefaultOptions(options: Options) {
		assertIsOptions(options, "options");
		this.defaultOptions = merge({}, this.defaultOptions, options);
	}

	public name() {
		return "manifestPaths";
	}

	public register(from: unknown, to: unknown, options?: unknown) {
		if (Array.isArray(from)) {
			assertIsTruthyStringArray(from, "from");
		} else {
			assertIsTruthyString(from, "from");
		}

		assertIsTruthyString(to, "to");

		if (typeof options !== "undefined") {
			assertIsOptions(options, "options");
		}

		const fullOptions = merge({}, this.defaultOptions, options);
		const fromArr = Array.isArray(from) ? from : [from];
		const newRawEntries = fromArr.map((from_str) => ({
			from: from_str,
			to,
			options: fullOptions,
		}));

		this.rawEntries.push(...newRawEntries);
	}
}

const component = new ManifestPaths();

laravel_mix.extend(component.name(), component);

export const setDefaultOptions = component.setDefaultOptions.bind(component);

// watcher.unwatch(...paths) doesn't seem to work,
// so I used a new watcher for each new build.
let watcher: CompilationWatcher | null = null;

laravel_mix.after(async (stats: Stats) => {
	if (watcher) {
		await watcher.close();
		watcher = null;
	}

	const onEntryCompiled: OnEntryCompiled = (entry, output) => {
		// @ts-expect-error laravel-mix does this to log emitted assets as a table.
		stats.compilation.assets[entry.public_url] = {
			size: () => Buffer.byteLength(output),
		};
	};

	const entries = resolveRawEntries(component.rawEntries);
	const depGraph = build(entries, onEntryCompiled);

	if (config.isWatching) {
		watcher = watch(entries, depGraph);

		watcher.on("entry-compiled", (entry) => {
			const message = chalk.green(
				`\t[manifest-paths]: Recompiled '${entry.dest}'`,
			);

			console.log(message);
		});
	}
});
