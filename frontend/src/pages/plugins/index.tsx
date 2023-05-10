import { NotFoundPage } from '@/components/NotFoundPage';
import { getServerSidePropsHandler } from '@/utils/ssr';

interface Props {
  status: number;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  async getProps({ req }, featureFlags) {
    let status = 200;

    if (!req.url || featureFlags.homePageRedesign.value !== 'on') {
      status = 404;
    }

    const props: Props = await Promise.resolve({ status });

    return { props };
  },
});

export default function PluginHomePage({ status }: Props) {
  if (status === 404) {
    return <NotFoundPage />;
  }

  return (
    <div className="w-full h-[calc(100vh-400px)] flex items-center justify-center">
      <p className="text-6xl font-bold">/plugins</p>
    </div>
  );
}
