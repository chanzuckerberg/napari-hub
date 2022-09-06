import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { SSRConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ReactNode, useState } from 'react';
import { useQuery } from 'react-query';
import { Props as ActivityDashboardProps } from 'src/components/ActivityDashboard';

import { ChevronDown, ChevronUp } from '@/components/icons';
import { I18nNamespace } from '@/types/i18n';
import { DataPoint } from '@/types/stats';
import { hubAPI } from '@/utils/axios';
import { isFeatureFlagEnabled } from '@/utils/featureFlags';

const ActivityDashboard = dynamic<ActivityDashboardProps>(
  () =>
    import('@/components/ActivityDashboard').then(
      (mod) => mod.ActivityDashboard,
    ),
  { ssr: false },
);

type Props = Partial<SSRConfig>;

export async function getServerSideProps({
  req,
  locale,
}: GetServerSidePropsContext) {
  if (!req.url || !isFeatureFlagEnabled('activityDashboard', req.url)) {
    return {
      redirect: {
        permanent: false,
        source: req.url,
        destination: '/',
      },
    };
  }

  const translationProps = await serverSideTranslations(locale ?? 'en', [
    'common',
    'footer',
    'pageTitles',
    'activity',
  ] as I18nNamespace[]);
  const props: Props = { ...translationProps };

  return { props };
}

export default function Activity() {
  const [activePlugin, setActivePlugin] = useState('napari-mrcfile-handler');
  const [showRawData, setShowRawData] = useState(false);

  const { data: pluginList = [] } = useQuery(['plugin-list'], async () => {
    const { data } = await hubAPI.get<string[]>('/activity/plugins');
    return data;
  });

  const { data: dataPoints = [], isLoading: isLoadingData } = useQuery(
    ['plugin-activity', activePlugin],
    async () => {
      const { data } = await hubAPI.get<DataPoint[]>(
        `/activity/${activePlugin}`,
      );
      return data;
    },
  );

  const { data: pluginStats } = useQuery(
    ['plugin-stats', activePlugin],
    async () => {
      const { data } = await hubAPI.get<{
        totalMonths: number;
        totalInstalls: number;
      }>(`/activity/${activePlugin}/stats`);

      return data;
    },
  );

  function changePlugin(diff: number) {
    const pluginIndex = pluginList.findIndex(
      (plugin) => plugin === activePlugin,
    );

    const nextPlugin = pluginList.at(pluginIndex + diff);
    if (nextPlugin) {
      setActivePlugin(nextPlugin);
    }
  }

  return (
    <div className="tw-p-6 screen-495:p-12">
      <Head>
        <title>Activity Dashboard</title>
      </Head>

      <div className="flex items-center space-x-3 mb-10">
        <IconButton onClick={() => changePlugin(-1)}>
          <ChevronUp />
        </IconButton>
        <IconButton onClick={() => changePlugin(1)}>
          <ChevronDown />
        </IconButton>

        <Select
          value={activePlugin}
          onChange={(event) => setActivePlugin(event.target.value)}
        >
          {pluginList.map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>

        <FormControlLabel
          control={
            <Switch
              checked={showRawData}
              onChange={(event) => setShowRawData(event.target.checked)}
            />
          }
          label="Show raw data"
        />
      </div>

      {!isLoadingData && (
        <ActivityDashboard
          data={dataPoints}
          installCount={pluginStats?.totalInstalls ?? 0}
          installMonthCount={pluginStats?.totalMonths ?? 0}
          showRawData={showRawData}
        />
      )}
    </div>
  );
}

Activity.getLayout = (page: ReactNode) => page;
