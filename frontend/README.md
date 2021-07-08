# napari hub frontend

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Development Features](#development-features)
- [Quick Start](#quick-start)
  - [Setup Node.js](#setup-nodejs)
  - [Setup Secrets](#setup-secrets)
    - [GitHub Token](#github-token)
  - [Start Development Mode](#start-development-mode)
- [Plop Generators](#plop-generators)
- [Documentation](#documentation)

## Development Features

- :zap: [React](https://reactjs.org/) + [Next.js](https://nextjs.org/)
- :crossed_swords: [TypeScript](https://www.typescriptlang.org/)
- :art: [SCSS modules](https://github.com/css-modules/css-modules)
- :nail_care: [Tailwind CSS](https://tailwindcss.com/) for utility styles
- :racing_car: [Tailwind JIT](https://tailwindcss.com/docs/just-in-time-mode) for on-demand Tailwind styles
- :package: [Yarn](https://classic.yarnpkg.com/en/) for package management
- :camera_flash: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) for unit and snapshot tests
- :performing_arts: [Jest](https://jestjs.io/) + [Playwright](https://github.com/microsoft/playwright) for E2E tests
- :mag: [ESlint](https://eslint.org/) + [Stylelint](https://stylelint.io/) for TypeScript and SCSS linting
- :gear: [Plop](https://plopjs.com/documentation/) for boilerplate automation

## Quick Start

### Setup Node.js

We use Node.js and various packages on NPM for building napari hub. For
package management, we use [yarn](https://classic.yarnpkg.com/en/).

It's recommended you use NVM so you don't have to manage multiple Node.js versions yourself:

- Bash: [nvm](https://github.com/nvm-sh/nvm)
- Fish: [nvm.fish](https://github.com/jorgebucaran/nvm.fish)
- Zsh: [zsh-nvm](https://github.com/lukechilds/zsh-nvm)

When you have NVM setup, run the following commands:

```sh
# Installs Node.js version defined in `.nvmrc`
nvm install

# Uses project defined Node.js version
nvm use

# Install yarn globally
npm -g install yarn

# Install project dependencies
yarn install
```

### Setup Secrets

#### GitHub Token

The frontend authenticates as a GitHub OAuth app to allow a increase the API rate limit. For development, you'll need to create an OAuth app on your personal account:

1. [Create a new OAuth app](https://github.com/settings/applications/new)
   - a) **Application name**: Can be whatever you want (example: `napari hub dev`)
   - b) **Homepage URL**: http://localhost:8080
   - c) **Application description**: Leave empty
   - d) **Authorization callback URL**: http://localhost:8080
1. Copy `.env.example` to `.env`.
1. Change `GITHUB_CLIENT_ID` to the actual GitHub client ID.
1. Change `GITHUB_CLIENT_SECERT` to the actual GitHub client secret.

### Start Development Mode

To start the frontend in [development mode](./docs/tooling#development-mode),
run the following command:

```sh
yarn dev
```

Any changes to the code will [fast
refersh](https://nextjs.org/docs/basic-features/fast-refresh) the browser UI.

## Plop Generators

We use [Plop](https://plopjs.com/documentation/) to automate common
boilerplate in the codebase. You can run Plop without any arguments and get a
list of generators you can use:

```sh
yarn plop
```

If you want to use a specific generator, you can pass the name as the first
argument:

```sh
# Run component generator
yarn plop component
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Project Structure](./docs/project-structure.md)
- [Testing](./docs/testing.md)
- [Tooling](./docs/tooling.md)
