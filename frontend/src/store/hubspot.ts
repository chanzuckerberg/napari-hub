import { proxy } from 'valtio';

export const hubspotStore = proxy({
  ready: false,
});
