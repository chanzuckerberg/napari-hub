import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

interface FadeProps {
  children?: ReactNode;
  className?: string;
  visible?: boolean;
}

export const Fade = forwardRef<HTMLDivElement, FadeProps>(
  ({ visible, ...props }, ref) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          {...props}
        />
      )}
    </AnimatePresence>
  ),
);
