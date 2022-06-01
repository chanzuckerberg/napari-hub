from npe2 import PluginManager


def discover_manifest(plugin_name):
    pm = PluginManager()
    pm.discover(include_npe1=False)
    is_npe2 = True
    try:
        manifest = pm.get_manifest(plugin_name)
    except KeyError:
        pm.discover(include_npe1=True)
        is_npe2 = False
        # forcing lazy discovery to run
        list(pm.iter_widgets())
        manifest = pm.get_manifest(plugin_name)
    print(manifest.yaml())
    return manifest, is_npe2
