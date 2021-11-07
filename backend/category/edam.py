import json
import csv
import requests
from typing import Dict, List


def get_edam_ontology(version: str) -> Dict[str, List[str]]:
    """
    Parameters
    ----------
    version : str
        version of edam ontology to get.

    Returns
    -------
    Dict[str, List[str]]
        mapping between edam label to its parents, For example:
        {
            "Manual segmentation": [
                "Image segmentation",
                "Dense image annotation"
            ],
            "Semi-automatic segmentation": [
                "Image segmentation"
            ],
            "Sparse image annotation": [
                "Image annotation"
            ]
        }
    """
    if version:
        url = f'https://edamontology.org/EDAM-bioimaging_{version}.csv'
    else:
        url = f'https://edamontology.org/EDAM-bioimaging.csv'
    response = requests.get(url)
    if response.status_code != requests.codes.ok:
        response.raise_for_status()

    ontology = {
        category['Class ID']: {
            "label": category['Preferred Label'],
            "parents": category['Parents'].split("|")
        }
        for category in csv.DictReader(response.content.decode('utf-8').splitlines())
    }

    return {
        values['label']: [ontology[parent]['label'] for parent in values['parents'] if parent in ontology]
        for class_id, values in ontology.items()
    }


def iterate_parent(ontology_label: str, ontology: Dict[str, List[str]],
                   family_tree: List[str], mappings: Dict[str, Dict[str, str]]):
    """
    Iterate ontology to find matched mapping.

    Parameters
    ----------
    ontology_label
        label to query mappings.

    ontology
        name to parents mappings.

    family_tree
        list of labels in the family tree.

    mappings
        ontology label to hub term/dimension mappings.

    Returns
    -------
    list of mapped dictionary of label, dimension, and hierarchy, for example iterating Manual segmentation returns
    [
        {
            "label": "Image Segmentation",
            "dimension": "Operation",
            "hierarchy": [
                "Image segmentation",
                "Manual segmentation"
            ]
        },
        {
            "label": "Image annotation",
            "dimension": "Operation",
            "hierarchy": [
                "Image annotation",
                "Dense image annotation",
                "Manual segmentation"
            ]
        }
    ]
    """
    family_tree.insert(0, ontology_label)
    if ontology_label in mappings:
        return [{
            "label": mappings[ontology_label]["label"],
            "dimension": mappings[ontology_label]["dimension"],
            "hierarchy": family_tree
        }]
    if ontology_label not in ontology:
        return []
    all_families = []
    for token in ontology[ontology_label]:
        all_families.extend(iterate_parent(token, ontology, family_tree.copy(), mappings))
    return all_families


if __name__ == "__main__":
    # Generate mapping json from edam ontology for a particular version
    edam_version = 'alpha06'

    # the dimension mapping file is curated specifically for a particular version
    # the edam-alpha06 version can be found in here:
    # https://airtable.com/appWpxrq1iPzzxyFE/tblwIaRmQjEkMD1pm/viw2CboXiF0JQqxdr
    with open(f"data/edam-{edam_version}-to-hub-dimension.json") as edam_to_hub_dimension_json, \
            open(f"data/edam-{edam_version}-mappings.json", "w") as edam_mappings_json:

        edam_to_hub = json.load(edam_to_hub_dimension_json)

        # load edam terms
        edam = get_edam_ontology(edam_version)

        # generate hub term mapping for all edam terms with hierarchy
        edam_mappings = {}
        for label in edam.keys():
            mapped = iterate_parent(label, edam, [], edam_to_hub)
            if mapped:
                edam_mappings[label] = mapped

        json.dump(edam_mappings, edam_mappings_json, indent=2)
