import axios from "axios";
import mockKamis from "@/data/mockKamis.json";
import type { KamisDay, KamisSeries } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function normalizeDay(raw: unknown): KamisDay | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as UnknownRecord;
  const date =
    asString(row.date) ??
    asString(row.일자) ??
    asString(row.ymd) ??
    asString(row.priceDate);
  const volume =
    asNumber(row.volume) ??
    asNumber(row.물량) ??
    asNumber(row.kg) ??
    asNumber(row.shipQty);
  const price =
    asNumber(row.price) ??
    asNumber(row.가격) ??
    asNumber(row.dpr1) ??
    asNumber(row.avgPrice);
  if (!date || volume === null || price === null) return null;
  return { date, volume, price };
}

export function normalizeKamis(payload: unknown): KamisSeries {
  if (payload && typeof payload === "object") {
    const root = payload as UnknownRecord;
    const maybeSeries =
      root.series ??
      root.data ??
      (root.data && typeof root.data === "object"
        ? (root.data as UnknownRecord).item
        : undefined) ??
      root.item;

    const rows = Array.isArray(maybeSeries)
      ? maybeSeries
      : Array.isArray(payload)
        ? payload
        : [];
    const series = rows
      .map(normalizeDay)
      .filter((day): day is KamisDay => day !== null);

    if (series.length > 0) {
      return {
        item: asString(root.item) ?? mockKamis.item,
        itemCode: asString(root.itemCode) ?? mockKamis.itemCode,
        market: asString(root.market) ?? mockKamis.market,
        unit: asString(root.unit) ?? mockKamis.unit,
        priceUnit: asString(root.priceUnit) ?? mockKamis.priceUnit,
        series,
      };
    }
  }

  return mockKamis as KamisSeries;
}

export async function fetchTomatoSeries(): Promise<KamisSeries> {
  const url = process.env.NEXT_PUBLIC_KAMIS_API_URL;
  if (!url) {
    return mockKamis as KamisSeries;
  }

  try {
    const { data } = await axios.get(url, { timeout: 4000 });
    const normalized = normalizeKamis(data);
    if (normalized.series.length === 0) {
      return mockKamis as KamisSeries;
    }
    return normalized;
  } catch {
    return mockKamis as KamisSeries;
  }
}
