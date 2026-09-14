"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type HeadlineProps = {
  onOpenRecipe: () => void;
  children?: ReactNode;
};

export function Headline({ onOpenRecipe, children }: HeadlineProps) {
  return (
    <header className="relative z-40 shrink-0 px-5 pb-3 pt-5 text-center">
      <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.42em] text-rose-100/70">
        Crescendo of Abundance
      </p>
      <h1 className="mt-2.5 max-w-3xl mx-auto font-serif text-[clamp(1.45rem,6.4vw,3.2rem)] font-semibold leading-[1.25] text-rose-50">
        오늘, 대지가 이성을 잃었습니다.
        <span className="mt-1.5 block font-serif text-[clamp(0.95rem,3.6vw,1.5rem)] font-normal tracking-wide text-rose-50/85">
          가장 완벽한 과잉을 소비할 시간.
        </span>
      </h1>
      {children}
      <div className="mt-3">
        <Button
          type="button"
          onClick={onOpenRecipe}
          className="h-10 rounded-full border border-white/20 bg-white/12 px-5 text-[0.9rem] text-rose-50 shadow-[0_10px_40px_rgba(80,0,20,0.35)] backdrop-blur-md hover:bg-white/20"
        >
          과잉 레시피 보기
        </Button>
      </div>
    </header>
  );
}
