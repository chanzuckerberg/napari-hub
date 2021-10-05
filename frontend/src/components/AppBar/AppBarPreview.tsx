import { Collapse, IconButton } from '@material-ui/core';
import clsx from 'clsx';
import { useState } from 'react';

import { Link } from '@/components/common';
import {
  ChevronDown,
  ChevronUp,
  ViewPullRequest,
} from '@/components/common/icons';
import { Media } from '@/components/common/media';

import styles from './AppBarPreview.module.scss';
import { MetadataStatus } from './MetadataStatus';
import { PreviewMetadataPanel } from './PreviewMetadataPanel';

const HUB_WIKI_LINK =
  'https://github.com/chanzuckerberg/napari-hub/blob/main/docs/customizing-plugin-listing.md';

function MetadataStatusBar() {
  // TODO replace with form state
  const states = ['a', 'b', 'c'];

  return (
    <div className="flex space-x-px">
      {states.map((stateName, index) => (
        <MetadataStatus key={stateName} hasValue={index % 2 === 0} />
      ))}
    </div>
  );
}

function AppBarPreviewLeftColumn() {
  const prLink = process.env.PREVIEW_PULL_REQUEST;

  return (
    <Link
      className="flex items-center whitespace-nowrap underline"
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
  return (
    <>
      <span
        className={clsx(
          styles.fieldInfo,
          'font-bold bg-napari-primary whitespace-nowrap',
        )}
      >
        All fields complete!
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

function AppBarPreviewRightColumn({
  expanded,
  setExpanded,
}: AppBarPreviewRightColumnProps) {
  return (
    <>
      <Media greaterThanOrEqual="screen-1150">
        {!expanded && <MetadataStatusBar />}
      </Media>

      <IconButton
        className="rounded-none px-px"
        onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
      >
        {expanded ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <ChevronDown className="h-6 w-6" />
        )}
      </IconButton>
    </>
  );
}

export function AppBarPreview() {
  const [expanded, setExpanded] = useState(false);

  const renderRightColumn = () => (
    <AppBarPreviewRightColumn expanded={expanded} setExpanded={setExpanded} />
  );

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

      <Collapse in={expanded}>
        <PreviewMetadataPanel />
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
        )}
      >
        <p className="text-napari-preview-orange">This is a preview</p>
      </div>
    </>
  );
}
