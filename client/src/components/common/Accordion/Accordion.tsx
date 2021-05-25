import {
  Accordion as MUIAccordion,
  AccordionDetails,
  AccordionSummary,
} from '@material-ui/core';
import clsx from 'clsx';
import { ReactNode } from 'react';

import { Expand } from '@/components/common/icons';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * Wrapper component over Material UI accordion with napari hub specific customizations.
 */
export function Accordion({ children, className, title }: Props) {
  return (
    <MUIAccordion className={clsx('shadow-none', className)}>
      <AccordionSummary
        className="flex-row-reverse p-0 font-semibold"
        classes={{ content: '!ml-6', expandIcon: 'p-0' }}
        expandIcon={<Expand />}
      >
        {title}
      </AccordionSummary>

      <AccordionDetails className="p-0">{children}</AccordionDetails>
    </MUIAccordion>
  );
}
