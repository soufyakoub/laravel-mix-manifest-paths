import path from "path";
import {globSync} from "glob";
import globParent from "glob-parent";
import {memoize, uniqBy} from "lodash";
import {FullOptions} from "./options";
import config from "./config";

export interface RawEntry {
	from: string;
	to: string;
	options: FullOptions;
}

export interface ResolvedEntry {
	src: string;
	dest: string;
	public_url: string;
	options: FullOptions;
}

type AnyFunction = (...args: any[]) => unknown;

export function cacheClearableMemoize<T extends AnyFunction>(
	func: T,
	resolver?: (...args: Parameters<T>) => unknown,
) {
	const memoized = memoize(func, resolver);

	return Object.assign(memoized, {cache: new Map<unknown, unknown>()});
}

export function resolveRawEntry(entry: RawEntry): ResolvedEntry[] {
	const {from, to, options} = entry;

	// absolute paths are separated by a forward slash in windows,
	// so we need to normalize them.
	// see https://github.com/isaacs/node-glob/issues/419
	const normalize = path.normalize.bind(path);
	const srcs = globSync(from, {nodir: true, absolute: true}).map(normalize);

	return srcs.map((src) => {
		let dest: string;

		if (options.flatten) {
			const basename = path.basename(src);

			dest = path.resolve(to, basename);
		} else {
			const parent_dir = globParent(from);
			const rest = path.relative(parent_dir, src);

			dest = path.resolve(to, rest);
		}

		const relative_to_public = path.relative(config.public_dir, dest);
		const public_url = "/" + relative_to_public.replace(/\\/g, "/");

		return {src, dest, public_url, options};
	});
}

export function resolveRawEntries(rawEntries: RawEntry[]): ResolvedEntry[] {
	const resolvedEntries = rawEntries.map(resolveRawEntry).flat();

	// One src can correspond to multiple dest,
	// but one dest can only correspond to one src.
	// later entries override earlier ones

	return uniqBy(resolvedEntries.reverse(), "dest");
}

