"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Recipe } from "@/lib/types";

type RecipeModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
};

const DISMISS_GUARD_MS = 700;

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const openedAtRef = useRef(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!recipe) return;
    openedAtRef.current = performance.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (performance.now() - openedAtRef.current < DISMISS_GUARD_MS) return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recipe]);

  if (!recipe || typeof document === "undefined") return null;

  const ignoreDismiss = () => performance.now() - openedAtRef.current < DISMISS_GUARD_MS;

  const closeIfArmed = () => {
    if (ignoreDismiss()) return;
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-title"
      data-recipe-modal="1"
      data-frost-ui
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={closeIfArmed}
        aria-hidden
      />
      <div className="relative z-10 max-h-[min(88dvh,40rem)] w-[min(92vw,34rem)] overflow-auto rounded-2xl border border-rose-200/20 bg-[#2a1216] p-6 text-rose-50 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm text-rose-100/70 hover:text-rose-50"
          aria-label="닫기"
        >
          ×
        </button>
        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-rose-200/70">
          과잉 레시피
        </p>
        <h2 id="recipe-title" className="mt-2 font-serif text-2xl text-rose-50">
          {recipe.title}
        </h2>
        <p className="mt-1 text-sm text-rose-100/75">
          {recipe.subtitle} · {recipe.time} · {recipe.servings}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-rose-50/90">{recipe.whyNow}</p>
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
      </div>
    </div>,
    document.body,
  );
}
