from bs4 import BeautifulSoup
from markdown import markdown


def render_description(description: str) -> str:
    """
    Render description with BeautifulSoup to generate html format description.

    :param description: raw description to render
    :return: rendered description html text
    """
    if description:
        return BeautifulSoup(markdown(description), "html.parser").get_text()

    return ""
