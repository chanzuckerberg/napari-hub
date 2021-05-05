import { PluginDetails } from '@/components';
import { PluginStateProvider } from '@/context/plugin';
// TODO Replace JSON fixture with actual API data
import napariPlugin from '@/fixtures/napari.json';

export default function PluginPage() {
  return (
    <PluginStateProvider plugin={napariPlugin}>
      <PluginDetails />
    </PluginStateProvider>
  );
}
