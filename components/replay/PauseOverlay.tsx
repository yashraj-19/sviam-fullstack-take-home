'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  durationSeconds: number;
}

export function PauseOverlay({ visible, durationSeconds }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-background/80 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
            <span>Paused {Math.round(durationSeconds)}s</span>
            <span className="inline-flex gap-0.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-muted-foreground inline-block"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
