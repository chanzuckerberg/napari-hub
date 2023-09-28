export enum AccordionTitle {
  FilterByRequirement = 'Filter by requirement',
  FilterByCategory = 'Filter by category',
  Sort = 'Sort',
}

export type PluginFilter = {
  label: string;
  name: string;
  values: Array<string>;
  category: Array<string>;
  key: string;
};
