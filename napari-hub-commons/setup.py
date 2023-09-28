import os


from setuptools import setup, find_packages

description = "shared utilities and models"


def get_install_requires():
    lib_folder = os.path.dirname(os.path.realpath(__file__))
    requirement_path = lib_folder + "/requirements.txt"
    install_requires = []
    if os.path.isfile(requirement_path):
        with open(requirement_path) as f:
            install_requires = f.read().splitlines()
    return install_requires


setup(
    name="napari-hub-commons",
    version="0.1.0",
    author=", ".join(["Napari Hub Team"]),
    description=description,
    long_description=description,
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    install_requires=get_install_requires(),
    python_requires=">=3.8",
)
