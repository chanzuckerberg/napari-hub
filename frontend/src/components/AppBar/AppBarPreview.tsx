import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ReactNode, useState } from 'react';

import { I18n } from '@/components/I18n';
import { ChevronDown, ChevronUp, ViewPullRequest } from '@/components/icons';
import { Link } from '@/components/Link';
import { Media } from '@/components/media';
import { MetadataStatus } from '@/components/MetadataStatus';
import { usePluginMetadata } from '@/context/plugin';

import styles from './AppBarPreview.module.scss';
import { PreviewMetadataPanel } from './PreviewMetadataPanel';
import { MetadataSection, useMetadataSections } from './useMetadataSections';

function MetadataStatusBar() {
  const sections = useMetadataSections();

  const missingStatusNodes: ReactNode[] = [];
  const completeStatusNodes: ReactNode[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      const nodeList = field.hasValue
        ? completeStatusNodes
        : missingStatusNodes;

      nodeList.push(
        <MetadataStatus
          key={field.name}
          hasValue={field.hasValue}
          variant="small"
        />,
      );
    }
  }

  return (
    <div className="flex space-x-px">
      {completeStatusNodes}
      {missingStatusNodes}
    </div>
  );
}

function AppBarPreviewLeftColumn() {
  const prLink = process.env.PREVIEW_PULL_REQUEST;
  const [t] = useTranslation(['preview']);

  return (
    <Link
      className="flex items-center whitespace-nowrap underline space-x-[0.625rem]"
      href={prLink}
      newTab
    >
      <ViewPullRequest />
      <Media greaterThanOrEqual="screen-495">
        {t('preview:appBar.viewPR')}
      </Media>
      <Media lessThan="screen-495">{t('preview:appBar.editInGitHub')}</Media>
    </Link>
  );
}

function AppBarPreviewCenterColumn() {
  const [t] = useTranslation(['preview']);
  const sections = useMetadataSections();
  let missingFieldsCount = 0;

  for (const section of sections) {
    for (const field of section.fields) {
      if (!field.hasValue) {
        missingFieldsCount += 1;
      }
    }
  }

  return (
    <>
      <span
        className={clsx(
          styles.fieldInfo,
          'font-bold bg-napari-primary whitespace-nowrap',
          missingFieldsCount > 0 && 'bg-napari-preview-orange text-white',
        )}
      >
        {t('preview:appBar.missingFields', {
          count: missingFieldsCount,
        })}
      </span>

      <Media className="text-sm font-semibold" greaterThanOrEqual="screen-875">
        <I18n i18nKey="preview:appBar.learnHow" />
      </Media>
    </>
  );
}

interface AppBarPreviewRightColumnProps {
  expanded: boolean;
  setExpanded(value: boolean | ((prev: boolean) => boolean)): void;
}

function hasMissingFields(sections: MetadataSection[]): boolean {
  return sections.some((section) =>
    section.fields.some((field) => !field.hasValue),
  );
}

function AppBarPreviewRightColumn({
  expanded,
  setExpanded,
}: AppBarPreviewRightColumnProps) {
  const sections = useMetadataSections();

  const renderExpandButton = () => (
    <IconButton
      className="rounded-none"
      onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
    >
      {expanded ? (
        <ChevronUp className="h-6 w-6" />
      ) : (
        <ChevronDown className="h-6 w-6" />
      )}
    </IconButton>
  );

  return (
    <>
      <Media
        className={clsx(
          'opacity-0 transition-opacity',
          !expanded && 'opacity-100',
        )}
        greaterThanOrEqual="screen-1150"
      >
        <MetadataStatusBar />
      </Media>

      {/* Always render expand button on larger screens. */}
      <Media greaterThanOrEqual="screen-495">{renderExpandButton()}</Media>

      {/* Only render expand button if there are missing fields. */}
      <Media lessThan="screen-495">
        {hasMissingFields(sections) && renderExpandButton()}
      </Media>
    </>
  );
}

