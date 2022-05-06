import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import TabContext from '@material-ui/lab/TabContext';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { I18n } from '@/components/I18n';
import { usePluginState } from '@/context/plugin';
import { CitationData } from '@/types';

import { ANCHOR } from './CitationInfo.constants';

interface Props {
  className?: string;
}

type CitationKeys = keyof CitationData;
const CITATION_TYPES: CitationKeys[] = ['APA', 'BibTex', 'RIS'];

const CITATION_EXTS: Record<CitationKeys, string> = {
  citation: 'cff',
  APA: 'txt',
  BibTex: 'bib',
  RIS: 'ris',
};

const COPY_FEEDBACK_DEBOUNCE_DURATION_MS = 2_000;

const BUTTON_STYLES =
  'border-2 border-napari-primary py-3 px-6 font-semibold h-12 col-span-1';

export function CitationInfo({ className }: Props) {
  const [t] = useTranslation(['common', 'pluginPage']);
  const { plugin } = usePluginState();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(CITATION_TYPES[0]);
  useEffect(() => {
    setCopied(false); // set copy to false when tab changed
  }, [tab]);

  const setCopiedDebounced = useDebouncedCallback(
    (value: boolean) => setCopied(value),
    COPY_FEEDBACK_DEBOUNCE_DURATION_MS,
  );

  const citation = plugin?.citations ? plugin.citations[tab] : '';

  const handleChange = (_: unknown, changedTab: CitationKeys) => {
    setTab(changedTab);
  };

  return (
    <div className={className}>
      <div className="prose max-w-none mb-6">
        <h2 id={ANCHOR}>{t('pluginPage:citations.title')}</h2>
        <p>
          <I18n i18nKey="pluginPage:citations.body" />
        </p>
      </div>
      <div>
        <TabContext value={tab}>
          <TabList
            onChange={handleChange}
            className="min-h-0"
            indicatorColor="primary"
          >
            {CITATION_TYPES.map((item) => {
              return (
                <Tab
                  label={item}
                  value={item}
                  key={item}
                  className="min-w-0 min-h-0 p-0 mr-6 text-black font-semibold opacity-100"
                />
              );
            })}
          </TabList>
          {CITATION_TYPES.map((item) => {
            return (
              <TabPanel
                value={item}
                key={item}
                className="py-4 px-6 mt-6 bg-napari-hover-gray"
              >
                <div className="whitespace-pre-wrap overflow-y-auto max-h-32">
                  {plugin?.citations?.[item]}
                </div>
              </TabPanel>
            );
          })}
        </TabContext>

        <div className="grid screen-600:grid-cols-napari-3 gap-6 screen-600:gap-12 mt-6">
          <Button
            className={BUTTON_STYLES}
            variant="outlined"
            onClick={async () => {
              if (citation) {
                await navigator.clipboard?.writeText?.(citation);
              }

              // Set `copied` to true immediately when the user clicks
              if (!copied) {
                setCopied(true);
              }

              // Set `copied` to false after 3 seconds. This function is debounced,
              // so if the user clicks on the button again, it'll reset the timeout.
              setCopiedDebounced(false);
            }}
          >
            {copied ? (
              <>{t('pluginPage:citations.copied')}</>
            ) : (
              <>{t('pluginPage:citations.copy')}</>
            )}
          </Button>

          {plugin?.name && citation && (
            <Button
              className={clsx(BUTTON_STYLES)}
              variant="outlined"
              download={`${plugin.name}.${CITATION_EXTS[tab]}`}
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                citation,
              )}`}
            >
              {t('common:download')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
