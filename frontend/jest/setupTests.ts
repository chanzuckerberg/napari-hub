import '@testing-library/jest-dom';

import { get } from 'lodash';
import timezoneMock from 'timezone-mock';

import { I18nResources } from '@/constants/i18n';

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

jest.mock('@/components/common/I18n', () => ({
  I18n: ({ i18nKey }: { i18nKey: string }) => {
    const [namespace, key] = i18nKey.split(':');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return get(I18nResources, [namespace, ...key.split('.')]) ?? i18nKey;
  },
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => [
    (i18nKey: string) => {
      const [namespace, key] = i18nKey.split(':');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return get(I18nResources, [namespace, ...key.split('.')]) ?? i18nKey;
    },
  ],
}));
