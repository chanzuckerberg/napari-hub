/* eslint-disable no-restricted-syntax */
/**
 * This script is used for generating the metrics fixture data.
 */

const dayjs = require('dayjs');
const { random } = require('lodash');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pluginIndex = JSON.parse(
  fs.readFileSync(path.resolve(rootDir, 'src/fixtures/index.json'), 'utf-8'),
);

const plugins = pluginIndex.map((plugin) => plugin.name);
const metrics = {};

for (const plugin of plugins) {
  const totalMonths = random(3, 20);
  const averageInstall = random(10, 50);
  const installsInLast30Days = averageInstall * 30;
  const totalInstalls = installsInLast30Days * totalMonths;

  const timeline = [];
  const now = dayjs();
  for (let i = Math.min(totalMonths, 12); i >= 1; i -= 1) {
    timeline.push({
      timestamp: now.subtract(i, 'month').toString(),
      installs: Math.floor(installsInLast30Days * random(true)),
    });
  }

  metrics[plugin] = {
    activity: {
      timeline,
      stats: {
        totalMonths,
        totalInstalls,
        installsInLast30Days,
      },
    },
  };
}

const metricsFile = path.resolve(rootDir, 'src/fixtures/metrics.json');
fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
