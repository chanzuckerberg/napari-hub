const express = require('express');

const napariPlugin = require('./src/fixtures/napari.json');

const app = express();

app.get('/plugins', async (req, res) => {
  res.json({ 'napari-compressed-labels-io': '0.0.0' });
});

app.get('/plugins/:name', async (req, res) => {
  res.json(napariPlugin);
});

app.listen(8081, () => console.log('Started proxy server'));
