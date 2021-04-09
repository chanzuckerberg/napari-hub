# napari hub

This repository contains the source code for the _napari hub_, a place to find, evaluate, and install _napari_ plugins, built by the Imaging Team at the Chan Zuckerberg Initiative.

## What we're building now

For our first _alpha/v0_ release in June 2021, the _napari hub_ will focus on making it easy for [Research Biologists, Imaging Scientists, and Bioimage Analysts](https://cziscience.medium.com/user-experience-research-in-the-imaging-field-6bb89e592bb9) to find, evaluate, and install _napari_ plugins distributed through PyPI.

After talking with users about the challenges and needs in finding analysis solutions to bioimaging problems, we focused on a handful of critical features for our first release, including...

- *global search bar* which returns results from multiple metadata sources (title, author, summary, description, etc.)
- *napari-specific metadata*, such as author(s), links to external docs, support channels, etc., that plugin developers can easily define in PyPI metadata or Github config files
- *napari-specific description* supports both napari-specific description specified in their Github repo or default to PyPI description if plugin developer does not use napari-specific description.
- *install “call-to-action”* button for each plugin with plugin-specific instructions on how to install
- *filter/sort* available plugins based on limited selection of metadata (2-3 filters, 1-2 sorts) that can be handled client side
- *mailing list* sign up for announcements and updates for the _napari hub_

## What we're building next

After our _alpha_ launch, we're very excited to keep iterating and building new features that are of value to the imaging community, supporting current and future _napari_ users and developers.

We have a host of ideas for ways that we can help scientists learn if a plugin is right for them, for imaging scientists to share their knowledge with core facility users and collaborators, and ways to help lower barriers for image analysts in creating, maintaining, and supporting their plugins.

When we have a clearer idea of our roadmap beyond our June release, we'll share it here. In the meantime, feel free to share your ideas by submitting a [feature request](https://github.com/chanzuckerberg/napari-hub/issues)!

## About

The _napari hub_ is a service of the Chan Zuckerberg Initiative.

[_napari_](https://napari.org) is a consensus-based community project and an open source tool that enables high performance visualization and exploration of a broad range of imaging data, including microscopy, medical imaging, geospatial data, and more, with clearly defined governance model, mission, and values.
At CZI, we support the development of open source and community run tools like _napari_, as part of our mission to accelerate biomedical research and help every scientist make progress faster.

The [CZI Imaging Team](https://chanzuckerberg.com/science/programs-resources/imaging/) seeks to remove barriers in the analysis of imaging and microscopy data and make it easier for biologists to access emerging methods for bioimage analysis that leverage machine learning.
CZI sees promise in _napari_ and seeks to assist its development by providing resources not always available to the open source community, including dedicated user research, design, and engineering support.
CZI is proud to collaborate with the science community to accelerate research and enable open science for all.

## Source Code

We're building the napari hub out in the open, so if you want to contribute
or get a sneak, please take a look at:

- [napari hub client](client/README.md)

### Team

- Jeremy Asuncion, Engineering ([@codemonkey800](https://github.com/codemonkey800))
- Kira Evans, Engineering ([@kne42](https://github.com/kne42))
- Justin Kiggins, Product ([@neuromusic](https://github.com/neuromusic))
- Justine Larsen, Engineering ([@justinelarsen](https://github.com/justinelarsen))
- Ziyang Liu, Engineering ([@ziyangczi](https://github.com/ziyangczi))
- Lucy Obus, User Experience ([@LCObus](https://github.com/LCObus))
- Lia Prins, Design ([@liaprins-czi](https://github.com/liaprins-czi))
- Nicholas Sofroniew, Product ([@sofroniewn](https://github.com/sofroniewn))
