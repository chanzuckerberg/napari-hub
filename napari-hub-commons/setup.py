from setuptools import setup, find_packages

description = "shared utilities and models"

setup(
    name="napari-hub-commons",
    version="0.1.0",
    author=", ".join(["Napari Hub Team"]),
    description=description,
    long_description=description,
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    python_requires=">=3.8",
)
