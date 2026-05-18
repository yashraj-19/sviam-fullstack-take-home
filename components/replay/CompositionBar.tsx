'use client';

import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';

interface Props {
  typedChars: number;
  pastedChars: number;
  typedPct: number;
  pastedPct: number;
}

export function CompositionBar({ typedChars, pastedChars, typedPct, pastedPct }: Props) {
  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border bg-card/50">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0 w-28">Character mix</span>
          <div className="flex-1 flex h-6 rounded overflow-hidden gap-0.5 min-w-0">
            {/* Wrapping in a span avoids Radix asChild forwarding motion props to DOM */}
            <Tooltip>
              <TooltipTrigger>
                <motion.div
                  className="bg-blue-500/70 flex items-center justify-center text-xs text-white font-medium cursor-default h-6"
                  style={{ width: `${typedPct}%` }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${typedPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {typedPct >= 15 && `Typed ${typedPct}%`}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Typed: {formatNumber(typedChars)} chars ({typedPct}%)</TooltipContent>
            </Tooltip>

            {pastedPct > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <motion.div
                    className="bg-orange-500/70 flex items-center justify-center text-xs text-white font-medium cursor-default h-6"
                    style={{ width: `${pastedPct}%` }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${pastedPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  >
                    {pastedPct >= 15 && `Pasted ${pastedPct}%`}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Pasted: {formatNumber(pastedChars)} chars ({pastedPct}%)</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/70 inline-block" /> Typed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/70 inline-block" /> Pasted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
