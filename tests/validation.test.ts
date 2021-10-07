import {
	isOptions,
	isTruthyString,
	isTruthyStringArray,
	getErrorPropertyPath,
	getValidatorError,
} from "../src/validation";

test.each([
	[isOptions, {delimiters: 1}, "options", "options.delimiters"],
	[isOptions, {delimiters: {left: 1}}, "options", "options.delimiters.left"],
	[isOptions, {delimiters: {right: ""}}, "options", "options.delimiters.right"],
	[isOptions, {flatten: {}}, "options", "options.flatten"],
	[isOptions, 1, "options", "options"],
	[isTruthyString, "", "str_var", "str_var"],
	[isTruthyString, 1, "str_var", "str_var"],
	[isTruthyStringArray, ["test", ""], "str_arr_var", "str_arr_var[1]"],
	[isTruthyStringArray, ["test1", "test2", 3], "str_arr_var", "str_arr_var[2]"],
	[isTruthyStringArray, 1, "str_arr_var", "str_arr_var"],
] as const)("getErrorPropertyPath (%#)", (validator, value, var_name, expected_path) => {
	validator(value);

	const error = getValidatorError(validator);
	const path = getErrorPropertyPath(error, var_name);

	expect(path).toBe(expected_path);
});
