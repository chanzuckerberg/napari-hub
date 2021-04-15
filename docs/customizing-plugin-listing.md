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

- [Plugin Name](#plugin-name)
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
- `.napari/config.yml` for all other fields that can be configured

Fields that can be defined through the napari config include...

- [Summary](#summary)
- [Description](#description)
- [Authors](#authors)
- [Project Site](#project-site)
- [Documentation](#documentation)
- [Support](#support)
- [Report issues](#report-issues)
- [Twitter](#twitter)

## Fields

For each of the fields in a plugin's listing, we outline below how the field is used and where we source the data.

### Name

This is the name of the Python package that implements the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the "name" field of the JSON returned by the PyPI API.

You can set this by setting the "name" of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

### Summary

This is a short summary of the plugin.

We display this on the detailed plugin page and the plugin listings.

We index this field for searching.

We source this from the "short_description" field of the JSON returned by the PyPI API.

You can set this by setting the "short_description" of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

### Description

This is a detailed description of the plugin.

We display this on the detailed plugin page only.

We index this field for searching.

We source this from the "long_description" field of the JSON returned by the PyPI API.
If the "X" field denotes Markdown, then this field will be rendered as HTML.

You can set this by setting the "long_description" of your Python package in `setup.py`, `setup.cfg`, or `pypackage.toml`.

You can denote sections your plugin description by adding Level 1 Headings (e.g. `# Summary`).
We will automatically generate sidebar navigation for your plugin from the Level 1 Headings present in your plugin description.

If you wish to customize this field with a napari-specific description which is different from the Python package description shown in PyPI, you can also set this field by adding a Markdown file to your GitHub repository at `.napari/DESCRIPTION.md`.
This file will take precedence over the `long_description` in your Python package.

### Authors

### License

### Version

### Development Status

### Python versions

### Operating System

### Requirements

### Project Site

### Documentation

### Support

### Report issues

### Twitter

### Code repository

### Release date

### First released
