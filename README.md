[![npm](https://img.shields.io/npm/dt/laravel-mix-manifest-paths)](https://www.npmjs.com/package/laravel-mix-manifest-paths)
[![npm](https://img.shields.io/npm/v/laravel-mix-manifest-paths)](https://www.npmjs.com/package/laravel-mix-manifest-paths)
[![Build Status](https://travis-ci.com/soufyakoub/laravel-mix-manifest-paths.svg?branch=master)](https://travis-ci.com/soufyakoub/laravel-mix-manifest-paths)
[![codecov](https://codecov.io/gh/soufyakoub/laravel-mix-manifest-paths/branch/master/graph/badge.svg)](https://codecov.io/gh/soufyakoub/laravel-mix-manifest-paths)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# laravel-mix-manifest-paths
> A [laravel-mix][laravel-mix] extension that grants access to the generated manifest's paths in static assets.

## Installation

Via [npm][npm]

```sh
npm i -D laravel-mix-manifest-paths
```

Via [yarn][yarn]

```sh
yarn add -D laravel-mix-manifest-paths
```

## Usage

```javascript
// webpack.mix.js

const mix = require("laravel-mix");

require("laravel-mix-manifest-paths");

mix.setPublicPath("public");
mix.version();

mix.js("src/app.js", "public/js")
   .sass("src/app.scss", "public/css")
   .manifestPaths("src/txt/**", "public/txt");
```

Now, after the compilation has finished, files matching the [glob][glob] `src/txt/**` will be compiled
as [lodash templates][lodash.template] and a `mix` function will be available to them.

The `mix` function works somewhat the same way as the [laravel][laravel]'s helper. So this:

```
blablabla {{mix('/js/app.js')}}
should be html-escaped {{ mix("/js/<special>.js") }}
should not be html-escaped {{! mix("/js/<special>.js") !}}
```

will be compiled to this (Of course, your hashes will be different):

```
blablabla /js/app.js?id=752e64981810d0203520
should be html-escaped /js/&lt;special&gt;.js?id=68b329da9893e34099c7
should not be html-escaped /js/<special>.js?id=68b329da9893e34099c7
```

### Options

All options are ... optional, and they're merged with the default options object.

- `delimiters` `{object}`:
	- `left` `{string}`: The left delimiter tag. Default is `"{{"`
	- `right` `{string}`: The right delimiter tag. Default is `"}}"`

- `flatten` `{boolean}`: If true flatten all destination paths,
else preserve the structure of the extracted common parent directory (extracted using [glob-parent][glob-parent]).
Default is `true`.

## API

```typescript
mix.manifestPaths(from: string | string[], to: string, options?: Options);
```

- `from`: A glob or array of globs that matches source files to compile.
- `to`: The output directory.
- `options`: An object to override default options. This parameter is optional.

A method is also exposed so you can change the extension's default options:

```typescript
setDefaultOptions(options: Options);
```

And can be used like so:

```javascript
const {setDefaultOptions} = require("laravel-mix-manifest-paths");

setDefaultOptions({
	delimiters: {
		left: "<<",
		right: ">>",
	},
});
```

Be aware that calling this function changes the default options only for subsequent calls to `mix.manifestPaths`.

## Contributing

### Prerequisites
- [nodejs][nodejs]
- [npm][npm]

### Getting Started

After cloning this repo, ensure dependencies are installed by running:

```sh
npm install
```

And to build the final bundle:

```sh
npm run build
```

### Tests

To run tests:

```sh
npm test
```

Coverage report is located in `tests/coverage`.

### Linting

Linting is supported by [eslint][eslint] and [typescript-eslint][typescript-eslint].

To run code through the linting script:

```sh
npm run lint
```

And to fix any fixable errors

```sh
npm run lint:fix
```

### Commiting changes

Please follow the [conventional commits][conventional-commits] specification,
because [semantic-release][semantic-release] is used to automate the whole package release workflow including:
- determining the next version number.
- generating the release notes.
- publishing the package.

## License

[MIT](LICENSE)

[laravel-mix]: https://laravel-mix.com/
[npm]: https://npmjs.org/
[yarn]: https://yarnpkg.com
[glob]: https://www.npmjs.com/package/glob
[lodash.template]: https://lodash.com/docs/4.17.15#template
[laravel]: https://laravel.com/
[glob-parent]: https://www.npmjs.com/package/glob-parent
[nodejs]: https://nodejs.org
[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/
[semantic-release]: https://semantic-release.gitbook.io/semantic-release/
[jest]: https://jestjs.io/
[eslint]: https://eslint.org/
[typescript-eslint]: https://github.com/typescript-eslint/typescript-eslint
