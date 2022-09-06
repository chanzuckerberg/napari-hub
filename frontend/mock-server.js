/* eslint-disable no-restricted-syntax */

if (process.env.MOCK_SERVER === 'false') {
  console.log('MOCK_SERVER is false, exiting');
  process.exit();
}

const cors = require('cors');
const dayjs = require('dayjs');
const express = require('express');
const { set, pick, get } = require('lodash');

const napariPlugin = require('./src/fixtures/plugin.json');
const pluginIndex = require('./src/fixtures/index.json');
const collections = require('./src/fixtures/collections.json');
const activity = require('./src/fixtures/activity.json');

const app = express();

app.use(cors());

app.get('/plugins', async (_, res) => {
  const versions = pluginIndex.reduce(
    (result, { name, version }) => set(result, name, version),
    {},
  );

  res.json(versions);
});

app.get('/plugins/index', async (_, res) => {
  res.json(pluginIndex);
});

app.get('/plugins/:name', async (req, res) => {
  const plugin = pluginIndex.find(({ name }) => name === req.params.name);

  if (plugin) {
    res.json({
      ...napariPlugin,
      ...plugin,
    });
  } else {
    res.status(404).send('not found');
  }
});

app.get('/collections', async (_, res) => {
  res.json(
    collections.map((collection) =>
      pick(collection, [
        'title',
        'cover_image',
        'summary',
        'curator',
        'symbol',
      ]),
    ),
  );
});

app.get('/collections/:symbol', async (req, res) => {
  const collection = collections.find(
    ({ symbol }) => symbol === req.params.symbol,
  );

  if (collection) {
    res.json(collection);
  } else {
    res.status(404).send('not found');
  }
});

app.get('/activity/plugins', (_, res) => {
  res.json(Object.keys(activity));
});

app.get('/activity/:plugin/stats', (req, res) => {
  const stats = get(activity, [req.params.plugin, 'stats'], null);

  if (stats) {
    res.json(stats);
  } else {
    res.status(404);
  }
});

app.get('/activity/:plugin', async (req, res) => {
  const stats = get(activity, [req.params.plugin, 'points'], null);

  if (stats) {
    res.json(stats);
  } else {
    res.status(404);
  }
});

app.listen(8081, () => console.log('Started mock API server'));
