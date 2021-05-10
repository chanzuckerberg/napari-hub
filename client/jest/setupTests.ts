import '@testing-library/jest-dom';

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

afterEach(() => {
  window.location = originalWindowLocation;
});
