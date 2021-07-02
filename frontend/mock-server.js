if (process.env.MOCK_SERVER === 'false') {
  console.log('MOCK_SERVER is false, exiting');
  process.exit();
}

const express = require('express');

const napariPlugin = require('./src/fixtures/napari.json');
const pluginIndex = require('./src/fixtures/index.json');

const app = express();

app.get('/plugins', async (_, res) => {
  res.json({ 'napari-compressed-labels-io': '0.0.0' });
});

app.get('/plugins/index', async (_, res) => {
  res.json(pluginIndex);
});

app.get('/plugins/:name', async (_, res) => {
  res.json(napariPlugin);
});

app.listen(8081, () => console.log('Started mock API server'));
