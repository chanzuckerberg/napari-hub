/**
 * Axios global configuration. Shared values for every network request made with
 * axios.
 */

import axios from 'axios';

/**
 * URL to hub API to make requests to.
 */
const API_URL = process.env.API_URL || 'http://localhost:8081';

/**
 * Host to use for Host header when making requests. Setting this is required
 * during local development because AWS API Gateway performs a host check for
 * API requests.
 */
const API_URL_HOST = process.env.API_URL_HOST || new URL(API_URL).host;

axios.defaults.baseURL = API_URL;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
axios.defaults.headers.common.Host = API_URL_HOST;
