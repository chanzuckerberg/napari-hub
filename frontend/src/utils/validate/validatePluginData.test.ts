import { PickByValue, SetDifference } from 'utility-types';

import { PluginData, PluginIndexData } from '@/types';

import { createValidatePluginTest, DELETED } from './helpers';
import { validatePluginData } from './validatePluginData';

type PluginDataKeys<T> = SetDifference<
  keyof PickByValue<PluginData, T>,
  keyof PickByValue<PluginIndexData, T>
>;

const STRING_PROPS: PluginDataKeys<string>[] = [
  'code_repository',
  'documentation',
  'project_site',
  'report_issues',
  'support',
  'twitter',
];

const STRING_ARRAY_PROPS: PluginDataKeys<string[]>[] = ['requirements'];

describe('validatePluginData()', () => {
  createValidatePluginTest<PluginData, PluginDataKeys<unknown>>({
    key: 'action_repository',
    validatePlugin: validatePluginData,
    validData: 'https://github.com/chanzuckerberg/napari-hub/pulls/3',
    invalidData: 42 as never,
    expectedInvalidDataResult: DELETED,
  });

  createValidatePluginTest<PluginData, PluginDataKeys<unknown>>({
    key: 'category_hierarchy',
    validatePlugin: validatePluginData,
    validData: {
      'Supported data': [['2D'], ['3D']],
      'Workflow step': [
        ['Image Segmentation', 'Manual segmentation'],
        ['Image annotation', 'Dense image annotation', 'Manual segmentation'],
        ['Image Segmentation', 'Semi-automatic segmentation'],
      ],
    },
    invalidData: {
      'Supported data': [['2D'], ['3D']],
      'Workflow step': [
        'foobar',
        1234,
        false,
        true,
        null,
        undefined,
        [],
        { a: 1, b: 2 },
        ['foobar', 24, null, 'bar', undefined],
        [NaN, [], 'foo'],
      ],
    } as never,
    expectedInvalidDataResult: {
      'Supported data': [['2D'], ['3D']],
      'Workflow step': [['foobar', 'bar'], ['foo']],
    },
  });

  createValidatePluginTest<PluginData, PluginDataKeys<unknown>>({
    key: 'citations',
    validatePlugin: validatePluginData,
    validData: {
      APA: 'apa',
      BibTex: 'bib',
      citation: 'citation',
      RIS: 'ris',
    },
    invalidData: {
      APA: null,
      BibTex: 24,
      RIS: false,
    } as never,
    expectedInvalidDataResult: DELETED,
  });

  STRING_PROPS.forEach((key) =>
    createValidatePluginTest<PluginData, PluginDataKeys<unknown>>({
      key,
      validatePlugin: validatePluginData,
      validData: 'foobar',
      invalidData: 42 as never,
      expectedInvalidDataResult: '',
    }),
  );

  STRING_ARRAY_PROPS.forEach((key) =>
    createValidatePluginTest<PluginData, PluginDataKeys<unknown>>({
      key,
      validatePlugin: validatePluginData,
      validData: ['foo', 'bar', 'foobar'],
      invalidData: ['foobar', 42, null, undefined, '', NaN] as never,
      expectedInvalidDataResult: ['foobar'],
    }),
  );
});
