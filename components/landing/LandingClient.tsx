"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FrostOverlay } from "@/components/landing/FrostOverlay";
import { Headline } from "@/components/landing/Headline";
import { PhysicsStage, type PhysicsStageHandle } from "@/components/landing/PhysicsStage";
import { RecipeModal } from "@/components/landing/RecipeModal";
import { StatsHud } from "@/components/landing/StatsHud";
import { WipeHint } from "@/components/landing/WipeHint";
import { isFrostSkipTarget } from "@/lib/frostUi";
import { mapSeriesToPhysics } from "@/lib/mapDataToPhysics";
import { recipeForSeed } from "@/lib/recipes";
import type { KamisSeries, Recipe } from "@/lib/types";

type LandingClientProps = {
  series: KamisSeries;
};

export function LandingClient({ series }: LandingClientProps) {
  const physics = useMemo(() => mapSeriesToPhysics(series), [series]);
  const stageRef = useRef<PhysicsStageHandle>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showPhysics, setShowPhysics] = useState(false);
  const recipeRef = useRef<Recipe | null>(null);
  recipeRef.current = recipe;

  const openRecipe = useCallback((seed = Date.now()) => {
    const next = recipeForSeed(seed);
    window.setTimeout(() => setRecipe(next), 0);
  }, []);

  const skipFrost = useCallback(() => {
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

    const onSkipEvent = () => setRevealed(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.key === "P" || event.key === "p")) {
        event.preventDefault();
        setShowPhysics((value) => !value);
        return;
      }
      if (recipeRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        skipFrost();
        return;
      }
      if (
        isFrostSkipTarget(event.target) &&
        (event.key === "Enter" || event.key === " " || event.code === "Space")
      ) {
        event.preventDefault();
        skipFrost();
      }
    };

    window.addEventListener("frost-skip", onSkipEvent);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("frost-skip", onSkipEvent);
      window.removeEventListener("keydown", onKey);
    };
  }, [skipFrost]);

  return (
    <div className="relative isolate h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#14080b]">
      <PhysicsStage
        ref={stageRef}
        physics={physics}
        onFruitTap={({ seed }) => openRecipe(seed)}
      />
      <FrostOverlay
        revealed={revealed}
        onTap={(x, y) => stageRef.current?.tapAt(x, y)}
        onRevealed={() => setRevealed(true)}
      />
      <Headline onOpenRecipe={() => openRecipe(3)} />
      <StatsHud physics={physics} showPhysics={showPhysics} />
      <WipeHint hidden={revealed} onSkip={skipFrost} />
      <RecipeModal recipe={recipe} onClose={() => setRecipe(null)} />
    </div>
  );
}
