from bs4 import BeautifulSoup
from markdown import markdown

FIELD_DEFAULT_VALUES = {
    "classifiers": [],
    "requires_dist": []
}


def get_attribute(obj: dict, path: list):
    """
    Get attribute iteratively from a json object.

    :param obj: object to iterate on
    :param path: list of string to get sub path within json
    :returns: the value if the path is accessible, empty string if not found
    """
    current_location = obj

    for token in path:
        if isinstance(current_location, dict) and token in current_location:
            current_location = current_location[token]
        elif isinstance(current_location, list) and token < len(current_location):
            current_location = current_location[token]
        else:
            pypi_field_name = path[-1]
            return FIELD_DEFAULT_VALUES.get(pypi_field_name, '')
    return current_location


def render_description(description: str) -> str:
    """
    Render description with beautiful soup to generate html format description text.

    :param description: raw description to render
    :return: rendered description html text
    """
    if description:
        html = markdown(description)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    return ''
