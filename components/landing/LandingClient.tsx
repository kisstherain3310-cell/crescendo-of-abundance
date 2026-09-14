"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FrostOverlay } from "@/components/landing/FrostOverlay";
import { Headline } from "@/components/landing/Headline";
import { PhysicsStage, type PhysicsStageHandle } from "@/components/landing/PhysicsStage";
import { RecipeModal } from "@/components/landing/RecipeModal";
import { StatsHud } from "@/components/landing/StatsHud";
import { WipeHint } from "@/components/landing/WipeHint";
import { isFrostSkipKey, isTypingTarget } from "@/lib/frostUi";
import { mapSeriesToPhysics } from "@/lib/mapDataToPhysics";
import { recipeForSeed } from "@/lib/recipes";
import type { KamisSeries, Recipe } from "@/lib/types";

type LandingClientProps = {
  series: KamisSeries;
};

export function LandingClient({ series }: LandingClientProps) {
  const physics = useMemo(() => mapSeriesToPhysics(series), [series]);
  const stageRef = useRef<PhysicsStageHandle>(null);
  const recipeRef = useRef<Recipe | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showPhysics, setShowPhysics] = useState(false);

  recipeRef.current = recipe;
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  const openRecipe = useCallback((seed = Date.now()) => {
    setRecipe(recipeForSeed(seed));
  }, []);

  const skipFrost = useCallback(() => {
    revealedRef.current = true;
    window.__FROST_BOOT__?.skip?.();
    setRevealed(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1" || params.get("physics") === "1") {
      setShowPhysics(true);
    }
    if (window.__FROST_BOOT__?.cleared) {
      setRevealed(true);
    }

    const onCleared = () => setRevealed(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.key === "P" || event.key === "p")) {
        event.preventDefault();
        setShowPhysics((value) => !value);
        return;
      }
      if (recipeRef.current || revealedRef.current || event.repeat) return;
      if (isTypingTarget(event.target) || isTypingTarget(document.activeElement)) {
        return;
      }
      if (isFrostSkipKey(event)) {
        event.preventDefault();
        skipFrost();
      }
    };

    window.addEventListener("frost-skip", onCleared);
    window.addEventListener("frost:cleared", onCleared);
    const onOpenRecipe = (event: Event) => {
      const detail = (event as CustomEvent<{ seed?: number }>).detail;
      openRecipe(detail?.seed ?? 3);
    };
    window.addEventListener("open-recipe", onOpenRecipe);
    // Capture so Enter/Space skip frost even when a chrome button (CTA, skip)
    // is focused — QA failed when skip only ran on the skip button's keydown.
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("frost-skip", onCleared);
      window.removeEventListener("frost:cleared", onCleared);
      window.removeEventListener("open-recipe", onOpenRecipe);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [openRecipe, skipFrost]);

  return (
    <div
      data-body-count={physics.bodyCount}
      className="relative h-dvh min-h-dvh w-full overflow-hidden bg-transparent"
      style={{ height: "100dvh", minHeight: "100svh", width: "100%" }}
    >
      <PhysicsStage
        ref={stageRef}
        physics={physics}
        onFruitTap={({ seed }) => openRecipe(seed)}
      />
      <FrostOverlay
        revealed={revealed}
        onTap={(x, y) => stageRef.current?.tapAt(x, y)}
        onRevealed={skipFrost}
      />
      <Headline onOpenRecipe={() => openRecipe(3)} />
      <StatsHud physics={physics} showPhysics={showPhysics} />
      <WipeHint hidden={revealed} onSkip={skipFrost} />
      <RecipeModal recipe={recipe} onClose={() => setRecipe(null)} />
    </div>
  );
}
