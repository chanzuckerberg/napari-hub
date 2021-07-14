# Frontend Tooling

## Table of Contents

- [Table of Contents](#table-of-contents)
- [TypeScript](#typescript)
- [Linting](#linting)
- [Styling](#styling)
  - [Tailwind](#tailwind)
  - [SCSS Modules](#scss-modules)
    - [Type Definitions](#type-definitions)
- [Package Scripts](#package-scripts)
- [Development Mode](#development-mode)
  - [Disabling the Mock Server](#disabling-the-mock-server)
- [Building for Production](#building-for-production)
- [Plop Generator](#plop-generator)

## TypeScript

[TypeScript](https://www.typescriptlang.org/) is a superset language of
JavaScript that adds static typing to JavaScript, allowing us to catch type
errors at build time.

TypeScript is fully supported using [Next.js](https://nextjs.org/docs/basic-features/typescript), and is configured using the [tsconfig.json](../tsconfig.json) file.

## Linting

We use a variety of static analysis tools for linting and formatting code. These
tools help ensure we're writing code that follows best practices and are
formatted in a consistent way.

| Linter                                               | Config                                    | Description                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ESLint](https://eslint.org/)                        | [.eslintrc.js](../.eslintrc.js)           | Linter for JavaScript and TypeScript code to find problems in the code before build time. The root configuration is located in `.eslintrc.js`, and additional configuration is split into separate files in [eslint/](../eslint/). <br><br> We use [AirBnb's config](https://www.npmjs.com/package/eslint-config-airbnb) as a base for JavaScript best practices. |
| [Prettier](https://prettier.io/)                     | [.prettierc.yml](../.prettierrc.yml)      | A code formatter that can lint and format code so that it's written in a certain style. This ensures that code contributed to the repo follows a consistent style so that developers don't have to spend mental effort worrying about how the code should look.                                                                                                   |
| [Stylelint](https://stylelint.io/)                   | [.stylelintrc.yml](../.stylelintrc.yml)   | Linter for SCSS files to ensure best practices when writing SCSS.                                                                                                                                                                                                                                                                                                 |
| [lint-staged](https://github.com/okonet/lint-staged) | [.lintstagedrc.yml](../.lintstagedrc.yml) | A tool for running scripts on staged files. We currently use this for linting code with prettier on commit. If the code isn't formatted correctly, then the commit fails.                                                                                                                                                                                         |
| [Husky](https://github.com/typicode/husky)           | [pre-commit](../../.husky/pre-commit)     | Script for setting up frontend Git hooks.                                                                                                                                                                                                                                                                                                                         |

## Styling

Component styling is [handled entirely by
Next.js](https://nextjs.org/docs/basic-features/built-in-css-support) using
[PostCSS](https://github.com/postcss/postcss) for transformations and
[Webpack](https://webpack.js.org/) for modules.

### Tailwind

[Tailwind](https://tailwindcss.com/) is a CSS framework that provides utility
classes for styling components. Tailwind is great for minimizing the output of
CSS, so its recommended to only use Tailwind classes for styling whenever
possible.

### SCSS Modules

SCSS modules are different from normal SCSS because class names are exported
using a unique class name instead of the class name given in the file. This
ensures encapsulation for a particular class and removes the need for name-based
encapsulation approaches like BEM.

For example, if we define a module `example.module.scss`:

```scss
.red {
  background: #f00;
}
```

This will get compiled into a mangled name like:

```css
.jjqbifbo739173 {
  background: #f00;
}
```

Then a component can import the style like this:

```tsx
import styles from './example.module.scss';

export function Example() {
  return (
    <div className={styles.red}>
      <h1>Example</h1>
    </div>
  );
}
```

Under the hood, Webpack will return a JavaScript object with the following mapping:

```js
module.exports = {
  red: 'jjqbifbo739173',
};
```

For more info on CSS modules, check out the [CSS Modules
repo](https://github.com/css-modules/css-modules).

#### Type Definitions

When running `yarn dev`, SCSS modules will also output type definitions. This is because `yarn dev` runs the `yarn dev:tsm` script, which runs the [typed-scss-modules](https://github.com/skovy/typed-scss-modules/tree/1391aa722eb309c76df6fdc9ce01d2a768984ff2) CLI.

This CLI is used for generating type definitions for SCSS modules so that the exported CSS classes are properly typed. For example, the SCSS module

```scss
.example {
  @apply bg-red-500;
}
```

would output the following type definitions:

```ts
export type Styles = {
  example: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
```

This is beneficial because:

1. It provides class autocompletion in editors.
1. It verifies that components are using classes that are actually exported. Otherwise, TypeScript would throw a compile error.

## Package Scripts

The
[package.json](../package.json)
file contains scripts for executing different commands on the project. While
there are a lot of package scripts, the most important ones you need to know
about are:

| Script        | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `build`       | Builds the application for [production](#build-for-production).      |
| `dev`         | Runs the frontend in [development mode](#development-mode).          |
| `lint`        | Lints the codebase using prettier, stylelint, and eslint.            |
| `e2e`         | Runs E2E tests                                                       |
| `e2e:watch`   | Runs E2E tests in [watch mode](./testing.md#watch-mode)              |
| `e2e:update`  | Update E2E test [snapshots](./testing.md#snapshots)                  |
| `test`        | Runs Unit/Integration tests                                          |
| `test:watch`  | Runs Unit/Integration tests in [watch mode](./testing.md#watch-mode) |
| `test:update` | Update Unit/Integration test [snapshots](./testing.md#snapshots)     |
| `type-check`  | Type checks the codebase using TypeScript.                           |

## Development Mode

Running the frontend in dev mode will start up a local instance of the napari
hub accessible from http://localhost:8080.

To start dev mode, run the command:

```sh
yarn dev
```

Running this starts up a few programs concurrently:

| Program            | Description                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mock Server        | Server used for mocking the hub backend. This is useful for speeding up development when the feature you're working on is frontend focused.                                                     |
| Next.js Dev Server | Next.js application in dev mode. This runs the frontend server with [Fast Refresh](https://nextjs.org/docs/basic-features/fast-refresh) so that code changes update the browser UI immediately. |
| tsm Watch Mode     | typed-scss-modules CLI in watch mode so that any additions and modifications to `*.module.scss` files update the type definitions in `*.module.d.ts`.                                           |

### Disabling the Mock Server

It's possible to disable the mock server when running dev mode using the `MOCK_SERVER` environment variable:

```sh
MOCK_SERVER=false yarn dev
```

This is useful if you want to run the mock server in another terminal and make
edits to the [mock server
code](../mock-server.js)
without having to restart the frontend dev server, or if you want to connect to
the backend directly.

## Building for Production

Building the frontend for production uses `next build` to compile the source
code into static assets used on the server and client. The compiled assets are
minified, obfuscated, and split into chunks to improve performance.

<details>
<summary>
Build Example
</summary>

```sh
$ yarn build

Page                                Size     First Load JS
┌ λ /                               1.1 kB          405 kB
├   /_app                           0 B             404 kB
├ ○ /404                            2.74 kB         407 kB
├ ○ /about                          2.32 kB         406 kB
├ λ /api/health                     0 B             404 kB
├ ○ /contact                        1.61 kB         405 kB
├ ○ /faq                            4.55 kB         408 kB
├ λ /plugins                        499 B           404 kB
├   └ css/53b1c5ef4433886afef5.css  238 B
├ λ /plugins/[name]                 597 B           404 kB
└ ○ /privacy                        2.65 kB         407 kB
+ First Load JS shared by all       404 kB
  ├ chunks/197.0174e2.js            124 kB
  ├ chunks/37.b034fd.js             13.7 kB
  ├ chunks/439.f3cd33.js            174 kB
  ├ chunks/528.8356f5.js            12.5 kB
  ├ chunks/541.f245d6.js            13.2 kB
  ├ chunks/commons.029f7e.js        13.6 kB
  ├ chunks/framework.c65aa9.js      42.6 kB
  ├ chunks/main.9608e0.js           6.82 kB
  ├ chunks/pages/_app.50f555.js     1.33 kB
  ├ chunks/webpack.4d4dd6.js        1.88 kB
  └ css/dc249b959bd8e8431886.css    5.33 kB

λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
   (ISR)     incremental static regeneration (uses revalidate in getStaticProps)

```

```text
.next/
├── BUILD_ID
├── build-manifest.json
├── cache
│   └── webpack
│       ├── client-development
│       │   ├── 0.pack
│       │   └── index.pack
│       ├── client-production
│       │   ├── 0.pack
│       │   └── index.pack
│       ├── server-development
│       │   ├── 0.pack
│       │   └── index.pack
│       └── server-production
│           ├── 0.pack
│           └── index.pack
├── export-marker.json
├── images-manifest.json
├── prerender-manifest.json
├── react-loadable-manifest.json
├── required-server-files.json
├── routes-manifest.json
├── server
│   ├── chunks
│   │   └── 544.08287030a48b44b0ba52.js
│   ├── init-server.js.js
│   ├── on-error-server.js.js
│   ├── pages
│   │   ├── 404.html
│   │   ├── 500.html
│   │   ├── _app.js
│   │   ├── _document.js
│   │   ├── _error.js
│   │   ├── about.html
│   │   ├── api
│   │   │   └── health.js
│   │   ├── contact.html
│   │   ├── faq.html
│   │   ├── index.js
│   │   ├── plugins
│   │   │   └── [name].js
│   │   ├── plugins.js
│   │   └── privacy.html
│   ├── pages-manifest.json
│   ├── src_components_common_Markdown_SyntaxHighlighter_tsx.js
│   └── webpack-runtime.js
└── static
    ├── chunks
    │   ├── 197-0174e29c00d5fa998962.js
    │   ├── 37-b034fdf1a328767a8fda.js
    │   ├── 439-f3cd33813eac15271193.js
    │   ├── 528-8356f53b8e89052619ca.js
    │   ├── 541-f245d62ed4b147c9f375.js
    │   ├── 671.f8163694a7fb29bed992.js
    │   ├── amp.js
    │   ├── commons-029f7e74948cd2c19e78.js
    │   ├── framework-c65aa9ff3e674e9efb3d.js
    │   ├── main-9608e06ddc1767ab0602.js
    │   ├── main.js
    │   ├── node_modules_next_dist_client_dev_noop_js.js
    │   ├── pages
    │   │   ├── _app-50f555b84e1d1c307bc7.js
    │   │   ├── _app.js
    │   │   ├── _error-f742b197cbc7fc99c663.js
    │   │   ├── _error.js
    │   │   ├── about-90ee2ef69a278608507e.js
    │   │   ├── contact-0436bb20655b6d885a85.js
    │   │   ├── faq-20f4b4da8050884dc074.js
    │   │   ├── index-22061676299820a17c8b.js
    │   │   ├── index.js
    │   │   ├── plugins
    │   │   │   └── [name]-8daf5b1ca62f24c43d1d.js
    │   │   ├── plugins-7e2011012cd6099ca1cb.js
    │   │   └── privacy-b5ba2febdefdb03ec557.js
    │   ├── polyfills-bba4e3ae2a1f646feca8.js
    │   ├── polyfills.js
    │   ├── react-refresh.js
    │   ├── react-syntax-highlighter
    │   │   └── refractor-import.56b6068dcf4453eb3f9b.js
    │   ├── src_components_common_Markdown_SyntaxHighlighter_tsx.js
    │   ├── vendors-node_modules_react-syntax-highlighter_dist_esm_index_js-node_modules_react-syntax-hig-61f5cb.js
    │   ├── webpack-4d4dd6112788f822ba84.js
    │   └── webpack.js
    ├── css
    │   ├── 53b1c5ef4433886afef5.css
    │   ├── c7f5b4a528dfe86004a8.css
    │   └── dc249b959bd8e8431886.css
    ├── development
    │   ├── _buildManifest.js
    │   └── _ssgManifest.js
    ├── webpack
    │   ├── 51d4e9504fa97cf5ec8a.hot-update.json
    │   └── webpack.51d4e9504fa97cf5ec8a.hot-update.js
    └── wpMy4GBpNfYW4G42PfGKw
        ├── _buildManifest.js
        └── _ssgManifest.js

20 directories, 76 files

```

</details>

## Plop Generator

We use [plop](https://plopjs.com/) to automate some boilerplate when working on
the codebase. The plop templates are still WIP, so there may not be a generator
for certain things. To use one of the generators, run:

```sh
yarn plop <generator>
```

We currently support the following generators:

| Generator                          | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| [component](../plopfile.js#L6-L73) | Creates a new component in `src/components` |
| [page](../plopfile.js#L6-L73)      | Creates a new page in `src/pages`           |
