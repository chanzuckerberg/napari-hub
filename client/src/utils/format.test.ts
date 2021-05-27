import { formatDate, formatOperatingSystem } from './format';

describe('formatDate()', () => {
  it('should format date', () => {
    const year = 2021;
    const month = 3;
    const day = 30;
    const date = new Date(year, month, day).toISOString();

    expect(formatDate(date)).toBe(`${day} April ${year}`);
  });

  it('should add leading zero for days', () => {
    const year = 2021;
    const month = 3;
    const day = 2;
    const date = new Date(year, month, day).toISOString();

    expect(formatDate(date)).toBe(`0${day} April ${year}`);
  });
});

describe('formatOperatingSystem()', () => {
  const testCases = [
    {
      name: 'should support one level',
      input: 'Operating System :: MacOS',
      output: 'MacOS',
    },
    {
      name: 'should support deeply nested level',
      input: 'Operating System :: Microsoft :: Windows :: Windows 10',
      output: 'Windows 10',
    },
  ];

  testCases.forEach((testCase) =>
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const result = formatOperatingSystem(testCase.input);
      expect(result).toEqual(testCase.output);
    }),
  );
});
