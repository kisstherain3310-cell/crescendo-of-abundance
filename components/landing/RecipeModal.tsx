"use client";

import { useEffect, useRef } from "react";
import type { Recipe } from "@/lib/types";

type RecipeModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
};

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (!recipe) return;
    openedAtRef.current = performance.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recipe, onClose]);

  if (!recipe) return null;

  const closeUnlessOpeningGesture = () => {
    if (performance.now() - openedAtRef.current < 450) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-title"
      data-frost-ui
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="레시피 닫기"
        onClick={closeUnlessOpeningGesture}
        onPointerDown={(event) => {
          if (performance.now() - openedAtRef.current < 450) {
            event.preventDefault();
          }
        }}
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
    </div>
  );
}
