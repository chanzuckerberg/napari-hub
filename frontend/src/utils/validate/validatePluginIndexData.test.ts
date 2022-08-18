import { PickByValue } from 'utility-types';

import { PluginIndexData, PluginType, PluginWriterSaveLayer } from '@/types';

import { createValidatePluginTest, DELETED } from './helpers';
import { validatePluginIndexData } from './validatePluginIndexData';

type PluginIndexDataKeys<T> = keyof PickByValue<PluginIndexData, T>;

const STRING_PROPS: PluginIndexDataKeys<string>[] = [
  'description',
  'description_content_type',
  'description_text',
  'first_released',
  'license',
  'name',
  'python_version',
  'release_date',
  'summary',
  'version',
];

const STRING_ARRAY_PROPS: PluginIndexDataKeys<string[] | undefined>[] = [
  'development_status',
  'operating_system',
  'reader_file_extensions',
  'writer_file_extensions',
];

describe('validatePluginIndexData()', () => {
  createValidatePluginTest({
    key: 'authors',
    validatePlugin: validatePluginIndexData,

    validData: [
      {
        name: 'foo',
      },
      {
        name: 'bar',
        email: 'bar@example.com',
      },
      {
        name: 'foobar',
        email: 'foobar@example.com',
        orcid: 'some-id',
      },
    ],

    invalidData: [
      {
        name: '',
      },
      {
        name: 'bar',
        email: '',
      },
      {
        name: 'foobar',
        email: null,
        orcid: 24,
      },
    ] as PluginIndexData['authors'],

    expectedInvalidDataResult: [
      {
        name: 'bar',
      },
      {
        name: 'foobar',
      },
    ],
  });

  createValidatePluginTest({
    key: 'category',
    validatePlugin: validatePluginIndexData,

    validData: {
      'Image modality': ['foo'],
      'Supported data': ['bar'],
      'Workflow step': ['foobar'],
    },

    invalidData: {
      'not-a-supported-key': ['foo', 'bar', 123],
      'Image modality': [],
      'Supported data': [10, 'barfoo', null, undefined, ''],
      'Workflow step': ['foobar'],
    } as never,

    expectedInvalidDataResult: {
      'Supported data': ['barfoo'],
      'Workflow step': ['foobar'],
    },
  });

  createValidatePluginTest({
    key: 'display_name',
    validatePlugin: validatePluginIndexData,

    validData: 'foobar',
    invalidData: 42 as never,
    expectedInvalidDataResult: DELETED,
  });

  createValidatePluginTest({
    key: 'plugin_types',
    validatePlugin: validatePluginIndexData,

    validData: [PluginType.Reader, PluginType.Writer, PluginType.SampleData],

    invalidData: [
      PluginType.Reader,
      42,
      PluginType.SampleData,
      undefined,
      null,
      'foobar',
    ] as never,

    expectedInvalidDataResult: [PluginType.Reader, PluginType.SampleData],
  });

  createValidatePluginTest({
    key: 'writer_save_layers',
    validatePlugin: validatePluginIndexData,

    validData: [
      PluginWriterSaveLayer.Image,
      PluginWriterSaveLayer.Shapes,
      PluginWriterSaveLayer.Points,
    ],

    invalidData: [
      PluginWriterSaveLayer.Image,
      PluginWriterSaveLayer.Points,
      PluginType.Reader,
      42,
      PluginType.SampleData,
      undefined,
      null,
      'foobar',
      '',
    ] as never,

    expectedInvalidDataResult: [
      PluginWriterSaveLayer.Image,
      PluginWriterSaveLayer.Points,
    ],
  });

  STRING_PROPS.forEach((key) =>
    createValidatePluginTest({
      key,
      validatePlugin: validatePluginIndexData,
      validData: 'foobar',
      invalidData: 42 as never,
      expectedInvalidDataResult: '',
    }),
  );

  STRING_ARRAY_PROPS.forEach((key) =>
    createValidatePluginTest({
      key,
      validatePlugin: validatePluginIndexData,
      validData: ['foo', 'bar', 'foobar'],
      invalidData: ['foobar', 42, null, undefined, '', NaN] as never,
      expectedInvalidDataResult: ['foobar'],
    }),
  );
});
