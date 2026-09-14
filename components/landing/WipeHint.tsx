"use client";

import { AnimatePresence, motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/motion";
import { useEffect, useState } from "react";

type WipeHintProps = {
  hidden: boolean;
  onSkip: () => void;
};

export function WipeHint({ hidden, onSkip }: WipeHintProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const instant = reduceMotion || prefersReducedMotion();

  return (
    <AnimatePresence>
      {hidden ? null : (
        <motion.div
          initial={instant ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={instant ? { opacity: 0 } : { opacity: 0, y: 6 }}
          transition={instant ? { duration: 0 } : { duration: 0.28 }}
          className="absolute bottom-5 left-1/2 z-40 flex w-[min(92vw,22rem)] -translate-x-1/2 flex-col items-center gap-2 text-center"
        >
          {instant ? null : (
            <span className="frost-finger-wipe" aria-hidden>
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                className="text-rose-50/70"
              >
                <path
                  d="M11.2 4.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v7.1h.3c.3-1.1 1.2-1.6 2.1-1.6.9 0 1.7.6 2 1.5.4-1 1.3-1.4 2.2-1.2.9.2 1.5 1.1 1.5 2.1v4.4c0 3.6-2.4 6.5-6.1 6.5h-1.7c-2.8 0-5.1-1.6-6.4-3.8L6.2 14.4c-.5-.8-.2-1.8.6-2.3.8-.5 1.8-.2 2.3.6l1.1 1.7V4.2Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          )}
          <p className="pointer-events-none text-sm text-rose-50/85">
            손가락으로 문질러 보세요
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-sm bg-transparent text-[0.8rem] text-rose-100/70 underline decoration-rose-100/35 underline-offset-4 transition-colors hover:text-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#14080b]"
          >
            건너뛰기
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
