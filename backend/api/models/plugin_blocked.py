import logging
import time
from typing import Dict

from pynamodb.attributes import UnicodeAttribute
from pynamodb.models import Model

from api.models.helper import set_ddb_metadata


logger = logging.getLogger(__name__)


@set_ddb_metadata("plugin-blocked")
class _PluginBlocked(Model):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)


def get_blocked_plugins() -> Dict[str, str]:
    plugins = {}
    start = time.perf_counter()
    try:
        plugins = {plugin.name: "blocked" for plugin in _PluginBlocked.scan()}
        return plugins
    except Exception:
        logger.exception(f"Error scanning plugin-blocked")
        return plugins
    finally:
        duration = (time.perf_counter() - start) * 1000
        count = len(plugins)
        logger.info(f"blocked plugins count={count} duration={duration}ms")
