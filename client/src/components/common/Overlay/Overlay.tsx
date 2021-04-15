import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  visible?: boolean;
}

/**
 * Screen overlay that animates in and out of view.
 */
export function Overlay({ visible = false }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="overlay"
          className={clsx(
            // Colors
            'bg-black bg-opacity-50',

            // Dimensions
            'w-screen h-screen',

            // Positioning
            'fixed top-0 right-0',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  );
}
