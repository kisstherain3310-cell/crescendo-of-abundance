"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type WipeHintProps = {
  hidden: boolean;
  onSkip: () => void;
};

export function WipeHint({ hidden, onSkip }: WipeHintProps) {
  return (
    <AnimatePresence>
      {hidden ? null : (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className="absolute bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(92vw,22rem)] -translate-x-1/2 md:bottom-8"
        >
          <div className="rounded-2xl border border-white/20 bg-[#1a0a0d]/82 px-4 py-3 text-center shadow-[0_12px_40px_rgba(20,0,8,0.45)] backdrop-blur-md">
            <div className="mx-auto mb-2 flex h-8 w-24 items-center justify-center" aria-hidden>
              <motion.span
                className="block size-6 rounded-full border-2 border-rose-50/90 bg-rose-50/25"
                animate={{ x: [-18, 18, -18] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm font-medium text-rose-50">
              화면을 문질러 서리를 걷어내세요
            </p>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/75">
              걷힌 자리의 방울토마토를 누르면 레시피가 열립니다.
              <br />
              <kbd className="rounded border border-white/20 px-1 py-0.5 text-[0.65rem]">
                Esc
              </kbd>
              {" "}또는 아래 버튼으로 건너뛸 수 있습니다.
            </p>
            <Button
              type="button"
              onClick={onSkip}
              className="pointer-events-auto mt-3 h-10 rounded-full border border-white/25 bg-white/15 px-5 text-sm text-rose-50 hover:bg-white/25"
            >
              서리 걷어내기
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
