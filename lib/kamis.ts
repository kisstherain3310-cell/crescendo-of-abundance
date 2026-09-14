import axios from "axios";
import mockKamis from "@/data/mockKamis.json";
import type {
  KamisDay,
  KamisItemSlot,
  KamisSeries,
  KamisSource,
} from "@/lib/types";

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

function asDateOnly(value?: string | null) {
  if (!value) return undefined;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1];
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

function normalizeItemSlot(raw: unknown): KamisItemSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as UnknownRecord;
  return {
    unit: asString(row.unit) ?? asString(row.priceUnit),
    region: asString(row.region),
    grade: asString(row.grade),
    note: asString(row.note),
  };
}

function pickSource(raw: unknown, fallback: KamisSource): KamisSource {
  if (raw === "kamis" || raw === "mock") return raw;
  if (raw === "live") return "kamis";
  if (raw === "demo") return "mock";
  return fallback;
}

function pickUpdatedAt(root: UnknownRecord) {
  const raw =
    asString(root.updatedAt) ??
    asString(root.lastUpdated) ??
    asString(root.timestamp);
  if (raw && !Number.isNaN(new Date(raw).getTime())) return raw;
  return new Date().toISOString();
}

function pickAsOf(root: UnknownRecord, fallbackSeries: KamisDay[]) {
  return (
    asDateOnly(asString(root.asOf)) ??
    asDateOnly(asString(root.priceDate)) ??
    asDateOnly(asString(root.regday)) ??
    asDateOnly(fallbackSeries.at(-1)?.date) ??
    fallbackSeries.at(-1)?.date
  );
}

function tagSeries(
  series: KamisSeries,
  source: KamisSource,
  extras?: Partial<Pick<KamisSeries, "asOf" | "updatedAt" | "note" | "items">>,
): KamisSeries {
  const items = extras?.items ?? series.items;
  const note =
    extras?.note ??
    series.note ??
    items?.[0]?.note ??
    "참고용·공개시세";
  return {
    ...series,
    source,
    asOf: asDateOnly(extras?.asOf ?? series.asOf) ?? series.series.at(-1)?.date,
    updatedAt: extras?.updatedAt ?? series.updatedAt ?? new Date().toISOString(),
    items: items ?? [
      {
        unit: series.priceUnit || "원/kg",
        region: null,
        grade: null,
        note,
      },
    ],
    note,
  };
}

export function demoKamisFallback(): KamisSeries {
  return tagSeries(mockKamis as KamisSeries, "mock");
}

export function normalizeKamis(payload: unknown): KamisSeries | null {
  if (!payload || typeof payload !== "object") return null;
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

  if (series.length === 0) return null;

  const items = Array.isArray(root.items)
    ? root.items
        .map(normalizeItemSlot)
        .filter((item): item is KamisItemSlot => item !== null)
    : undefined;
  const firstItem = items?.[0];

  return {
    item: asString(root.item) ?? mockKamis.item,
    itemCode: asString(root.itemCode) ?? mockKamis.itemCode,
    market: asString(root.market) ?? mockKamis.market,
    unit: asString(root.unit) ?? firstItem?.unit ?? mockKamis.unit,
    priceUnit:
      asString(root.priceUnit) ?? firstItem?.unit ?? mockKamis.priceUnit,
    series,
    source: pickSource(root.source, "kamis"),
    asOf: pickAsOf(root, series),
    updatedAt: pickUpdatedAt(root),
    items,
    note: asString(root.note) ?? firstItem?.note ?? "참고용·공개시세",
  };
}

export async function fetchTomatoSeries(): Promise<KamisSeries> {
  const fallback = demoKamisFallback();
  const url = process.env.NEXT_PUBLIC_KAMIS_API_URL;
  if (!url) {
    return fallback;
  }

  try {
    const { data } = await axios.get(url, { timeout: 4000 });
    const normalized = normalizeKamis(data);
    if (!normalized) {
      return fallback;
    }
    return tagSeries(normalized, pickSource(normalized.source, "kamis"));
  } catch {
    return fallback;
  }
}
