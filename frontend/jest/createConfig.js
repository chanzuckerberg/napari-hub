const nextJest = require('next/jest');
const path = require('path');

const createConfig = nextJest({
  dir: path.resolve(__dirname, '../'),
});

module.exports = { createConfig };
