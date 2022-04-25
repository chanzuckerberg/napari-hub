import useTheme from '@material-ui/core/styles/useTheme';
import Tooltip from '@material-ui/core/Tooltip';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo } from 'react';
import { usePrevious } from 'react-use';
import {
  parse as parseTransformStr,
  stringify as stringifyTransformStr,
} from 'transform-parser';
import { useSnapshot } from 'valtio';

import { I18n } from '@/components/I18n';
import { Link } from '@/components/Link';
import { MetadataStatus } from '@/components/MetadataStatus';
import { MetadataId, MetadataKeys, usePluginMetadata } from '@/context/plugin';
import { previewStore } from '@/store/preview';

interface Props {
  className?: string;
  metadataId?: MetadataId;
  showStatus?: boolean;
}

const TOOLTIP_CLASS_NAME = 'metadata-tooltip';

/**
 * Hook for getting labels for tooltips in the user's language.
 */
function useTooltipLabels() {
  const [t] = useTranslation(['preview']);

  const labels: Partial<Record<MetadataKeys, string>> = {
    // Plugin content
    name: t('preview:tooltips.name'),
    displayName: t('preview:tooltips.displayName'),
    description: t('preview:tooltips.description'),
    summary: t('preview:tooltips.summary'),

    // Plugin metadata
    license: t('preview:tooltips.license'),
    operatingSystems: t('preview:tooltips.operatingSystems'),
    pythonVersion: t('preview:tooltips.pythonVersion'),
    requirements: t('preview:tooltips.requirements'),
    version: t('preview:tooltips.version'),

    // Plugin support info
    authors: t('preview:tooltips.authors'),
    documentationSite: t('preview:tooltips.documentationSite'),
    reportIssues: t('preview:tooltips.reportIssues'),
    sourceCode: t('preview:tooltips.sourceCode'),
    supportSite: t('preview:tooltips.supportSite'),

    // Currently not used in the preview UI
    twitter: t('preview:tooltips.twitter'),
    projectSite: t('preview:tooltips.projectSite'),
  };

  return labels;
}

/**
 * Renders a tooltip and metadata status icon for with information for the
 * metadata specified by `metadataId`.
 */
export function EmptyMetadataTooltip({
  className,
  metadataId,
  showStatus = true,
}: Props) {
  const [t] = useTranslation(['pluginPage', 'preview']);
  const snap = useSnapshot(previewStore);
  const metadata = usePluginMetadata();
  const tooltipId = metadataId ? `${metadataId}-tooltip` : '';
  const prevActiveId = usePrevious(snap.activeMetadataField);
  const theme = useTheme();
  const isFullWidth = useMediaQuery(theme.breakpoints.down(495));

  // Effect to make tooltip full width on smaller screens.
  useEffect(() => {
    // Skip tooltip transform if the tooltip is not currently open.
    if (snap.activeMetadataField !== metadataId) {
      return;
    }

    setTimeout(() => {
      const tooltipContainer = document.getElementById(tooltipId);
      const tooltip = tooltipContainer?.getElementsByClassName(
        TOOLTIP_CLASS_NAME,
      )?.[0] as HTMLElement | null;

      if (!tooltipContainer || !tooltip || !isFullWidth) {
        return;
      }

      // Remove transform-x for tooltip.
      const transformData = parseTransformStr(tooltipContainer.style.transform);
      const translateY = (transformData.translate3d as number[])?.[1] ?? 0;
      transformData.translate3d = [0, translateY, 0];
      tooltipContainer.style.transform = stringifyTransformStr(transformData);

      // Set tooltip and container to full width with padding.
      tooltipContainer.style.width = '100vw';
      tooltip.style.maxWidth = '100vw';
      tooltipContainer.style.padding = `0 ${25 / 16}rem`;
    });
  }, [
    isFullWidth,
    metadataId,
    prevActiveId,
    snap.activeMetadataField,
    tooltipId,
  ]);

  const tooltipLabels = useTooltipLabels();

  // Get metadata key from metadata ID by removing `metadata-` prefix.
  const metadataKey = useMemo(
    () => metadataId?.replace(/^metadata-/, '') as MetadataKeys | undefined,
    [metadataId],
  );

  if (!metadataId || !metadataKey) {
    return null;
  }

  return (
    <Tooltip
      id={tooltipId}
      classes={{
        tooltip: clsx(
          TOOLTIP_CLASS_NAME,
          'bg-white',
          'text-black text-sm',
          'border-2 border-napari-gray',
        ),
      }}
      placement="bottom"
      interactive
      title={
        <>
          <h2 className="font-semibold">{metadata[metadataKey].label}</h2>

          <p>{tooltipLabels[metadataKey] ?? ''}</p>

          <p className="text-xs mt-5 mb-3">
            <I18n
              i18nKey="preview:appBar.learnHow"
              components={{
                hubLink: (
                  <Link
                    className="underline"
                    href={t('preview:hubWikiLink')}
                    newTab
                  />
                ),
              }}
            />
          </p>

          <p className="italic text-xs">
            {t('preview:emptyTooltip.incompleteField')}
          </p>
        </>
      }
      key={snap.activeMetadataField}
      open={snap.activeMetadataField === metadataId}
    >
      <div className={className}>
        {showStatus && (
          <MetadataStatus className={className} hasValue={false} />
        )}
      </div>
    </Tooltip>
  );
}
