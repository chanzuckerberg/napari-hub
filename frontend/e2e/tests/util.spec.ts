import { test } from '@playwright/test';

import { PluginFilter } from '../types/filter';
import { searchPluginFixture } from '../utils/common';

test.describe('Utility tests', () => {
  test.only('should test JSOn search utility', async () => {
    const filter: PluginFilter = {
      authors: ['Graham Dellaire', 'Robert Haase'],
    };
    const plugins = searchPluginFixture(filter);
    console.log(JSON.stringify(plugins[0]));
  });
});
