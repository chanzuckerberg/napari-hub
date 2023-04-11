import setuptools

description = "shared utilities"

setuptools.setup(
    name="shared",
    version="0.1.0",
    author=", ".join(["Napari Hub Team"]),
    description=description,
    long_description=description,
    packages=setuptools.find_packages(),
    python_requires=">=3.8",
)
