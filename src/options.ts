export {assertIsOptions} from "./validation";

export interface Options {
	/** The delimiter tags. */
	delimiters?: {
		/** The left delimiter tag. */
		left?: string;
		/** The right delimiter tag. */
		right?: string;
	};

	/**
	 * If true flatten all destination paths,
	 * else preserve the structure of the extracted common parrent directory.
	 */
	flatten?: boolean;
}

export interface FullOptions {
	/** The delimiter tags. */
	delimiters: {
		/** The left delimiter tag. */
		left: string;
		/** The right delimiter tag. */
		right: string;
	};

	/**
	 * If true flatten all destination paths,
	 * else preserve the structure of the extracted common parrent directory.
	 */
	flatten: boolean;
}

export const defaultOptions: FullOptions = {
	delimiters: {
		left: "{{",
		right: "}}",
	},
	flatten: true,
};
