# Customizing your plugin's listing

napari plugin developers can customize their plugin's listing on the napari hub by updating the metadata associated with their Python package or adding napari-specific configuration files to their GitHub repository.


## Data sources

We have two sources of plugin information for the napari hub: PyPI and GitHub.

### PyPI

Much of the information about a napari plugin is specified in the Python package metadata & PyPI is our primary source of plugin metadata.
The PyPI API provides information about Python packages through a simple JSON structure.
We use PyPI to source information such as the Python versions that a plugin supports, its dependencies, etc.

Plugin developers can modify these fields when they package their plugin by setting values in `setup.py`, `setup.cfg`, or `pypackage.toml`.

Fields that can be defined through the Python package configuration include the following:

- [Name](#name)
- [Summary](#summary)
- [Description](#description)
- [Authors](#authors)
- [License](#license)
- [Version](#version)
- [Python versions](#python-versions)
- [Operating System](#operating-system)
- [Requirements](#requirements)
- [Development Status](#development-status)
- [Project Site](#project-site)
- [Documentation](#documentation)
- [Support](#support)
- [Report issues](#report-issues)
- [Twitter](#twitter)
- [Code repository](#code-repository)

### GitHub

For some fields, we look to the plugin developer's GitHub repository instead of (or in addition to) PyPI.
This is only supported, however, if the plugin developer has added a link to their GitHub repository in their PyPI metadata.
(TODO: Specify which fields we will look for links to the GitHub repo)

Plugin developers can modify these fields by adding a `.napari` configuration folder to their repository, along with the relevant configuration files for a given field.
We currently support two configuration files:

- `.napari/DESCRIPTION.md` for a napari-specific description (see [Description](#description))
- `.napari/config.yml` for all other configurable fields

Fields that can be defined through the napari config include...

- [Summary](#summary)
- [Description](#description)
- [Authors](#authors)
- [Project Site](#project-site)
- [Documentation](#documentation)
- [Support](#support)
- [Report Issues](#report-issues)
- [Twitter](#twitter)

## Fields

For each of the fields in a plugin's listing, we outline below how the field is used and where we source the data.

| Metadata             | Full view   |  List view  | Filterable  | Sortable      | Searched  |
|----------------------|:-----------:|:-----------:|:-----------:|:-------------:|:---------:|
| Name                 |     ✅      |     ✅      |     ⛔      |      ✅       |    ✅    |
| Summary              |     ✅      |     ✅      |     ⛔      |      ⛔       |    ✅    |
| Description          |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ✅    |
| Authors              |     ✅      |     ✅      |     ✅      |      ⛔       |    ⛔    |
| License              |     ✅      |     ✅      |     ✅      |      ⛔       |    ⛔    |
| Version              |     ✅      |     ✅      |     ⛔      |      ⛔       |    ⛔    |
| Development Status   |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |
| Python Version       |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |
| Operating System     |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |
| Requirements         |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Project Site         |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Documentation        |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Support              |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Report Issues        |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Twitter              |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Code Repository      |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |
| Release Date         |     ✅      |     ✅      |     ⛔      |      ✅       |    ⛔    |
| First Released       |     ✅      |     ⛔      |     ⛔      |      ✅       |    ⛔    |

### Name

This is the name of the Python package that implements the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the `["info"]["name"]` field of the JSON returned by the PyPI API.

You can set this by setting the `name` of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
name=starfish
...
```

### Summary

This is a short summary of the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the `["info"]["summary"]` field of the JSON returned by the PyPI API.

You can set this by setting the `summary` of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
summary = Pipelines and pipeline components for the analysis of image-based transcriptomics data
...
```

### Description

This is a detailed description of the plugin.

We display this on the detailed plugin page only.

We index this field for searching.

We source this from the `["info"]["description"]` field of the JSON returned by the PyPI API.
If the `["info"]["description_content_type"]` field denotes Markdown, then this field will be rendered as HTML.

You can set this by setting the `description` or `description-file` of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
description-file = README.md
description-content-type = text/markdown
...
```

You can denote sections your plugin description by adding Level 1 Headings (e.g. `# Summary`).
We will automatically generate sidebar navigation for your plugin from the Level 1 Headings present in your plugin description.

If you wish to customize this field with a napari-specific description which is different from the Python package description shown in PyPI, you can also set this field by adding a Markdown file to your GitHub repository at `.napari/DESCRIPTION.md`.
This file will take precedence over the `description` in your Python package.

### Authors

This is a list of authors of the plugin.

We display this on the detailed plugin page and the plugin listings.

We source this from the `["info"]["author"]` field of the JSON returned by the PyPI API.

You can set this by setting the `author` of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
author=Deep Ganguli
...
```

If you wish to customize this field with a full list of authors, you can also set this field by adding authors, along with an optional [ORCID ID](https://orcid.org/) for each author, to your napari configuration file.

``` YAML
# .napari/config.yml
...
authors:
  - name: Shannon Axelrod
  - name: Matthew Cai
    orcid: 0000-0003-4998-6328
  - name: Ambrose J. Carr
    orcid: 0000-0002-8457-2836
  - name: Jeremy Freeman
    orcid: 0000-0001-7077-7972
  - name: Deep Ganguli
  - name: Justin T. Kiggins
    orcid: 0000-0002-4638-7015
  - name: Brian Long
    orcid: 0000-0002-7793-5969
  - name: Tony Tung
  - name: Kevin A. Yamauchi
    orcid: 0000-0002-7818-1388
...
```

Authors listed in your napari config file will take precedence over the `author` specified in your Python package.

### License

This is the [SPDX Identifier](https://spdx.org/licenses/) for the license that the plugin is distributed under.

We display this on the detailed plugin page and the plugin listings. We support filtering plugins based on this value.

We source this from the `["info"]["license"]` field of the JSON returned by the PyPI API.

You can set this by setting the `license` of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

> **_NOTE:_**  You must use either a valid SPDX Identifier or "Other".
> If you specify a license here which is not an SPDX Identifier, we will display "Other".
> You can find the full list of SPDX Identifiers at https://spdx.org/licenses/


``` TOML
# setup.cfg
[metadata]
...
license = MIT
...
```

### Version

This is the version of the latest release of your plugin.

We display this on the detailed plugin page and the plugin listings.

We source this from the key of the latest release listed under `["releases"]` in the PyPI API.

You can set this by setting the `version` of your Python package.
See the [Python Packaging User Guide](https://packaging.python.org/guides/distributing-packages-using-setuptools/#version) for more info.

> **_NOTE:_**  We strongly encourage plugin developers to use Semantic Versioning, along with Python conventions for pre-releases (see [PEP 440](https://www.python.org/dev/peps/pep-0440/)).

### Development Status

This is the development status of your plugin.

We display this on the detailed plugin page and the plugin listings. We support filtering plugins based on this value.

We source this from the list of classifiers in the `["info"]["classifiers"]` field of the JSON returned by the PyPI API.
If multiple "Development Status" classifiers are listed, we source one with the highest value.

You can set this by setting a ["Development Status" classifier](https://pypi.org/classifiers/) for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.


``` TOML
# setup.cfg
[metadata]
...
classifier =
  Development Status :: 5 - Production/Stable
...
```

### Python Versions

These are the Python versions your plugin supports.

We display this on the detailed plugin page and the plugin listings. We support filtering plugins based on this value.

We source this from `["info"]["requires_python"]` field of the JSON returned by the PyPI API.

You can set this by [setting the `python_requires` value](https://packaging.python.org/guides/distributing-packages-using-setuptools/#id54) for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.


``` TOML
# setup.cfg
[metadata]
...
python_requires = '>=3.8'
...
```

### Operating System

These are the operating systems your plugin supports.

We display this on the detailed plugin page and the plugin listings. We support filtering plugins based on this value.

We source this from the list of classifiers in the `["info"]["classifiers"]` field of the JSON returned by the PyPI API.

You can set this by setting the relevant ["Operating System" classifiers](https://pypi.org/classifiers/) for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.


``` TOML
# setup.cfg
[metadata]
...
classifier =
  Operating System :: MacOS :: MacOS X
  Operating System :: Microsoft :: Windows
  Operating System :: POSIX :: Linux
...
```

``` TOML
# setup.cfg
[metadata]
...
classifier =
  Operating System :: OS Independent
...
```


### Requirements

This is a list of Python packages that are required by your plugin.

We display this on the detailed plugin page.

We source this from the list of requirements in the `["info"]["requires_dist"]` field of the JSON returned by the PyPI API.
We do not display requirements for `napari-plugin-engine` or `napari`.

You can set this by setting the `install_requires` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[options]
...
install_requires =
  dataclasses==0.6
  h5py
  jsonschema
  matplotlib
  napari-plugin-engine
  numpy != 1.13.0
  pandas >= 0.23.4
  read_roi
  regional
  scikit-image >= 0.14.0
  scikit-learn
  scipy
  sympy ~= 1.5.0
  trackpy
  validators
  xarray >= 0.14.1
...
```

### Project Site

This is a link to the main project site for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_url"]` field of the JSON returned by the PyPI API.

You can set this by setting the `url` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
...
```

### Documentation

This is a link to further documentation for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["Documentation"]` field of the JSON returned by the PyPI API.

You can set this by adding a `Documentation` link to the `project_urls` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
...
```

### User Support

This is a link to user support for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["User Support"]` field of the JSON returned by the PyPI API.

You can set this by adding a `User Support` link to the `project_urls` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
...
```

### Report Issues

This is a link to where users can report issues with your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["Bug Tracker"]` field of the JSON returned by the PyPI API.

You can set this by adding a `Bug Tracker` link to the `project_urls` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
...
```

### Twitter

This is a link to the Twitter feed for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["Twitter"]` field of the JSON returned by the PyPI API.

You can set this by adding a `Twitter` link to the `project_urls` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
project_urls =
  Twitter = https://twitter.com/napari_imaging
...
```

### Code Repository

This is a link to the source code repository for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["Source Code"]` field of the JSON returned by the PyPI API.

You can set this by adding a `Source Code` link to the `project_urls` value for your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

``` TOML
# setup.cfg
[metadata]
...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
...
```
