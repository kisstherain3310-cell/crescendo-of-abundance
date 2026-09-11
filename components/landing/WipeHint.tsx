"use client";

import { AnimatePresence, motion } from "framer-motion";

type WipeHintProps = {
  hidden: boolean;
};

export function WipeHint({ hidden }: WipeHintProps) {
  return (
    <AnimatePresence>
      {hidden ? null : (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-40 w-[min(90vw,24rem)] -translate-x-1/2 text-center text-sm text-rose-50/85"
        >
          손가락이나 커서로 서리를 걷어내면,
          <br />
          쏟아지는 방울토마토가 드러납니다.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
