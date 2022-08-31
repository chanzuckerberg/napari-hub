import axios from 'axios';

export const spdxLicenseDataAPI = axios.create({
  baseURL:
    'https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json',
});
