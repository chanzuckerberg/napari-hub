import clsx from 'clsx';
import { Tab, Tabs as SDSTabs } from 'czifui';
import { useTranslation } from 'react-i18next';

import { Text } from './Text';

export interface TabData<T extends string> {
  label: string;
  value: T;
  new?: boolean;
}

interface Props<T extends string> {
  activeTab: T;
  tabs: TabData<T>[];
  onChange(tab: TabData<T>): void;
  underline?: boolean;
}

export function Tabs<T extends string>({
  activeTab,
  tabs,
  onChange,
  underline = false,
}: Props<T>) {
  const [t] = useTranslation(['common']);

  return (
    // Scroll container for tabs
    <div
      className={clsx(
        'overflow-x-auto mb-sds-xl',
        underline && 'border-b border-black',
      )}
    >
      <SDSTabs
        classes={{
          indicator: 'hidden',
          root: 'm-0 p-0',
        }}
        value={activeTab}
        onChange={(_: unknown, tabValue: string) => {
          const nextTab = tabs.find((tab) => tab.value === tabValue);

          if (nextTab) {
            onChange(nextTab);
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            label={
              <>
                <div className="px-sds-xs screen-495:px-sds-m">
                  <Text
                    className="space-x-sds-xs screen-495:space-x-sds-m"
                    element="p"
                    variant="h4"
                  >
                    <span>{tab.label}</span>

                    {tab.new && (
                      <Text
                        className="bg-hub-primary-400 p-1"
                        element="span"
                        variant="h6"
                      >
                        {t('common:new')}
                      </Text>
                    )}
                  </Text>
                </div>

                <div
                  className={clsx(
                    'w-full h-[3px] group-hover:bg-hub-primary-500',
                    'mt-sds-xs',
                    tab.value === activeTab ? 'bg-black' : 'bg-transparent',
                  )}
                />
              </>
            }
            value={tab.value}
            classes={{
              root: 'text-black font-semibold m-0 group h-[28px] screen-495:h-[33px]',
              selected: 'bg-bold',
            }}
          />
        ))}
      </SDSTabs>
    </div>
  );
}
