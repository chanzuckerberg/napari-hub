# Writing the Perfect Description for your Plugin

You've done the hard parts.
You've built your new plugin.
You've packaged it.
You've got your unit tests passing.
You're ready to share it with the world.

It's time to write a description.

The description is the main way for you to connect with your users through the napari hub.
You can provide a description of your plugin by creating a markdown file in your repo at `.napari-hub/DESCRIPTION.md`.
If you've used napari's [cookiecutter template](https://github.com/napari/cookiecutter-napari-plugin), you'll
find a template description already there for you.
This description is the primary way for potential users learn about your plugin, understand what it does, and determine whether it might solve their problem.

It's a blank canvas, for you to customize as you see fit.

In this guide, we'll discuss a bit about what to include and what not to include to make a top notch description that helps you find your next users.

## What to include

What should you include? A good start is the following.

### A summary

The best plugin descriptions start with a clear summary of the plugin that lets users know what the plugin does.

Things to consider:

- WHO: Who is this plugin for? Is it for cell biologists or neuroscientists? For Python novices or folks with advanced computational experience?
- WHAT: What kind of data does this plugin work on? 2D or 3D? Time series? Multichannel? If your plugin provides a reader or writer, what file types does it support?
- WHY: What problems can this plugin solve? What makes your plugin different from other plugins that do similar things, if they exist? Is it faster? More robust?

For example, see the [affinder summary](https://github.com/jni/affinder/blob/master/.napari-hub/DESCRIPTION.md#description)

### An example or "quick start"

A quick start guide can help users get a sense of how your plugin works without even having to install it.
Include images, GIFs, or videos so they can see exactly what your plugin does.

[Include some sample data with your plugin](https://napari.org/plugins/stable/hook_specifications.html#napari.plugins.hook_specifications.napari_provide_sample_data) and they can follow along when they first try your plugin!

### Headings for each section

We generate a navigation menu on your napari hub plugin listing from the headings in your description.
If you include informative headings, it will make it easier for users to jump to the relevant sections of your description.

### Relevant keywords

When users search for a plugin, the hub searches plugin descriptions to find relevant plugins.
So if a user searches for "segmentation" and your plugin does segmentation but doesn't mention "segmentation" in its description, it will be hard for users to find your plugin.


## What not to include

There's a good chance that you've included some of this information as part of your Github README.
However, we don't recommend simply duplicating your README. While your Github README focuses on information that is relevant to other Python developers, your description is meant for all users of your plugin, no matter their familiarity with Github or Python.

### We don't need no badges

We don't recommend including any shields or badges in your description.
These are great for Github, but we've found that hub users tend to find them distracting and confusing.
If there's a shield that you're excited about, [reach out and add your idea to our discussion page](https://github.com/chanzuckerberg/napari-hub/discussions/categories/ideas) and we can explore other ways to add the relevant information to your plugin's metadata.

### Don't worry about installation

Next to your plugin's description is a big "Install" button that will give users instructions on installing your plugin.
Unless your plugin has advanced installation requirements or pre-requisites, there's no need to include an "Installation" section.

## Examples

For examples of strong descriptions, check out the following plugins:

- [affinder](https://github.com/jni/affinder/blob/master/.napari-hub/DESCRIPTION.md)
- [ome-zarr](https://github.com/ome/napari-ome-zarr/blob/main/.napari-hub/DESCRIPTION.md)
