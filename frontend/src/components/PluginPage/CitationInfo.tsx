import clsx from 'clsx';
import { Button } from 'czifui';
import { useTranslation } from 'next-i18next';
import { ComponentProps, useEffect, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { AnchorHeading } from '@/components/AnchorHeading';
import { I18n } from '@/components/I18n';
import { TabData, Tabs } from '@/components/Tabs';
import { usePluginState } from '@/context/plugin';
import { CitationType } from '@/types';

import { ANCHOR } from './CitationInfo.constants';

interface Props {
  className?: string;
}

const CITATION_TYPES: CitationType[] = ['APA', 'BibTex', 'RIS'];

const CITATION_EXTS: Record<CitationType, string> = {
  citation: 'cff',
  APA: 'txt',
  BibTex: 'bib',
  RIS: 'ris',
};

const COPY_FEEDBACK_DEBOUNCE_DURATION_MS = 2_000;

function CitationButton(props: ComponentProps<typeof Button>) {
  return (
    <Button
      className={clsx(
        'border-2 border-hub-primary-400 py-sds-l px-sds-xl font-semibold h-12 col-span-1 text-black',
      )}
      variant="outlined"
      {...props}
    />
  );
}

export function CitationInfo({ className }: Props) {
  const [t] = useTranslation(['common', 'pluginPage']);
  const { plugin } = usePluginState();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(CITATION_TYPES[0]);
  useEffect(() => {
    setCopied(false); // set copy to false when tab changed
  }, [activeTab]);

  const setCopiedDebounced = useDebouncedCallback(
    (value: boolean) => setCopied(value),
    COPY_FEEDBACK_DEBOUNCE_DURATION_MS,
  );

  const citation = plugin?.citations ? plugin.citations[activeTab] : '';

  const tabs = useMemo(
    () =>
      CITATION_TYPES.map((type) => ({
        label: type,
        value: type,
      })) as TabData<CitationType>[],
    [],
  );

  return (
    <div className={className}>
      <div className="prose max-w-none mb-6">
        <AnchorHeading element="h2" id={ANCHOR}>
          {t('pluginPage:citations.title')}
        </AnchorHeading>
        <p>
          <I18n i18nKey="pluginPage:citations.body" />
        </p>
      </div>
      <div>
        <Tabs
          activeTab={activeTab}
          tabs={tabs}
          onChange={(tab) => setActiveTab(tab.value)}
        />

        <div className="px-sds-l mt-sds-xl bg-hub-gray-100">
          <div className="whitespace-pre-wrap overflow-y-auto max-h-32">
            {plugin?.citations?.[activeTab]}
          </div>
        </div>

        <div className="grid screen-600:grid-cols-napari-3 gap-sds-xl  screen-600:gap-12 mt-sds-xl">
          <CitationButton
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
          </CitationButton>

          {plugin?.name && citation && (
            <CitationButton
              download={`${plugin.name}.${CITATION_EXTS[activeTab]}`}
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                citation,
              )}`}
            >
              {t('common:download')}
            </CitationButton>
          )}
        </div>
      </div>
    </div>
  );
}
