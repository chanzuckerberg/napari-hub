# Frontend Testing

We use several automated testing strategies for the napari hub frontend. Testing
is handled entirely using [Jest](https://jestjs.io/) and community plugins. For
unit and integration tests, we use Jest with [React Testing
Library](https://testing-library.com/docs/react-testing-library/intro/), and for
E2E tests, we use Jest and
[Playwright](https://github.com/playwright-community/jest-playwright).

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Fixture Data](#fixture-data)
- [Unit / Integration Tests](#unit-integration-tests)
- [E2E Tests](#e2e-tests)
- [Snapshots](#snapshots)

## Fixture Data

We include fixture data in [fixtures/](../src/fixtures). This data is
used for mocking backend data to provide consistent test results.

## Unit / Integration Tests

Test files are located in [src/](../src/), and will usually be colocated with
the module its testing. For example, if we have a component `Component.tsx`, a
corresponding test file will look like `Component.test.tsx`. We make no
distinction between unit and integration tests since the testing code is similar
for both. To run unit / integration tests, use the `test` package script:

```sh
yarn test
```

Running in watch mode will only re-run failed tests if the test file is modified.

```sh
yarn test:watch
```

It's also possible to target specific file patterns:

```sh
# Matches src/components/TestComponent/TestComponent.test.tsx.
yarn test TestComponent

# Matches src/utils/**/*.test.ts.
yarn test src/utils

# Matches src/components/common/**/*.test.ts.
yarn test:watch components/common
```

## E2E Tests

E2E tests are located in [tests/](../tests/), and are similar to running unit /
integration tests. Under the hood, tests use
[Playwright](https://playwright.dev/) for browser automation.

To run tests, use the `e2e` package script:

```sh
# Run all tests.
yarn e2e

# Run tests in watch mode.
yarn e2e:watch

# Run specific tests.
yarn e2e page
```

## Snapshots

Some tests use snapshots for testing. When updating a component, you may need to update the test snapshots. To update the snapshots, use the `test:update` script:

```sh
yarn test:update
```
