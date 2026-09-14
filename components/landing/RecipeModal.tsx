"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { prefersReducedMotion } from "@/lib/motion";
import type { Recipe } from "@/lib/types";

type RecipeModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
  onReplay?: () => void;
};

async function shareLanding() {
  const title = "Crescendo of Abundance";
  const text = "오늘, 대지가 이성을 잃었습니다. 방울토마토 공개시세 참고 데모.";
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text} ${url}`);
    }
  } catch {
    /* user cancelled or clipboard blocked */
  }
}

export function RecipeModal({ recipe, onClose, onReplay }: RecipeModalProps) {
  return (
    <Dialog open={Boolean(recipe)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-rose-200/20 bg-[#2a1216] p-0 text-rose-50 sm:rounded-2xl">
        <AnimatePresence>
          {recipe ? (
            <motion.div
              key={recipe.id}
              initial={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={
                prefersReducedMotion()
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 280, damping: 26 }
              }
              className="p-6"
            >
              <DialogHeader>
                <p className="text-[0.7rem] uppercase tracking-[0.32em] text-rose-200/70">
                  과잉 레시피
                </p>
                <DialogTitle className="font-serif text-2xl text-rose-50">
                  {recipe.title}
                </DialogTitle>
                <DialogDescription className="text-rose-100/75">
                  {recipe.subtitle} · {recipe.time} · {recipe.servings}
                </DialogDescription>
              </DialogHeader>
              <p className="mt-4 text-sm leading-relaxed text-rose-50/90">
                {recipe.whyNow}
              </p>
              <p className="mt-3 text-xs text-rose-100/50">
                참고용·공개시세
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/80">
                    재료
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-rose-50/90">
                    {recipe.ingredients.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/80">
                    순서
                  </h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-rose-50/90">
                    {recipe.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void shareLanding()}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-rose-50 hover:bg-white/20"
                >
                  공유하기
                </button>
                <button
                  type="button"
                  onClick={() => (onReplay ? onReplay() : onClose())}
                  className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm text-rose-100/80 hover:bg-white/10"
                >
                  다시 보기
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
