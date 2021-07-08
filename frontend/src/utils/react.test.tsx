import { ReactNode } from 'react';

import { isReactElement } from './react';

describe('isReactElement()', () => {
  it('should return true for react element', () => {
    const testCases: ReactNode[] = [
      <h1>hello</h1>,
      <p>world</p>,
      <span>foobar</span>,
      <>
        <p>hello</p>
      </>,
    ];

    testCases.forEach((input) => expect(isReactElement(input)).toBeTruthy());
  });

  it('shoud return false for non-react element', () => {
    const testCases: ReactNode[] = [[], 'hello', null, false];
    testCases.forEach((input) => expect(isReactElement(input)).toBeFalsy());
  });
});
