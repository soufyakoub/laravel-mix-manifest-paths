import Ajv, {DefinedError, JSONSchemaType, ValidateFunction} from "ajv";
import {Options} from "./options";

const ajv = new Ajv();

export function getErrorPropertyPath(error: DefinedError, var_name: string) {
	const {instancePath, schemaPath} = error;
	const instancePathSegments = instancePath.split("/");
	const schemaPathSegments = schemaPath.split("/");

	// remove the root segments to ease iteration,
	// they'll be replaced with the variable name anyways.
	schemaPathSegments.shift();
	instancePathSegments.shift();
	// remove the keyword of the target property or instance.
	schemaPathSegments.pop();

	let path = var_name;

	for (let i = 0; i < instancePathSegments.length; i++) {
		const index_keyword = schemaPathSegments[2 * i];
		const index_name = instancePathSegments[i];
		const use_dot_notation = (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/).test(index_name);

		if (use_dot_notation) {
			path += "." + index_name;
			continue;
		}

		// numeric array index
		if (index_keyword === "items") {
			path += "[" + index_name + "]";
			continue;
		}

		// bracket notation
		path += "[" + JSON.stringify(index_name) + "]";
	}

	return path;
}

export function getValidatorError(validator: ValidateFunction) {
	const errors = validator.errors as DefinedError[];

	// Only one error will be available.
	// see https://ajv.js.org/options.html#allerrors
	return errors[0];
}

export function getAssertionMessage(validator: ValidateFunction, var_name?: string) {
	const error = getValidatorError(validator);

	// `error.message` is sure to be available as a string.
	// see https://ajv.js.org/options.html#messages
	const message = error.message as string;

	if (var_name === undefined) {
		return message;
	}

	const path = getErrorPropertyPath(error, var_name);

	return `${path}: ${message}`;
}

// This might be resolved in v9
// @ts-expect-error see https://github.com/ajv-validator/ajv/issues/1375
const optionsSchema: JSONSchemaType<Options> = {
	type: "object",
	properties: {
		delimiters: {
			type: "object",
			properties: {
				left: {
					type: "string",
					minLength: 1,
				},
				right: {
					type: "string",
					minLength: 1,
				},
			},
		},
		flatten: {
			type: "boolean",
		},
	},
};

const truthyStringSchema: JSONSchemaType<string> = {
	type: "string",
	minLength: 1,
};

const truthyStringArraySchema: JSONSchemaType<string[]> = {
	type: "array",
	items: truthyStringSchema,
};

export const isOptions = ajv.compile(optionsSchema);
export const isTruthyString = ajv.compile(truthyStringSchema);
export const isTruthyStringArray = ajv.compile(truthyStringArraySchema);

export function assertIsOptions(
	options: unknown,
	var_name?: string,
): asserts options is Options {
	if (!isOptions(options)) {
		const message = getAssertionMessage(isOptions, var_name);

		throw new Error(message);
	}
}

export function assertIsTruthyString(
	str: unknown,
	var_name?: string,
): asserts str is string {
	if (!isTruthyString(str)) {
		const message = getAssertionMessage(isTruthyString, var_name);

		throw new Error(message);
	}
}

export function assertIsTruthyStringArray(
	array: unknown,
	var_name?: string,
): asserts array is string[] {
	if (!isTruthyStringArray(array)) {
		const message = getAssertionMessage(isTruthyStringArray, var_name);

		throw new Error(message);
	}
}
