import { PluginAuthor, PluginData } from './plugin';

export interface CollectionInstitution {
  institution: string;
  website: string;
}

export interface CollectionLinks {
  orcid: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export interface CollectionCurator {
  name: string;
  title: string;
  affiliation: CollectionInstitution;
  links?: CollectionLinks;
}

export interface CollectionPlugin
  extends Pick<PluginData, 'name' | 'summary' | 'display_name'> {
  authors: PluginAuthor[];
  comment?: string;
}

export interface CollectionIndexData {
  title: string;
  cover_image: string;
  thumb_image: string;
  summary: string;
  curator: CollectionCurator;
  symbol: string;
}

export enum CollectionVisibility {
  Public = 'public',
  Hidden = 'hidden',
  Disabled = 'disabled',
}

export interface CollectionData extends CollectionIndexData {
  description: string;
  updated_date: string;
  plugins: CollectionPlugin[];
  visibility?: CollectionVisibility;
}
