# Customizing your plugin's listing

napari plugin developers can customize their plugin's listing on the napari hub by updating the metadata associated with their Python package or adding napari-specific configuration files to their GitHub repository.


## Data sources

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

If you wish to customize this field with a napari-specific description which is different from the Python package description shown in PyPI, you can also set this field by adding a Markdown file to your Github repository at `.napari/DESCRIPTION.md`.
This file will take precedence over the `long_description` in your Python package.
