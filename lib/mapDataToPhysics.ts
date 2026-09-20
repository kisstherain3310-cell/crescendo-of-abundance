import {
  BODY_COUNT_MAX,
  BODY_COUNT_MIN,
  type KamisDay,
  type KamisSeries,
  type PhysicsConfig,
} from "@/lib/types";
import { clamp, lerp, median } from "@/lib/utils";

const DEFAULT_GRAVITY = 0.16;
const CRASH_GRAVITY = 0.38;
const DEFAULT_RESTITUTION = 0.74;
const CRASH_RESTITUTION = 0.4;

/**
 * Legacy helper: map real shipment volume (kg) into body count.
 * Prefer `priceToBodyCount` for the contest viz — KAMIS Open API gives price,
 * and abundance is derived from price drop (lower price → more tomatoes).
 */
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

/**
 * Abundance visualization from wholesale price.
 * Lower price → higher body count (풍요 / 과잉 출하 은유).
 * Price itself comes from KAMIS; this mapping is our interpretive layer.
 */
export function priceToBodyCount(
  price: number,
  minPrice: number,
  maxPrice: number,
  minCount = BODY_COUNT_MIN,
  maxCount = BODY_COUNT_MAX,
) {
  if (!Number.isFinite(price)) return minCount;
  if (maxPrice <= minPrice) {
    return clamp(Math.round(minCount), minCount, maxCount);
  }
  // Invert: trough price → t=1 → max tomatoes
  const t = clamp((maxPrice - price) / (maxPrice - minPrice), 0, 1);
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
      source: series.source ?? "demo",
      updatedAt: series.updatedAt ?? fallbackDay.date,
      market: series.market,
      volumeDerivedFromPrice: true,
    };
  }

  const last = days[days.length - 1];
  const prices = days.map((day) => day.price);
  const priorPrices = days.slice(0, -1).map((day) => day.price);
  const baseline =
    priorPrices.length > 0 ? median(priorPrices) : last.price;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const { gravity, restitution, dropRatio } = priceDropToPhysics(
    last.price,
    baseline,
  );

  // Body count always tracks inverse price (abundance from price crash).
  // Mock JSON still carries illustrative volume for the HUD when not derived.
  const volumeDerived =
    series.volumeDerivedFromPrice === true ||
    series.source === "kamis" ||
    days.every((d) => d.volume <= 0);

  return {
    bodyCount: priceToBodyCount(last.price, minPrice, maxPrice),
    gravity,
    restitution,
    dropRatio,
    day: last,
    item: series.item,
    unit: series.unit,
    priceUnit: series.priceUnit,
    source: series.source ?? "demo",
    updatedAt: series.updatedAt ?? last.date,
    market: series.market,
    volumeDerivedFromPrice: volumeDerived,
  };
}
