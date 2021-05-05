# Client

napari hub website implemented with Next.js and TypeScript! We use a lot of
cool frontend tech for the website:

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

## Setup Dev Environment

### Node.js

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

## Mock Server

The hub communicates with a backend API for plugin data, so you'll need to setup
a mock server for local development.

To start the mock server, run:

```sh
yarn start:mock-server
```

## Development Mode

To run the app in development mode, run the following command:

```sh
yarn dev
```

This will start the Next.js dev server with [fast refresh](https://nextjs.org/docs/basic-features/fast-refresh). Edit some code and watch it update in the browser without having to refresh :heart_eyes:

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
