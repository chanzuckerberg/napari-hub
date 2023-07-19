import Add from '@mui/icons-material/Add';
import MUIAccordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import clsx from 'clsx';
import { ReactNode, useState } from 'react';

import { Expand } from '@/components/icons';

import styles from './Accordian.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  variant?: 'default' | 'faq';
}

/**
 * Wrapper component over Material UI accordion with napari hub specific customizations.
 */
export function Accordion({
  children,
  className,
  title,
  titleClassName,
  variant = 'default',
}: Props) {
  const isDefault = variant === 'default';
  const isFAQ = variant === 'faq';
  const [expanded, setExpanded] = useState(false);

  return (
    <MUIAccordion
      classes={{
        root: clsx('shadow-none', isFAQ && styles.accordion, className),
        expanded: styles.expanded,
      }}
      expanded={expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
    >
      <AccordionSummary
        data-testid="accordionSummary"
        data-title={title}
        className={clsx(
          'p-0 font-semibold',
          styles.summary,
          isDefault && 'flex-row-reverse',
          titleClassName,
        )}
        classes={{
          expandIconWrapper: styles.expandIcon,
          expanded: clsx(styles.expanded),
          ...(isFAQ
            ? {}
            : {
                content: '!ml-sds-xl',
              }),
        }}
        expandIcon={isFAQ ? <Add className="text-black" /> : <Expand />}
      >
        {title}
      </AccordionSummary>

      <AccordionDetails className="p-0 flex-col">{children}</AccordionDetails>
    </MUIAccordion>
  );
}
