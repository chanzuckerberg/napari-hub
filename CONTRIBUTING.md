# Contributing to napari hub

Want to contribute to the napari hub? Please follow the steps below and check
out the [contribution
guide](https://github.com/chanzuckerberg/napari-hub/contribute) for an idea of
good first issues you could work on.

## Setup development environment

First you'll need to [fork](https://guides.github.com/activities/forking/#fork)
the [repository](https://github.com/chanzuckerberg/napari-hub) on Github.

Clone the forked repository to your local machine and change directories:

```sh
git clone https://github.com/your-username/napari-hub.git
cd napari-hub
```

Set the `upstream` remote to the base `napari-hub` repository:

```sh
git remote add upstream https://github.com/chanzuckerberg/napari-hub.git
```

Now that you have the repo forked and cloned, you can start developing for the
napari hub!

### Frontend Only

If you're working on the frontend only, it's faster to run the frontend in
development mode using Node.js. Please read
[frontend/README.md](./frontend/README.md) for setup.

### End-to-End

If you're working on something that requires the backend, it's better to use
`docker-compose` to start the frontend and backend at the same time. Please read
[DEV_ENV.md](./DEV_ENV.md) to for setup.

## New Features

For new napari hub features, please start a [discussion on the
repo](https://github.com/chanzuckerberg/napari-hub/discussions/new?category=ideas).

## Pull Requests

When creating a pull request, please follow these guidelines:

1. Keep PRs reasonably sized. Max 500 LOC is ideal. Prefer splitting into multiple PRs if you can.
1. Include a description of what your PR does and any background information for nuanced topics.
1. Do not request code reviews until the PR checks pass.
1. Include screenshots / videos for frontend PRs if there are visual changes.

A good example is [#77](https://github.com/chanzuckerberg/napari-hub/pull/77).

### Frontend Checks

Creating a PR with changes to [frontend/](./frontend) will start workflows for
testing and linting the PR. When contributing to the frontend, make sure these
checks are passing:

| Action      | Description                    |
| ----------- | ------------------------------ |
| `prettier`  | Lints codebase with Prettier.  |
| `stylelint` | Lints styles with Stylelint.   |
| `eslint`    | Lints JS/TS with ESLint.       |
| `jest`      | Runs unit / integration tests. |
| `tsc`       | Type checks TypeScript code.   |

If you change a component, you may need to [update the
snapshots](./frontend/docs/testing.md#snapshots).
