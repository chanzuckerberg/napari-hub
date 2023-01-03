export type PluginFilter = {
  authors?: Array<string>;
  supported_data?: Array<string>;
  operating_system?: Array<string>;
  reader_file_extensions?: Array<string>;
  writer_file_extensions?: Array<string>;
  license?: string;
  plugin_types?: Array<string>;
  python_version?: string;
};
