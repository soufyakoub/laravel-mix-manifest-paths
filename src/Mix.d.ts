// These typings are not complete,
// they're here to only provide type safety
// after thoroughly examining laravel-mix's source code.

declare module "laravel-mix/src/Mix" {
	import { MixConfig as InvalidMixConfig } from "laravel-mix/types/config";
	import { Component } from "laravel-mix/types/component";

	// See "laravel-mix/src/components/Components.js"
	interface Components {
		/** Record a newly registered component. */
		record(name: string, component: Component): void;

		/** Retrieve a recorded component. */
		get(name: string): Component;

		/** Determine if the given component name has been registered. */
		has(name: string): boolean;

		/** Retrieve all components. */
		all(): Record<string, Component>;
	}

	interface HmrOptions {
		host: string;
		port: string;
		https: boolean;
	}

	interface MixConfig extends InvalidMixConfig {
		hmrOptions?: HmrOptions;
	}

	// See "laravel-mix/src/Mix.js"
	interface Mix {
		config: MixConfig;
		components: Components;
		isWatching(): boolean;
		isHot(): boolean;
		isPolling(): boolean;
		isUsing(tool: string): boolean;
	}

	declare const Mix: Mix;

	export default { primary: Mix };
}