const GITHUB_URL_REGEX = /\w+:\/\/(.+@)*[\w\d.]+(:[\d]+){0,1}\/*([^?&]*)/;
const PR_LINK = process.env.PREVIEW_PULL_REQUEST;

function getFullRepoName(repoUrl: string) {
  const repoPath = GITHUB_URL_REGEX.exec(repoUrl)?.[3];
  const [orgName = '', repoName = '', , prNumber = ''] =
    repoPath?.split('/') ?? [];

  let fullName = `${orgName}/${repoName}`;

  if (prNumber) {
    fullName = `${fullName}#${prNumber}`;
  }

  return fullName;
}

const PREVIEW_LINK_TEXT = getFullRepoName(PR_LINK);

export function AppBarPreview() {
  const [t] = useTranslation(['common', 'preview', 'pluginData']);
  const metadata = usePluginMetadata();
  const sections = useMetadataSections();
  const [expanded, setExpanded] = useState(hasMissingFields(sections));

  const renderRightColumn = () => (
    <AppBarPreviewRightColumn expanded={expanded} setExpanded={setExpanded} />
  );

  const actionRepo = metadata.actionRepository.value;
  const hasRepoMismatch =
    actionRepo && actionRepo !== metadata.sourceCode.value;
  const codeRepoLink = metadata.sourceCode.value;
  const codeRepoName = hasRepoMismatch ? getFullRepoName(codeRepoLink) : '';

  return (
    <>
      <header
        className={clsx(
          'bg-napari-preview-gray h-20',

          // Horizontal padding
          'px-9 screen-495:px-12',

          // Vertical padding
          'grid grid-cols-2',

          // Grid layouts
          'screen-875:grid-cols-napari-3 screen-875:justify-center screen-875:gap-x-12',
          'screen-1150:grid-cols-napari-4',
          'screen-1425:grid-cols-napari-5',
        )}
      >
        <div
          className={clsx(
            'flex items-center justify-between col-span-2',
            'screen-875:col-span-3',
            'screen-1425:col-span-1',
          )}
        >
          <div className="flex space-x-6">
            <AppBarPreviewLeftColumn />

            <Media
              className="flex items-center space-x-6"
              lessThan="screen-1425"
            >
              <AppBarPreviewCenterColumn />
            </Media>
          </div>

          <Media lessThan="screen-1150">{renderRightColumn()}</Media>
        </div>

        <Media
          className="flex items-center space-x-6 col-span-3"
          greaterThanOrEqual="screen-1425"
        >
          <AppBarPreviewCenterColumn />
        </Media>

        <Media
          className="flex items-center justify-between"
          greaterThanOrEqual="screen-1150"
        >
          {renderRightColumn()}
        </Media>
      </header>

      <Collapse in={expanded} unmountOnExit>
        <Media lessThan="screen-495">
          <PreviewMetadataPanel missingFieldsOnly />
        </Media>

        <Media greaterThanOrEqual="screen-495">
          <PreviewMetadataPanel />
        </Media>
      </Collapse>

      <div
        className={clsx(
          'flex justify-center py-1',

          // Sticky header on scroll.
          'sticky top-0',

          // Match the background of metadata panel.
          'bg-napari-hover-gray',

          // Bottom border
          'border-napari-preview-orange border-b-2',

          // Increase z-index so that it overlays over plugin page content.
          'z-20',
        )}
      >
        <p className="text-napari-preview-orange text-center px-6 screen-495:px-12">
          <div>
            <I18n
              i18nKey="preview:appBar.previewMessage"
              tOptions={{
                context: hasRepoMismatch ? 'mismatch' : '',
              }}
              values={{
                codeRepoLink,
                codeRepoName,
                pullRequestLink: PR_LINK,
                previewRepoName: PREVIEW_LINK_TEXT,
                pluginName:
                  metadata.name.value ||
                  t('pluginData:labels.pluginName.preview'),
              }}
            />
          </div>

          <div>{t('preview:appBar.notLive')}</div>
        </p>
      </div>
    </>
  );
}
