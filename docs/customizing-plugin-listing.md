# Customizing your plugin's listing

napari plugin developers can customize their plugin's listing on the napari hub by updating the metadata associated with their Python package or adding napari-specific configuration files to their GitHub repository.


## Data sources

We have two sources of plugin information for the napari hub: PyPI and GitHub.

### PyPI

napari and the napari hub support discovery of plugins on PyPI that are tagged with the `"Framework :: Napari"` trove classifier (we do not currently support discovery of plugins on Anaconda cloud).
Most of the information about a napari plugin is specified in the [Python package metadata](https://packaging.python.org/specifications/core-metadata/) & PyPI is our primary source of plugin metadata.
The [PyPI API](https://warehouse.pypa.io/api-reference/json.html) provides information about Python packages through a simple JSON structure.
We use PyPI to source information such as the Python versions that a plugin supports, its dependencies, etc.

Plugin developers can modify these fields when they package their plugin by setting values in the [Python package metadata](https://packaging.python.org/specifications/core-metadata/).

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
This is only supported, however, if the plugin developer has added a link to their GitHub repository in their PyPI metadata (see [Source Code](#code-repository)).

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
- [Visibility](#visibility)

Fields that come from the GitHub API
- [License](#license)

## Fields

For each of the fields in a plugin's listing, we outline below how the field is used and where we source the data.

| Metadata             | Full view   |  List view  | Filterable  | Sortable      | Searched  | Source (Backup)  |
|----------------------|:-----------:|:-----------:|:-----------:|:-------------:|:---------:|:---------:|
| Name                 |     ✅      |     ✅      |     ⛔      |      ✅       |    ✅    |    <img src="PyPI-logo.svg" height="20"> |
| Summary              |     ✅      |     ✅      |     ⛔      |      ⛔       |    ✅    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Description          |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ✅    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Authors              |     ✅      |     ✅      |     ⛔      |      ⛔       |    ✅    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| License              |     ✅      |     ✅      |     ✅      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Version              |     ✅      |     ✅      |     ⛔      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Development Status   |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Python Version       |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Operating System     |     ✅      |     ⛔      |     ✅      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Requirements         |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Project Site         |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Documentation        |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Support              |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Report Issues        |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Twitter              |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="https://github.com/favicon.ico" height="20"> (<img src="PyPI-logo.svg" height="20">) |
| Source Code          |     ✅      |     ⛔      |     ⛔      |      ⛔       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Release Date         |     ✅      |     ✅      |     ⛔      |      ✅       |    ⛔    |    <img src="PyPI-logo.svg" height="20"> |
| Visibility       |           |            |            |              |         |    <img src="https://github.com/favicon.ico" height="20"> |

### Name

This is the name of the Python package that implements the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the `["info"]["name"]` field of the JSON returned by the PyPI API.

You can set this by setting the `name` value in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
name=starfish
# ...
```

### Summary

This is a short summary of the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the `summary` value defined in your napari configuration file.

``` YAML
# .napari/config.yml
# ...
summary:  Build scalable pipelines that localize and quantify RNA transcripts in image data generated by any FISH method
# ...
```

If you have not defined this in `.napari/config.yml`, we will source this from the `["info"]["summary"]` field of the JSON returned by the PyPI API, which is set in the `summary` value in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
summary = Pipelines and pipeline components for the analysis of image-based transcriptomics data
# ...
```

### Description

This is a detailed description of the plugin.

We display this on the detailed plugin page only.

We index this field for searching.

You can also set this field by adding a Markdown file to your GitHub repository at `.napari/DESCRIPTION.md`.

If we do not find a napari-specific description at `.napari/DESCRIPTION.md`, we will source this from the `["info"]["description"]` field of the JSON returned by the PyPI API, which can be set by setting the `long_description` and `long_description_content_type` values in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
long_description = file: README.md
long_description_content_type = text/markdown
# ...
```

You can denote sections your plugin description by adding Level 2 Headings (e.g. `## Summary`).
We will automatically generate sidebar navigation for your plugin from the Level 2 Headings present in your plugin description.
If your `description` begins with a Level 1 Heading, we will assume that this is a title (e.g. for your README) and drop it from the description.


### Authors

This is a list of authors of the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

You can set this field by adding authors, along with an optional [ORCID ID](https://orcid.org/) for each author, to your napari configuration file at `.napari/config.yml`.

``` YAML
# .napari/config.yml
# ...
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
# ...
```

If you have not set this in `.napari/config.yml`, we will source this from the `["info"]["author"]` field of the JSON returned by the PyPI API, which can set by setting the `author` value in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
author=Deep Ganguli
# ...
```


### License

This is the [SPDX Identifier](https://spdx.org/licenses/) for the license that the plugin is distributed under.

We display this on the detailed plugin page and the plugin listings.

We support filtering plugins based on whether the plugin is released under an [OSI-approved](https://opensource.org/licenses) open source license.

We source this from the [GitHub Licenses API](https://docs.github.com/en/rest/reference/licenses). If we cannot find one, we will source from `["info"]["license"]` field of the JSON returned by the PyPI API, which can be set this by setting the `license` value in your package metadata.

> **_NOTE:_**  You must use either a valid SPDX Identifier or "Other".
> If you specify a license here which is not an SPDX Identifier, we will display "Other".
> You can find the full list of SPDX Identifiers at https://spdx.org/licenses/


``` INI
# setup.cfg
[metadata]
# ...
license = MIT
# ...
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

We support the 7 levels of ["Development Status"](https://pypi.org/classifiers/) supported by PyPI:

- `1 - Planning`
- `2 - Pre-Alpha`
- `3 - Alpha`
- `4 - Beta`
- `5 - Production/Stable`
- `6 - Mature`
- `7 - Inactive`

We display this on the detailed plugin page and the plugin listings.

We source this from the list of classifiers in the `["info"]["classifiers"]` field of the JSON returned by the PyPI API.
If multiple "Development Status" classifiers are listed, we will use the one with the highest value.

You can set this by setting a ["Development Status" classifier](https://pypi.org/classifiers/) for your Python package in your package metadata.


``` INI
# setup.cfg
[metadata]
# ...
classifier =
  Development Status :: 5 - Production/Stable
# ...
```

### Python Versions

These are the Python versions your plugin supports.

We display this on the detailed plugin page and the plugin listings.

We support filtering plugins according to the minor versions of Python they support, based on this field.
For example, if a plugin developer notes that a plugin supports, Python ">=3.8", then the plugin will be tagged with Python versions `3.8` and `3.9`.

We source this from `["info"]["requires_python"]` field of the JSON returned by the PyPI API.

You can set this by [setting the `python_requires` value](https://packaging.python.org/guides/distributing-packages-using-setuptools/#id54) for your Python package in your package metadata.


``` INI
# setup.cfg
[metadata]
# ...
python_requires = '>=3.8'
# ...
```

### Operating System

These are the operating systems your plugin supports.

We display this on the detailed plugin page and the plugin listings. We support filtering plugins based on this value.

We source this from the list of classifiers in the `["info"]["classifiers"]` field of the JSON returned by the PyPI API.

You can set this by setting the relevant ["Operating System" classifiers](https://pypi.org/classifiers/) for your Python package in your package metadata.


``` INI
# setup.cfg
[metadata]
# ...
classifier =
  Operating System :: MacOS :: MacOS X
  Operating System :: Microsoft :: Windows
  Operating System :: POSIX :: Linux
# ...
```

``` INI
# setup.cfg
[metadata]
# ...
classifier =
  Operating System :: OS Independent
# ...
```


### Requirements

This is a list of Python packages that are required by your plugin.

We display this on the detailed plugin page.

We source this from the list of requirements in the `["info"]["requires_dist"]` field of the JSON returned by the PyPI API.
We do not display requirements for `napari-plugin-engine` or `napari`.

You can set this by setting the `install_requires` value for your Python package in your package metadata.

``` INI
# setup.cfg
[options]
# ...
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
# ...
```

### Project Site

This is a link to the main project site for your plugin.

We display this on the detailed plugin page.

You can set this field by setting a value for `Project Site` in the `project_urls` section of your napari configuration file.

``` YAML
# .napari/config.yml
# ...
project_urls:
    Project Site: https://spacetx-starfish.readthedocs.io/en/latest/
    Report Issues: https://github.com/spacetx/starfish/issues
    Documentation: https://spacetx-starfish.readthedocs.io/en/latest/
    User Support: https://forum.image.sc/tag/starfish
    Twitter: https://twitter.com/cziscience
# ...
```

If we cannot find a value for this in `.napari/config.yml`, we source this from `["info"]["home_page"]` field of the JSON returned by the PyPI API, which can be set by setting the `url` value for your Python package in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
# ...
```

> **_NOTE:_**  If we detect that a Github repository is the target of the `url` value, we will assign this URL to the "[Source Code](#source-code)" field instead of the Project Site field.

### Documentation

This is a link to further documentation for your plugin.

We display this on the detailed plugin page.

You can set this field by setting a value for `Documentation` in the `project_urls` section of your napari configuration file.

``` YAML
# .napari/config.yml
# ...
project_urls:
    Project Site: https://spacetx-starfish.readthedocs.io/en/latest/
    Report Issues: https://github.com/spacetx/starfish/issues
    Documentation: https://spacetx-starfish.readthedocs.io/en/latest/
    User Support: https://forum.image.sc/tag/starfish
    Twitter: https://twitter.com/cziscience
# ...
```

If we do not find this field in `.napari/config.yml`, we source this from `["info"]["project_urls"]["Documentation"]` field of the JSON returned by the PyPI API, which can be set by adding a `Documentation` link to the `project_urls` value for your Python package in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
# ...
```

### User Support

This is a link to user support for your plugin.

We display this on the detailed plugin page.

You can set this field by setting a value for `User Support` in the `project_urls` section of your napari configuration file.

``` YAML
# .napari/config.yml
# ...
project_urls:
    Project Site: https://spacetx-starfish.readthedocs.io/en/latest/
    Report Issues: https://github.com/spacetx/starfish/issues
    Documentation: https://spacetx-starfish.readthedocs.io/en/latest/
    User Support: https://forum.image.sc/tag/starfish
    Twitter: https://twitter.com/cziscience
# ...
```

If we do not find this field in `.napari/config.yml`, we source this from `["info"]["project_urls"]["User Support"]` field of the JSON returned by the PyPI API, which can be set by adding a `User Support` link to the `project_urls` value for your Python package in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
# ...
```


### Report Issues

This is a link to where users can report issues with your plugin.

We display this on the detailed plugin page.

You can set this field by setting a value for `Report Issues` in the `project_urls` section of your napari configuration file.

``` YAML
# .napari/config.yml
# ...
project_urls:
    Project Site: https://spacetx-starfish.readthedocs.io/en/latest/
    Report Issues: https://github.com/spacetx/starfish/issues
    Documentation: https://spacetx-starfish.readthedocs.io/en/latest/
    User Support: https://forum.image.sc/tag/starfish
    Twitter: https://twitter.com/cziscience
# ...
```

If we do not find this field in `.napari/config.yml`, we source this from `["info"]["project_urls"]["Bug Tracker"]` field of the JSON returned by the PyPI API, which can be set by adding a `Bug Tracker` link to the `project_urls` value for your Python package in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
# ...
```

### Twitter

This is a link to the Twitter feed for your plugin.

We display this on the detailed plugin page.

You can set this field by setting a value for `Twitter` in the `project_urls` section of your napari configuration file.

``` YAML
# .napari/config.yml
# ...
project_urls:
    Project Site: https://spacetx-starfish.readthedocs.io/en/latest/
    Report Issues: https://github.com/spacetx/starfish/issues
    Documentation: https://spacetx-starfish.readthedocs.io/en/latest/
    User Support: https://forum.image.sc/tag/starfish
    Twitter: https://twitter.com/cziscience
# ...
```

If we do not find this field in `.napari/config.yml`, we source this from `["info"]["project_urls"]["Twitter"]` field of the JSON returned by the PyPI API, which you can set by adding a `Twitter` link to the `project_urls` value for your Python package in your package metadata.

``` INI
# setup.cfg
[metadata]
# ...
project_urls =
  Twitter = https://twitter.com/napari_imaging
# ...
```

### Source Code

This is a link to the source code repository for your plugin.

We display this on the detailed plugin page.

We source this from `["info"]["project_urls"]["Source Code"]` field of the JSON returned by the PyPI API.

You can set this by adding a `Source Code` link to the `project_urls` value for your Python package in your package metadata. We will also source this from the `url` field if the target is a GitHub repository.

``` INI
# setup.cfg
[metadata]
# ...
url = https://spacetx-starfish.readthedocs.io/en/latest/
project_urls =
    Bug Tracker = https://github.com/spacetx/starfish/issues
    Documentation = https://spacetx-starfish.readthedocs.io/en/latest/
    Source Code = https://github.com/spacetx/starfish
    User Support = https://forum.image.sc/tag/starfish
# ...
```

### Visibility

This field lets you control the visibility of your plugin on the napari hub. We support three levels of visibility:

- `public` (default): plugin is available through search and plugin listings
- `hidden`: plugin details page is available, but the plugin does not show up in search
- `disabled`: plugin does not show up on the napari hub

``` YAML
# .napari/config.yml
# ...
visibility: public

# ...
```
