import { AnimatePresence, motion } from 'framer-motion';

import styles from './Overlay.module.scss';

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
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  );
}
