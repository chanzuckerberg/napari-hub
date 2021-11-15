import MUIAccordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Add from '@material-ui/icons/Add';
import clsx from 'clsx';
import { ReactNode } from 'react';

import { Expand } from '@/components/common/icons';

import styles from './Accordian.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  variant?: 'default' | 'faq';
}

/**
 * Wrapper component over Material UI accordion with napari hub specific customizations.
 */
export function Accordion({
  children,
  className,
  title,
  variant = 'default',
}: Props) {
  const isDefault = variant === 'default';
  const isFAQ = variant === 'faq';

  return (
    <MUIAccordion
      classes={{
        root: clsx('shadow-none', isFAQ && styles.accordion, className),
        expanded: styles.expanded,
      }}
    >
      <AccordionSummary
        data-testid="accordionSummary"
        data-title={title}
        className={clsx('p-0 font-semibold', isDefault && 'flex-row-reverse')}
        classes={
          isFAQ
            ? {
                expandIcon: styles.expandIcon,
                expanded: styles.expanded,
              }
            : { content: '!ml-6', expandIcon: 'p-0' }
        }
        expandIcon={isFAQ ? <Add className="text-black" /> : <Expand />}
      >
        {title}
      </AccordionSummary>

      <AccordionDetails className="p-0 flex-col">{children}</AccordionDetails>
    </MUIAccordion>
  );
}
