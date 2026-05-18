'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Props {
  visible: boolean;
  fromLine: number;
  toLine: number;
}

export function CursorJumpIndicator({ visible, fromLine, toLine }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-12 right-4 z-20 px-3 py-1.5 rounded-md bg-purple-600/90 text-white text-xs font-medium shadow-lg pointer-events-none flex items-center gap-1.5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
        >
          Line {fromLine}
          <ArrowRight className="h-3 w-3" />
          Line {toLine}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
