"use client";

import type { KamisSource, PhysicsConfig } from "@/lib/types";
import { formatUpdatedClock, formatWonPerKg } from "@/lib/utils";

type StatsHudProps = {
  physics: PhysicsConfig;
  source?: KamisSource;
  asOf?: string;
  showPhysics?: boolean;
};

export function StatsHud({
  physics,
  source = "demo",
  asOf,
  showPhysics = false,
}: StatsHudProps) {
  const clock = formatUpdatedClock(asOf);
  const banner =
    source === "live" ? `공개시세 · 갱신 ${clock}` : `데모 데이터 · 갱신 ${clock}`;

  return (
    <div className="mt-2.5 flex flex-col items-center gap-1 text-center">
      <p className="max-w-full truncate text-[0.75rem] leading-5 text-rose-100/55">
        {banner}
      </p>
      <p className="text-sm tabular-nums text-rose-50/80">
        {formatWonPerKg(physics.day.price)}
      </p>
      {showPhysics ? (
        <p className="text-[0.65rem] tabular-nums text-rose-100/40">
          중력 {physics.gravity.toFixed(2)} · 탄성 {physics.restitution.toFixed(2)}
        </p>
      ) : null}
    </div>
  );
}
