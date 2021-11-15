// We need to use `babel-jest` because `ts-jest` has memory leak issues and will
// make GitHub Actions fail due to a memory error:
// https://github.com/kulshekhar/ts-jest/issues/1967
//
// TODO Remove config when upgrading to Next.js v12. The next release will
// include a Jest transformer for SWC:
// https://github.com/vercel/next.js/discussions/30174
module.exports = {
  presets: ['next/babel'],
};
