import { PluginDetails } from '@/components';
// TODO Replace JSON fixture with actual API data
import napariPlugin from '@/fixtures/napari.json';

export default function PluginPage() {
  return <PluginDetails plugin={napariPlugin} />;
}
