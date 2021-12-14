import { DeepPartial } from 'utility-types';

import { HubDimension } from '@/types';

// TODO Move this to a separate file for when react-intl is added.
export const TOOLTIP_TEXT: DeepPartial<
  Record<HubDimension, Record<string, string>>
> = {
  'Workflow step': {
    'Image registration':
      'Image registration is the process of aligning two or more images of the same (or similar) scene, when images are captured under variable conditions that can change the acquisition perspective or the content of the scene.',
    'Image correction':
      'Image correction removes aberrations originating from the imaging instrument, lighting, or sample, e.g. chromatic aberration correction, drift correction, spectral unmixing.',
    'Image enhancement':
      'Image enhancement refers to an operation that increases the quality of the image or enhances features of interest in the image, e.g. contrast enhancement, denoising.',
    'Image reconstruction':
      'Image reconstruction refers to a wide arrays of operation that reconstructs the image, e.g. deconvolution, stitching, structured illumination reconstruction. ',
    'Morphological operations':
      'Morphological operations is a technique for the analysis and processing of geometrical structures, based on set theory, lattice theory, topology, and random functions. It is most commonly applied to images, but it can be employed as well on graphs, surface meshes, solids, and many other spatial structures. The basic morphological operators are erosion, dilation, opening and closing.',
    'Image fusion':
      'Image fusion is the process of gathering all the important information from multiple images, and their inclusion into fewer images, usually a single one.',
    'Pixel classification':
      'Pixel Classification assigns labels to pixels based on pixel features. ',
    'Image feature detection':
      'Feature detection includes methods for computing abstractions of image information and making local decisions at every image point whether there is an image feature of a given type.',
    'Image annotation':
      'Image annotation is the process of defining labels or metadata to an image, e.g. defining regions, marking points, creating textual descriptions, attaching tags to image contents. ',
    'Filament tracing':
      "Filament tracing takes an image of filamentous structures (may be a tree-like structure, a filament network, or 'stick-like' filaments) as input and outputs data that represent the filament, commonly a skeleton representation of the filaments and their diameters or surfaces.",
    'Image Segmentation':
      'Image segmentation is the process of partitioning an image into multiple objects and sits on the border between Image Processing and Image Analysis',
    'Object classification':
      'Object classification uses a classifier to recognize categories of objects based on their features.',
    'Object-based colocalisation':
      'Object-based colocalisation refers to the identification of the spatial overlap between two (or more) different objects.',
    'Object feature extraction':
      'Object features include, but not limited to: shapes, textures, dynamics (for time series image)',
    'Object tracking':
      'Object tracking takes detected objects from a time-series image and tracks each of the objects as they move over time. ',
    Clustering:
      'Clustering is a process of grouping a set of objects in such a way that objects in the same group are, in some sense,  more similar to each other than to those in other groups. Sometimes referred to as unsupervised classification.',
    'Frequency domain analysis':
      'Frequency domain analysis quantifies the various amounts (e.g. amplitudes, powers, intensities, or phases) versus frequency. It requires decompose an image into a sum of many individual frequency components. ',
    'Pixel-based colocalisation':
      'In pixel-based colocalisation, the intensity of a pixel in one channel is evaluated against the corresponding pixel in another channel, generally producing a scatterplot from which a correlation coefficient is determined.',
    'Fluorescence correlation spectroscopy':
      'FCS is a statistical analysis that measures fluorescence intensity fluctuation via time or spatial correlation, which provides physical parameters of the sample such as diffusion coefficient or concentration.',
    'Optical flow analysis':
      'Optical flow analysis is the process of estimating motion in a time-series image, typically represented as vector field as the distribution of the apparent object velocities in an image. ',
    'Image classification':
      'Image classification is a process for assigning images to different classes based on the content of the image.',
    Visualization:
      'Visualization covers plugins that enhance or create visualization utilities for images and data plotting.',
    'Synthetic image generation':
      'Generates synthetic images through a simulation',
  },

  'Image modality': {
    'Fluorescence microscopy':
      'Techniques in microscopy based on the use of fluorescent molecules that emit light of longer wavelength upon excitation.',
    'Phase-Contrast microscopy':
      'Phase-contrast microscopy is based on the conversion of sample-induced phase shift of light into contrast in an image.',
    'Bright-field microscopy':
      'Microscopy technique based on the direct observation of samples with light transmitted through them.',
    'Ultrasound imaging':
      'Ultrasound imaging (sonography) uses high-frequency sound waves to view inside the body. ',
    'Magnetic resonance imaging':
      'MRI uses magnetic fields and radio waves to generate images of organs and tissues.',
    'Computed tomography ':
      'CT is a computerized imaging procedure in which a narrow beam of X-rays is quickly rotated around the body, producing signals that are processed by the computer to generate cross-sectional images. ',
    'Electron microscopy':
      'Microscopy that uses a beam of accelerated electrons to image a sample, e.g. TEM, SEM. ',
    'Multimodal imaging':
      'Utilizing different imaging modalities in combination, e.g. correlative light and electron microscopy (CLEM)',
    'DIC microscopy':
      'Contrast enhancing microscopy technique based on interferences between rays that travel different distances through a sample.',
    'Medical imaging':
      'Medical imaging is the technique and process of imaging the interior of a body for clinical analysis and medical intervention, as well as visual representation of the function of some organs or tissues.',
    'Confocal microscopy':
      'Microscopy restricted to objects which are in the same focal plane.',
    'Multi-photon microscopy':
      'Fluorescence microscopy technique in which the fluorescent molecule is excited by multiple photons of a wavelength longer than the emission of the fluorescent molecule.',
  },
};
