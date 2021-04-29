import { formatDate } from './date';

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
