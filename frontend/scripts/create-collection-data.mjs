/**
 * This script is used for generating the collection fixture data in a
 * reproducible way.
 */

import { random, sample } from 'lodash-es';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(new URL(import.meta.url).pathname, '../..');
const pluginIndex = JSON.parse(
  fs.readFileSync(path.resolve(rootDir, 'src/fixtures/index.json'), 'utf-8'),
);

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer porta mauris eget convallis efficitur. Donec ultrices ligula turpis, sit amet laoreet erat aliquet vitae. In quis pellentesque ex. Vestibulum eu metus laoreet, blandit dolor sit amet, tristique leo. Sed sollicitudin elit vel venenatis lacinia. Mauris tempor nisl odio, sed placerat ligula dignissim eu. Ut et commodo felis, a pellentesque ipsum. Nulla eu nisi nec eros dapibus iaculis nec sit amet magna. Nam consectetur interdum pharetra. Donec sollicitudin ornare mi at aliquam. Fusce tortor eros, aliquet non ipsum ut, congue pretium quam. In rutrum vestibulum nibh ut eleifend. Nullam quam magna, eleifend et eleifend id, ultricies vel diam.';

const titles = [
  'Time-saving segmentation plugins',
  'Allen Cell Institute’s plugins',
  'ABRF biology workflow',
  'Point-detection plugins',
  'The most essential readers and writers for biologists',
  'Neuro-pathway detection',
  'The best sample datasets for cell biology',
  'napari themes',
  'Segmentify any cell type',
  'Contrast-enhancing plugins for microscopy analysis',
  'Segmentify anything you can imagine',
  'Feature detection plugins',
];

const summaries = [
  'Hand-picked plugins to help you segment your cells ever so efficiently.',
  'All plugins made public by the Allen Cell Institute; primarily aimed at cell biologists.',
  'Plugins filling the gap in the ABRF workflow in napari.',
  'The most accurate point-detection plugins for napari; list actively updated.',
  "Open and save to most any file format you'll need as a biologist in napari with this list.",
  'napari plugins specifically for neurobiologists looking to detect neural pathways.',
  'Sample datasets with several pre-identified features to test workflows against.',
  "Every plugin capable of changing napari's theme, from fonts to colors.",
  'From plant cells to paramecia, these plugins have you and your obscure cell types covered',
  'Reduce noise and enhance signal; some included plugins also de-blur impressively.',
  'From pumpkins to penguins to jelly beans in jars, let the ML do the counting for you!',
  'Just a few favorite featurization plugins from the community.',
];

const curatorNames = [
  'Vivien Donovan',
  'Quigley Schoolcraft',
  'Moab Luminoso',
  'Kinshasa Kosette Mickelthwait-Venkatesh',
  'Fritz Curiel',
  'Zed Wexler',
  'Faisal Farooq',
  'Brigitta Fleet',
  'Guster Talltooth',
  'Via Levine',
  'Alfredo Angelopolous',
  'Greggor Golightly',
];

const curatorInstitutions = [
  'Imaging Scientist, Cell Core Research Facility',
  'Machine Learning Engineer, Allen Cell Institute',
  'Imaging Research Scientist, Association of Biomolecular Resource Facilities',
  'Research Biologist, Low Anchor Center for Human Disease and Study',
  'Cell Innovation Expert, University of Catania',
  'Research Biologist, Cardiff College of Microbiology',
  'Cell Disease Specialist, University of Washington Medical Center',
  'Chan Zuckerberg Initiative',
  'Orinda Medical Center Fellow, Orinda Medical Center',
  'Imaging Specialist, Hobie Swingle Institute for Cell Science',
  'Research Scientist, ML for the Cell',
  'Cell Innovation Scientist, Carpati Institution',
];

const curatorTitles = [
  'Head Research Engineer',
  'Product Manager',
  'Software Engineer',
  'Imaging Scientist',
];

const images = [
  'national-cancer-institute-4zA4w-dr5WM-unsplash.jpg',
  'national-cancer-institute-J28Nn-CDbII-unsplash.jpg',
  'national-cancer-institute-LnvCEXQwC-o-unsplash.jpg',
  'national-cancer-institute-NbZQYileaOI-unsplash.jpg',
  'national-cancer-institute-TX9pU27p6D0-unsplash.jpg',
  'national-cancer-institute-W2OVh2w2Kpo-unsplash.jpg',
  'national-cancer-institute-dMZC6hdobnk-unsplash.jpg',
  'national-cancer-institute-evhLgfOjU5Y-unsplash.jpg',
  'national-cancer-institute-irmUWEcjIz4-unsplash.jpg',
  'national-cancer-institute-lsxKuARrQXI-unsplash.jpg',
  'national-cancer-institute-mbL91Lg56zc-unsplash.jpg',
  'national-cancer-institute-rvDeUG7YV64-unsplash.jpg',
];

const comments = [
  undefined,
  'This is a cool plugin is cool',
  'This is an awesome plugin is',
  'This is the best plugin there was',
  'This is a plugin that has really long description because we should be testing plugins with long descriptions by adding long description to the data so that it can be tested with long descriptions in comparison to the short descriptions which are not as long, so it makes sense for it to be tested at the same time, regardless of length, because the length of the description is important and can reveal edge cases that would otherwise not be found with only a short description, hence the really long description that is being written right now.',
];

const allPlugins = pluginIndex.map((plugin) => ({
  display_name: plugin.display_name,
  name: plugin.name,
  summary: plugin.summary,
  comment: sample(comments),
  authors: plugin.authors,
}));

const data = {
  title: '',
  updated_date: '2022-05-30',
  summary: '',
  cover_image: '',
  curator: {
    name: '',
    title: '',
    affiliation: {
      institution: '',
      website: 'https://example.com',
    },
  },
};

const result = [];

for (let i = 0; i < titles.length; i += 1) {
  const coverImage = `https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/images/${images[i]}`;
  let pluginCount = random(1, 10);
  const plugins = [];
  const pluginSet = new Set();

  while (pluginCount > 0) {
    const plugin = sample(allPlugins);

    if (!pluginSet.has(plugin.name)) {
      pluginSet.add(plugin.name);
      plugins.push(sample(allPlugins));
      pluginCount--;
    }
  }

  result.push({
    ...data,
    plugins,
    title: titles[i],
    symbol: titles[i].toLowerCase().replaceAll(' ', '-').replaceAll('’', ''),
    summary: summaries[i],
    description: lorem,
    cover_image: coverImage,
    curator: {
      ...data.curator,
      name: curatorNames[i],
      title: sample(curatorTitles),
      affiliation: {
        ...data.curator.affiliation,
        institution: curatorInstitutions[i],
      },
      links: {
        orcid: '0000-0002-4638-7015',
        twitter: 'https://twitter.com/neuromusic',
        github: 'https://github.com/neuromusic',
        website: 'https://justinkiggins.com',
      },
    },
  });
}

const indexFile = path.resolve(rootDir, 'src/fixtures/collections.json');
fs.writeFileSync(indexFile, JSON.stringify(result, null, 2));
