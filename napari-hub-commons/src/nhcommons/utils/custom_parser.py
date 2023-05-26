from bs4 import BeautifulSoup
from markdown import markdown


def render_description(description: str) -> str:
    """
    Render description with BeautifulSoup to generate html format description.

    :param description: raw description to render
    :return: rendered description html text
    """
    if description:
        html = markdown(description)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    return ''
