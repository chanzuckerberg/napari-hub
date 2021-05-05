const axios = require('axios');
const express = require('express');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const app = express();

app.get('/plugins', async (_, res) => {
  const { data } = await axios.get(`${API_URL}/plugins`);
  res.json(data);
});

app.get('/plugins/:name', async (req, res) => {
  const { name } = req.params;
  const { data } = await axios.get(`${API_URL}/plugins/${name}`);
  res.json(data);
});

app.listen(80, () => console.log('Started proxy server'));
