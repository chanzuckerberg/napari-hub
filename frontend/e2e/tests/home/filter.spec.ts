import { expect, test } from '@playwright/test';
import { satisfies } from '@renovate/pep440';

import { testPluginFilter } from '../../utils/filter';

test.describe('Plugin Filters', () => {
  test.only('should filter by python version', async ({ page, viewport }) => {
    await testPluginFilter({
      page,
      width: viewport?.width,
      options: ['3.7', '3.8'],
      filterKey: 'pythonVersion',
      params: [
        ['python', '3.7'],
        ['python', '3.8'],
      ],
      testMetadata(versionSpecifiers: string[]) {
        // Check that every plugin version passes the enabled filter.
        versionSpecifiers.forEach((specifier) =>
          expect(
            satisfies('3.7', specifier) || satisfies('3.8', specifier),
          ).toBe(true),
        );
      },
    });
  });

  test('should filter by operating system', async ({ page, viewport }) => {
    function hasLinux(operatingSystems: string[]) {
      return !!operatingSystems.find((os) => os.includes('Linux'));
    }

    await testPluginFilter({
      page,
      width: viewport?.width,
      options: ['Linux'],
      filterKey: 'operatingSystems',
      params: [['operatingSystem', 'linux']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).toBe(true);
      },
    });

    await testPluginFilter({
      page,
      width: viewport?.width,
      options: ['macOS'],
      filterKey: 'operatingSystems',
      params: [['operatingSystem', 'mac']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).not.toBe(true);
      },
    });
  });

  test('should filter by license', async ({ page, viewport }) => {
    await testPluginFilter({
      page,
      width: viewport?.width,
      options: [],
      filterKey: 'license',
      params: [],
      testMetadata(licenses) {
        expect(licenses).toContain('secret');
      },
    });

    await testPluginFilter({
      page,
      width: viewport?.width,
      options: ['Limit to plugins with open source license'],
      filterKey: 'license',
      params: [['license', 'oss']],
      testMetadata(licenses) {
        expect(licenses).not.toContain('secret');
      },
    });
  });

  test('should filter by workflow step', async ({ page, viewport }) => {
    const options = ['Image registration', 'Pixel classification'];

    await testPluginFilter({
      page,
      width: viewport?.width,
      options,
      filterKey: 'workflowStep',
      params: [
        ['workflowStep', options[0]],
        ['workflowStep', options[1]],
      ],
    });
  });

  test('should filter by image modality', async ({ page, viewport }) => {
    const options = ['Medical imaging', 'Multi-photon microscopy'];

    await testPluginFilter({
      page,
      width: viewport?.width,
      options,
      filterKey: 'imageModality',
      params: [
        ['imageModality', options[0]],
        ['imageModality', options[1]],
      ],
    });
  });

  test('should filter by supported data', async ({ page, viewport }) => {
    const options = ['2D', '3D'];

    await testPluginFilter({
      page,
      width: viewport?.width,
      options,
      filterKey: 'supportedData',
      params: [
        ['supportedData', options[0]],
        ['supportedData', options[1]],
      ],
    });
  });
});
