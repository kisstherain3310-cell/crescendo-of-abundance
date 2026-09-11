"use client";

import type { PhysicsConfig } from "@/lib/types";
import { formatKg, formatWon } from "@/lib/utils";

type StatsHudProps = {
  physics: PhysicsConfig;
};

export function StatsHud({ physics }: StatsHudProps) {
  const crashing = physics.dropRatio >= 0.45;

  return (
    <aside className="pointer-events-none absolute right-4 top-4 z-40 w-[min(calc(100%-2rem),18rem)] rounded-2xl border border-white/15 bg-black/30 p-4 text-left text-rose-50 shadow-lg backdrop-blur-md">
      <p className="text-[0.65rem] uppercase tracking-[0.28em] text-rose-100/60">
        KAMIS mock · {physics.item}
      </p>
      <p className="mt-2 font-serif text-lg leading-none">{physics.day.date}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
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
        <div>
          <dt className="text-[0.65rem] text-rose-100/55">중력 / 탄성</dt>
          <dd className="tabular-nums">
            {physics.gravity.toFixed(2)} / {physics.restitution.toFixed(2)}
          </dd>
        </div>
      </dl>
      {crashing ? (
        <p className="mt-3 inline-flex rounded-full bg-rose-500/80 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide">
          가격 폭락 · 대지가 무너지는 중
        </p>
      ) : null}
    </aside>
  );
}
