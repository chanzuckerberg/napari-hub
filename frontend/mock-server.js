if (process.env.MOCK_SERVER === 'false') {
  console.log('MOCK_SERVER is false, exiting');
  process.exit();
}

const express = require('express');
const { set } = require('lodash');

const napariPlugin = require('./src/fixtures/napari.json');
const pluginIndex = require('./src/fixtures/index.json');

const app = express();

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

app.listen(8081, () => console.log('Started mock API server'));
