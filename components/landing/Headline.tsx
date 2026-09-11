"use client";

import { Button } from "@/components/ui/button";

type HeadlineProps = {
  onOpenRecipe: () => void;
};

export function Headline({ onOpenRecipe }: HeadlineProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col items-center px-6 pt-[min(12vh,7.5rem)] text-center">
      <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.42em] text-rose-100/70">
        Crescendo of Abundance
      </p>
      <h1 className="mt-5 max-w-3xl font-serif text-[clamp(1.7rem,4.6vw,3.4rem)] font-semibold leading-[1.25] text-rose-50">
        오늘, 대지가 이성을 잃었습니다.
        <span className="mt-3 block font-serif text-[clamp(1.05rem,2.4vw,1.55rem)] font-normal tracking-wide text-rose-50/85">
          가장 완벽한 과잉을 소비할 시간.
        </span>
      </h1>
      <div className="pointer-events-auto mt-8">
        <Button
          type="button"
          onClick={onOpenRecipe}
          className="h-11 rounded-full border border-white/20 bg-white/12 px-6 text-[0.95rem] text-rose-50 shadow-[0_10px_40px_rgba(80,0,20,0.35)] backdrop-blur-md hover:bg-white/20"
        >
          과잉 레시피 보기
        </Button>
      </div>
    </header>
  );
}
