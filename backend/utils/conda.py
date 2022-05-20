import requests
import re
from typing import List

CONDA_FORGE = 'https://api.anaconda.org/package/conda-forge'


def get_conda_forge_package(package: str) -> List:
    """Get package metadata from the napari hub.
    Parameters
    ----------
    package : str
        name of the package
    Returns
    -------
    List of potential conda forge packaging info.
    """

    normalized_name = normalize_name(package)
    response = requests.get(f'{CONDA_FORGE}/{normalized_name}')
    if response.status_code != requests.codes.ok:
        return []
    else:
        return [{
            "channel": "conda-forge",
            "package": normalized_name
        }]


def normalize_name(name: str) -> str:
    """
    Normalize a plugin name by replacing underscores and dots by dashes and
    lower casing it.
    """
    return re.sub(r"[-_.]+", "-", name).lower()
