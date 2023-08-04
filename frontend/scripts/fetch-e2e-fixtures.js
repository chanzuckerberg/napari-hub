const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function fetchOsiLicenseData() {
  const {
    data: { licenses },
  } = await axios.get(
    'https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json',
  );

  await fs.writeFile(
    path.resolve(__dirname, '../e2e/fixtures/osi-licenses.json'),
    JSON.stringify(licenses),
  );
}

const ENV = process.env.ENV || 'local';

function getBaseURL() {
  if (ENV === 'prod') {
    return 'https://api.napari-hub.org';
  }

  if (ENV === 'staging') {
    return 'https://api.staging.napari-hub.org';
  }

  return 'http://localhost:8081';
}

async function fetchFixtureData() {
  const api = axios.create({
    baseURL: getBaseURL(),
  });

  console.log('fetching plugin index');
  const { data: index } = await api.get(
    '/plugins/index?use_dynamo_plugin=true',
  );

  const pluginMap = {};
  console.log(`fetching data for ${index.length} plugins`);
  await Promise.allSettled(
    index.map(async (pluginIndexData) => {
      const { data: pluginData } = await api.get(
        `/plugins/${pluginIndexData.name}?use_dynamo_plugin=true`,
      );

      pluginMap[pluginIndexData.name] = {
        ...pluginIndexData,
        ...pluginData,
      };
    }),
  );

  await fs.writeFile(
    path.resolve(__dirname, `../e2e/fixtures/${ENV}.json`),
    JSON.stringify(
      Object.values(pluginMap).sort((plugin1, plugin2) =>
        plugin1.name.localeCompare(plugin2.name),
      ),
    ),
  );
}

async function main() {
  console.log('fetching OSI license data');
  await fetchOsiLicenseData();

  console.log(`fetching e2e fixture data from ${ENV}`);
  await fetchFixtureData();
}

main();
