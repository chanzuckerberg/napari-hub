import { Collapse, IconButton } from '@material-ui/core';
import clsx from 'clsx';
import { ReactNode, useState } from 'react';

import {
  ChevronDown,
  ChevronUp,
  ViewPullRequest,
} from '@/components/common/icons';
import { Link } from '@/components/common/Link';
import { Media } from '@/components/common/media';
import { MetadataStatus } from '@/components/MetadataStatus';
import { HUB_WIKI_LINK } from '@/constants/preview';
import { usePluginMetadata } from '@/context/plugin';

import styles from './AppBarPreview.module.scss';
import { MetadataSection, useMetadataSections } from './metadataPreview.hooks';
import { PreviewMetadataPanel } from './PreviewMetadataPanel';

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

  return (
    <Link
      className="flex items-center whitespace-nowrap underline space-x-[0.625rem]"
      href={prLink}
      newTab
    >
      <ViewPullRequest />
      <Media greaterThanOrEqual="screen-495">View pull request</Media>
      <Media lessThan="screen-495">Edit in Github</Media>
    </Link>
  );
}

function AppBarPreviewCenterColumn() {
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
        {missingFieldsCount > 0
          ? `${missingFieldsCount} fields need attention`
          : 'All fields complete!'}
      </span>

      <Media className="text-sm font-semibold" greaterThanOrEqual="screen-875">
        Learn how to update fields in the{' '}
        <Link className="underline" href={HUB_WIKI_LINK} newTab>
          napari hub GitHub Wiki.
        </Link>
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

// TODO Update this to the correct link.
const MISMATCH_REPOSITORY_DOCS_URL =
  'https://github.com/chanzuckerberg/napari-hub';

export function AppBarPreview() {
  const metadata = usePluginMetadata();
  const sections = useMetadataSections();
  const [expanded, setExpanded] = useState(hasMissingFields(sections));

  const renderRightColumn = () => (
    <AppBarPreviewRightColumn expanded={expanded} setExpanded={setExpanded} />
  );

  const actionRepo = metadata.actionRepository.value;
  const hasRepoMismatch =
    actionRepo && actionRepo !== metadata.sourceCode.value;
  const codeRepo = metadata.sourceCode.value;
  const codeRepoName = hasRepoMismatch ? getFullRepoName(codeRepo) : '';

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
            <span>This preview of </span>
            <span className="font-bold">
              {metadata.name.value || 'Plugin name'}
            </span>{' '}
            <span>was generated from </span>
            <Link className="underline" href={PR_LINK} newTab>
              {PREVIEW_LINK_TEXT}
            </Link>
            {hasRepoMismatch ? (
              <span>
                , but your metadata points to{' '}
                <Link className="underline" href={codeRepo}>
                  {codeRepoName}{' '}
                </Link>
                as the source code (
                <Link className="underline" href={MISMATCH_REPOSITORY_DOCS_URL}>
                  Learn more
                </Link>
                ).
              </span>
            ) : (
              '.'
            )}
          </div>

          <div>It is not live on napari hub</div>
        </p>
      </div>
    </>
  );
}
