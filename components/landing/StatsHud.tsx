"use client";

import type { PhysicsConfig } from "@/lib/types";
import { formatKg, formatWon } from "@/lib/utils";

type StatsHudProps = {
  physics: PhysicsConfig;
  showPhysics?: boolean;
};

export function StatsHud({ physics, showPhysics = false }: StatsHudProps) {
  const crashing = physics.dropRatio >= 0.45;
  const asOf = physics.updatedAt || physics.day.date;
  const demo = physics.source !== "kamis";

  return (
    <aside
      className="pointer-events-none fixed z-[80] left-4 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] top-auto w-auto rounded-2xl border border-white/15 bg-black/45 p-3 text-left text-rose-50 shadow-lg backdrop-blur-md md:left-auto md:right-4 md:top-4 md:bottom-auto md:w-[min(calc(100%-2rem),16.5rem)] md:p-4"
      aria-label="출하 현황"
    >
      <p className="text-[0.68rem] font-medium tracking-wide text-rose-100/80">
        {demo ? "데모 데이터" : "KAMIS"}
        <span className="text-rose-100/50"> · {asOf} 기준</span>
      </p>
      <p className="mt-1 font-serif text-base leading-tight md:text-lg">
        {physics.item}
        {physics.market ? (
          <span className="mt-0.5 block font-sans text-[0.7rem] font-normal text-rose-100/60">
            {physics.market}
          </span>
        ) : null}
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-sm md:mt-3 md:grid-cols-2 md:gap-x-3 md:gap-y-2">
        <div>
          <dt className="text-[0.65rem] text-rose-100/55">출하량</dt>
          <dd className="font-medium tabular-nums">{formatKg(physics.day.volume)}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] text-rose-100/55">도매가</dt>
          <dd className="font-medium tabular-nums">{formatWon(physics.day.price)}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] text-rose-100/55">과실 수</dt>
          <dd className="tabular-nums">{physics.bodyCount}알</dd>
        </div>
      </dl>
      {showPhysics ? (
        <div className="mt-3 border-t border-white/10 pt-2">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-rose-100/45">
            물리 (dev)
          </p>
          <dl className="mt-1 grid grid-cols-2 gap-x-3 text-sm">
            <div>
              <dt className="text-[0.65rem] text-rose-100/55">중력</dt>
              <dd className="tabular-nums">{physics.gravity.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] text-rose-100/55">탄성</dt>
              <dd className="tabular-nums">{physics.restitution.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      {crashing ? (
        <p className="mt-2 inline-flex rounded-full bg-rose-500/80 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide md:mt-3">
          가격 폭락 · 대지가 무너지는 중
        </p>
      ) : null}
    </aside>
  );
}
