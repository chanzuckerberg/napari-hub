import '@testing-library/jest-dom';

import timezoneMock from 'timezone-mock';

// Mock window.location for every test case:
// https://stackoverflow.com/a/57612279
const originalWindowLocation = window.location;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.location;

  // Reassign to regular object so that properties can be reassign
  window.location = {
    ...originalWindowLocation,
  };
});

// Mock timezone to have consistent test results in CI.
beforeAll(() => {
  timezoneMock.register('US/Pacific');
});

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: {},
  }),
}));
