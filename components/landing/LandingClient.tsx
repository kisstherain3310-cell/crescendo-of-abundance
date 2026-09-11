"use client";

import { useMemo, useRef, useState } from "react";
import { FrostOverlay } from "@/components/landing/FrostOverlay";
import { Headline } from "@/components/landing/Headline";
import { PhysicsStage, type PhysicsStageHandle } from "@/components/landing/PhysicsStage";
import { RecipeModal } from "@/components/landing/RecipeModal";
import { StatsHud } from "@/components/landing/StatsHud";
import { WipeHint } from "@/components/landing/WipeHint";
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
  const [wiped, setWiped] = useState(false);

  const openRecipe = (seed = Date.now()) => {
    setRecipe(recipeForSeed(seed));
  };

  return (
    <div className="relative h-dvh min-h-svh overflow-hidden bg-[#14080b]">
      <PhysicsStage
        ref={stageRef}
        physics={physics}
        onFruitTap={({ seed }) => openRecipe(seed)}
      />
      <FrostOverlay
        onTap={(x, y) => stageRef.current?.tapAt(x, y)}
        onWipedChange={setWiped}
      />
      <Headline onOpenRecipe={() => openRecipe(3)} />
      <StatsHud physics={physics} />
      <WipeHint hidden={wiped} />
      <RecipeModal recipe={recipe} onClose={() => setRecipe(null)} />
    </div>
  );
}
