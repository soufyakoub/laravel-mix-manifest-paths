import urljoin from "url-join";
import config from "./config";
import { readManifestCached } from "./manifest";

export function mix(public_url: string) {
	const versioned_public_url = readManifestCached().get(public_url);

	if (typeof versioned_public_url === "undefined") {
		throw new Error(`Unable to locate Mix file: '${public_url}'.`);
	}

	if (config.hot_url !== null) {
		const custom_hot_url = process.env.MIX_HOT_PROXY_URL ?? "";

		if (custom_hot_url.length > 0) {
			return urljoin(custom_hot_url, public_url);
		}

		// keep only what's after the first ":" in `hot_url`.
		// this is what laravel's `mix` helper does, not sure why though.
		const no_protocol_hot_url = config.hot_url.replace(/^.*?:/, "");

		return urljoin(no_protocol_hot_url, public_url);
	}

	const mix_asset_url = process.env.MIX_ASSET_URL ?? "";

	if (mix_asset_url.length > 0) {
		return urljoin(mix_asset_url, versioned_public_url);
	}

	return versioned_public_url;
}
