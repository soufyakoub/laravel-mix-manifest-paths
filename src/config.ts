import path from "path";
import "laravel-mix"; // to initialize the internal Mix instance
import Mix from "laravel-mix/src/Mix";

export interface Config {
	public_dir: string;
	manifest_path: string;
	isWatching: boolean;
	isHot: boolean;
	usePolling: boolean;
	useVersioning: boolean;
	hot_url: null | string;
}

const internal = Mix.primary;

const config: Config = {
	get public_dir() {
		return path.resolve(internal.config.publicPath ?? ".");
	},
	get manifest_path() {
		if (typeof internal.config.manifest !== "string") {
			throw new Error(
				"[manifest-paths]: expected a manifest file to be generated.",
			);
		}

		return path.join(this.public_dir, internal.config.manifest);
	},
	isWatching: internal.isWatching(),
	isHot: internal.isHot(),
	usePolling: internal.isPolling(),
	get useVersioning() {
		return internal.components.has("version") && !this.isHot;
	},
	get hot_url() {
		if (!this.isHot || !internal.config.hmrOptions) {
			return null;
		}

		const hmrOptions = internal.config.hmrOptions;
		const protocol = hmrOptions.https ? "https" : "http";
		const host = hmrOptions.host;
		const port = hmrOptions.port;

		return `${protocol}://${host}:${port}`;
	},
};

export default config;
