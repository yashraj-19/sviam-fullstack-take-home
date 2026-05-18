'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  charCount: number;
}

export function PasteFlash({ visible, charCount }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-md bg-emerald-500/90 text-white text-xs font-semibold shadow-lg pointer-events-none"
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          PASTED {charCount.toLocaleString()} chars{charCount > 500 ? ' (truncated for display)' : ''}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
