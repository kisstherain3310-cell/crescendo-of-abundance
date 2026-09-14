"use client";

type HeadlineProps = {
  onOpenRecipe: () => void;
};

export function Headline({ onOpenRecipe }: HeadlineProps) {
  return (
    <header
      data-frost-chrome
      data-frost-ui
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] text-center sm:px-6 sm:pt-[min(10vh,6.5rem)]"
    >
      <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.42em] text-rose-100/80">
        Crescendo of Abundance
      </p>
      <h1 className="mt-3 max-w-[20rem] font-serif text-[clamp(1.45rem,6.4vw,3.2rem)] font-semibold leading-[1.28] text-rose-50 sm:mt-5 sm:max-w-3xl">
        오늘, 대지가 이성을 잃었습니다.
        <span className="mt-2 block font-serif text-[clamp(0.98rem,3.6vw,1.55rem)] font-normal tracking-wide text-rose-50/85 sm:mt-3">
          가장 완벽한 과잉을 소비할 시간.
        </span>
      </h1>
      <div className="pointer-events-auto relative z-[80] mt-5 sm:mt-8" data-frost-ui>
        <button
          id="open-recipe-cta"
          type="button"
          data-frost-chrome
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenRecipe();
          }}
          className="relative z-[80] inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-[0.95rem] font-semibold text-primary-foreground shadow-[0_10px_40px_rgba(80,0,20,0.35)] hover:bg-primary/90"
        >
          과잉 레시피 보기
        </button>
      </div>
    </header>
  );
}
