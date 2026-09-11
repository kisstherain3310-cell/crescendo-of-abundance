import {
  BODY_COUNT_MAX,
  BODY_COUNT_MIN,
  type KamisDay,
  type KamisSeries,
  type PhysicsConfig,
} from "@/lib/types";
import { clamp, lerp, median } from "@/lib/utils";

const DEFAULT_GRAVITY = 0.72;
const CRASH_GRAVITY = 2.05;
const DEFAULT_RESTITUTION = 0.82;
const CRASH_RESTITUTION = 0.18;

export function volumeToBodyCount(
  volumeKg: number,
  minVolume: number,
  maxVolume: number,
  minCount = BODY_COUNT_MIN,
  maxCount = BODY_COUNT_MAX,
) {
  if (!Number.isFinite(volumeKg)) return minCount;
  if (maxVolume <= minVolume) {
    return clamp(Math.round(minCount), minCount, maxCount);
  }
  const t = clamp((volumeKg - minVolume) / (maxVolume - minVolume), 0, 1);
  return Math.round(lerp(minCount, maxCount, t));
}

export function priceDropToPhysics(currentPrice: number, baselinePrice: number) {
  const safeBaseline = baselinePrice > 0 ? baselinePrice : currentPrice || 1;
  const dropRatio = clamp((safeBaseline - currentPrice) / safeBaseline, 0, 1);
  return {
    dropRatio,
    gravity: lerp(DEFAULT_GRAVITY, CRASH_GRAVITY, dropRatio),
    restitution: lerp(DEFAULT_RESTITUTION, CRASH_RESTITUTION, dropRatio),
  };
}

export function mapSeriesToPhysics(series: KamisSeries): PhysicsConfig {
  const days = series.series;
  if (days.length === 0) {
    const fallbackDay: KamisDay = {
      date: "2026-09-11",
      volume: 0,
      price: 0,
    };
    return {
      bodyCount: BODY_COUNT_MIN,
      gravity: DEFAULT_GRAVITY,
      restitution: DEFAULT_RESTITUTION,
      dropRatio: 0,
      day: fallbackDay,
      item: series.item,
      unit: series.unit,
      priceUnit: series.priceUnit,
    };
  }

  const last = days[days.length - 1];
  const volumes = days.map((day) => day.volume);
  const priorPrices = days.slice(0, -1).map((day) => day.price);
  const baseline =
    priorPrices.length > 0 ? median(priorPrices) : last.price;
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const { gravity, restitution, dropRatio } = priceDropToPhysics(
    last.price,
    baseline,
  );

  return {
    bodyCount: volumeToBodyCount(last.volume, minVolume, maxVolume),
    gravity,
    restitution,
    dropRatio,
    day: last,
    item: series.item,
    unit: series.unit,
    priceUnit: series.priceUnit,
  };
}
