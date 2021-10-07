import crypto from "crypto";
import fs from "fs";
import path from "path";
import config from "./config";
import {cacheClearableMemoize} from "./helpers";

export function readManifest() {
	const content = fs.readFileSync(config.manifest_path, "utf-8");
	const json = JSON.parse(content) as Record<string, string>;
	const entries = Object.entries(json);

	return new Map(entries);
}

export const readManifestCached = cacheClearableMemoize(readManifest);

export function writeManifest(manifest: Map<string, string>) {
	const json = Object.fromEntries(manifest);
	const content = JSON.stringify(json, null, 2);
	const manifest_dir = path.dirname(config.manifest_path);

	fs.mkdirSync(manifest_dir, {recursive: true});
	fs.writeFileSync(config.manifest_path, content);
}

export function hashContent(content: string) {
	return crypto
		.createHash("md5")
		.update(content)
		.digest("hex")
		.slice(0, 20);
}
