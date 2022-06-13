/**
 * This script is used for generating the collection fixture data in a
 * reproducible way.
 */

import { sample } from 'lodash-es';
import fs from 'fs';
import path from 'path';

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

  result.push({
    ...data,
    title: titles[i],
    symbol: titles[i].toLowerCase().replaceAll(' ', '-').replaceAll('’', ''),
    summary: summaries[i],
    cover_image: coverImage,
    curator: {
      ...data.curator,
      name: curatorNames[i],
      title: sample(curatorTitles),
      affiliation: {
        ...data.curator.affiliation,
        institution: curatorInstitutions[i],
      },
    },
  });
}

const rootDir = path.resolve(new URL(import.meta.url).pathname, '../..');
const indexFile = path.resolve(rootDir, 'src/fixtures/collections.json');
fs.writeFileSync(indexFile, JSON.stringify(result, null, 2));
