/* eslint-disable no-restricted-syntax */

if (process.env.MOCK_SERVER === 'false') {
  console.log('MOCK_SERVER is false, exiting');
  process.exit();
}

const cors = require('cors');
const express = require('express');
const { set, pick, get, sample, shuffle } = require('lodash');

const napariPlugin = require('./src/fixtures/plugin.json');
const pluginIndex = require('./src/fixtures/index.json');
const collections = require('./src/fixtures/collections.json');
const metrics = require('./src/fixtures/metrics.json');

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

function getSectionPlugins({ limit, pluginMap, filter = () => true, sort }) {
  const result = [];

  let i = 0;
  while (result.length < limit && pluginMap.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let plugins = Array.from(pluginMap.values()).filter(filter);

    if (plugins.length === 0) {
      break;
    }

    if (sort) {
      plugins.sort(sort);
    } else {
      plugins = shuffle(plugins);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion
    const pluginKey = plugins[0].name;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const plugin = pluginMap.get(pluginKey);
    pluginMap.delete(pluginKey);
    result.push(plugin);
  }

  return result;
}

function compareDates(dateA, dateB) {
  // time in ms makes newer dates have higher values
  return new Date(dateB).getTime() - new Date(dateA).getTime();
}

app.get('/plugin/home/sections/:sections', (req, res) => {
  const limit = +req.query.limit || 3;
  const sections = req.params.sections.split(',');
  const pluginMap = new Map(pluginIndex.map((plugin) => [plugin.name, plugin]));

  const pluginDataType =
    sample(
      Array.from(
        new Set(
          pluginIndex
            .flatMap((plugin) => plugin.plugin_types || [])
            .filter((pluginType) => pluginType !== 'theme'),
        ),
      ),
    ) || 'sample_data';

  const data = {
    plugin_type: {
      type: pluginDataType,
      plugins: getSectionPlugins({
        pluginMap,
        limit,
        filter: (plugin) => !!plugin.plugin_types?.includes(pluginDataType),
      }),
    },

    newest: {
      plugins: getSectionPlugins({
        pluginMap,
        limit,
        sort: (a, b) => compareDates(a.first_released, b.first_released),
      }),
    },

    recently_updated: {
      plugins: getSectionPlugins({
        pluginMap,
        limit,
        sort: (a, b) => compareDates(a.release_date, b.release_date),
      }),
    },

    top_installs: {
      plugins: getSectionPlugins({
        pluginMap,
        limit,
        sort: (a, b) => b.total_installs - a.total_installs,
      }),
    },
  };

  const response = {};
  for (const section of sections) {
    set(response, section, data[section]);
  }

  res.json(response);
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
        'thumb_image',
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

app.get('/metrics/:plugin', (req, res) => {
  const result = get(metrics, [req.params.plugin], null);

  if (result) {
    res.json(result);
  } else {
    res.status(404).send('not found');
  }
});

app.listen(8081, () => console.log('Started mock API server'));
