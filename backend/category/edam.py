import json
import csv
import requests
from typing import Dict, Tuple


def get_edam_ontology(version: str) -> Dict[str, Tuple[str, str]]:
    """

    Parameters
    ----------
    version : str
        version of edam ontology to get.

    Returns
    -------
    Dict[str, Tuple(str)]
        mapping between edam id to tuple of edam label and parent

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


def iterate_parent(ontology_label, ontology, family_tree, mappings):
    family_tree.append(ontology_label)
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
    # Generate data from edam ontology for a particular version
    edam_version = 'alpha06'
    with open(f"data/edam-{edam_version}-to-hub-dimension.json") as edam_to_hub_dimension_json, \
            open(f"data/edam-{edam_version}-parents.json", "w") as edam_parents_json, \
            open(f"data/edam-{edam_version}-mappings.json", "w") as edam_mappings_json:

        edam_to_hub = json.load(edam_to_hub_dimension_json)

        # load edam terms
        edam = get_edam_ontology(edam_version)
        json.dump(edam, edam_parents_json, indent=2)

        # generate hub term mapping for all edam terms with hierarchy
        edam_mappings = {}
        for label in edam.keys():
            mapped = iterate_parent(label, edam, [], edam_to_hub)
            if mapped:
                edam_mappings[label] = mapped

        json.dump(edam_mappings, edam_mappings_json, indent=2)
