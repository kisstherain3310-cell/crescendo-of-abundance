"use client";

import { useMemo, useRef, useState } from "react";
import {
  FrostOverlay,
  type FrostOverlayHandle,
} from "@/components/landing/FrostOverlay";
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
  const frostRef = useRef<FrostOverlayHandle>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [wiped, setWiped] = useState(false);
  const [showPhysics, setShowPhysics] = useState(false);

  const openRecipe = (seed = Date.now()) => {
    setRecipe(recipeForSeed(seed));
  };

  const skipFrost = () => {
    frostRef.current?.clear();
    setWiped(true);
  };

  const replayFrost = () => {
    setRecipe(null);
    frostRef.current?.reset();
    setWiped(false);
  };

  return (
    <div className="relative flex h-dvh min-h-svh flex-col overflow-hidden bg-[#14080b]">
      <Headline onOpenRecipe={() => openRecipe(3)}>
        <StatsHud
          physics={physics}
          source={series.source ?? "mock"}
          updatedAt={series.updatedAt}
          unit={series.items?.[0]?.unit ?? series.priceUnit}
          note={series.note ?? series.items?.[0]?.note}
          showPhysics={showPhysics}
        />
        <button
          type="button"
          onClick={() => setShowPhysics((value) => !value)}
          className="mt-1 text-[0.65rem] text-rose-100/35 underline decoration-rose-100/20 underline-offset-2 hover:text-rose-100/55"
        >
          {showPhysics ? "물리 숨기기" : "물리 보기"}
        </button>
      </Headline>
      <div className="relative min-h-[240px] flex-1">
        <PhysicsStage
          ref={stageRef}
          physics={physics}
          onFruitTap={({ seed }) => openRecipe(seed)}
        />
        <FrostOverlay
          ref={frostRef}
          interactive={!wiped}
          onTap={(x, y) => stageRef.current?.tapAt(x, y)}
          onWipedChange={setWiped}
        />
        <WipeHint hidden={wiped} onSkip={skipFrost} />
      </div>
      <RecipeModal
        recipe={recipe}
        onClose={() => setRecipe(null)}
        onReplay={replayFrost}
      />
    </div>
  );
}
