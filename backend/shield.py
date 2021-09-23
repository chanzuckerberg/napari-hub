from model import get_valid_plugins


def get_shield(plugin: str) -> dict:
    """
    Generate shield json for napari plugin.
    If the package is not a valid plugin, display 'plugin not found' instead.

    :param plugin: name of the plugin
    :return: shield json used in shields.io.
    """
    shield_schema = {
        "color": "#0074B8",
        "label": "napari hub",
        "logoSvg": "<svg width=\"512\" height=\"512\" viewBox=\"0 0 512 512\" fill=\"none\" "
                   "xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"256.036\" cy=\"256\" "
                   "r=\"85.3333\" fill=\"white\" stroke=\"white\" stroke-width=\"56.8889\"/>"
                   "<circle cx=\"256.036\" cy=\"42.6667\" r=\"42.6667\" fill=\"white\"/>"
                   "<circle cx=\"256.036\" cy=\"469.333\" r=\"42.6667\" fill=\"white\"/>"
                   "<path d=\"M256.036 28.4445L256.036 142.222\" stroke=\"white\" "
                   "stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
                   "<path d=\"M256.036 369.778L256.036 483.556\" stroke=\"white\" stroke-width=\"56.8889\" "
                   "stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
                   "<circle cx=\"71.2838\" cy=\"149.333\" r=\"42.6667\" transform=\"rotate(-60 71.2838 149.333)\" "
                   "fill=\"white\"/><circle cx=\"440.788\" cy=\"362.667\" r=\"42.6667\" "
                   "transform=\"rotate(-60 440.788 362.667)\" fill=\"white\"/>"
                   "<path d=\"M58.967 142.222L157.501 199.111\" stroke=\"white\" stroke-width=\"56.8889\" "
                   "stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M354.57 312.889L453.105 369.778\" "
                   "stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
                   "<circle cx=\"71.2838\" cy=\"362.667\" r=\"42.6667\" transform=\"rotate(-120 71.2838 362.667)\" "
                   "fill=\"white\"/><circle cx=\"440.788\" cy=\"149.333\" r=\"42.6667\" "
                   "transform=\"rotate(-120 440.788 149.333)\" fill=\"white\"/>"
                   "<path d=\"M58.967 369.778L157.501 312.889\" stroke=\"white\" stroke-width=\"56.8889\" "
                   "stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M354.57 199.111L453.105 142.222\" "
                   "stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
                   "</svg>",
        "schemaVersion": 1,
        "style": "flat-square"
    }

    plugins = get_valid_plugins()
    if plugin not in plugins:
        shield_schema['message'] = 'plugin not found'
    else:
        shield_schema['message'] = plugin
    return shield_schema
