import axios from "axios";
import mockKamis from "@/data/mockKamis.json";
import type { DataSource, KamisDay, KamisSeries } from "@/lib/types";

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

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
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
    asNumber(row.shipQty) ??
    asNumber(row.abundance);
  const price =
    asNumber(row.price) ??
    asNumber(row.가격) ??
    asNumber(row.dpr1) ??
    asNumber(row.avgPrice);
  if (!date || price === null) return null;
  // Volume may be a price-derived abundance proxy (live KAMIS has no 출하량).
  return { date, volume: volume ?? 0, price };
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
        volumeDerivedFromPrice:
          asBoolean(root.volumeDerivedFromPrice) ||
          series.every((d) => d.volume === 0),
      };
    }
  }

  return withSourceMeta(mockKamis as KamisSeries, "demo");
}

function withSourceMeta(series: KamisSeries, source: DataSource): KamisSeries {
  const last = series.series[series.series.length - 1];
  return {
    ...series,
    source,
    updatedAt: series.updatedAt ?? last?.date,
  };
}

function resolveProxyUrl(): string | null {
  const explicit = process.env.KAMIS_PROXY_URL?.trim();
  if (explicit) return explicit;

  const site =
    process.env.URL?.trim() ||
    process.env.DEPLOY_PRIME_URL?.trim() ||
    process.env.DEPLOY_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (site) {
    return `${site.replace(/\/$/, "")}/api/kamis/tomato`;
  }

  // Local netlify dev default
  if (process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev") {
    return "http://localhost:8888/api/kamis/tomato";
  }

  return null;
}

/**
 * Loads tomato wholesale price series for the landing.
 *
 * Live path: Netlify Function `/api/kamis/tomato` → KAMIS `periodProductList`.
 * Mock path: `data/mockKamis.json` when env/proxy/upstream fails.
 *
 * Price is from KAMIS (or mock). Abundance visualization is derived from
 * price drop in `mapDataToPhysics` — not a direct KAMIS shipment feed.
 */
export async function fetchTomatoSeries(): Promise<KamisSeries> {
  const proxyUrl = resolveProxyUrl();
  if (!proxyUrl) {
    return withSourceMeta(mockKamis as KamisSeries, "demo");
  }

  try {
    const { data, status } = await axios.get(proxyUrl, {
      timeout: 8000,
      validateStatus: () => true,
    });
    if (status < 200 || status >= 300) {
      return withSourceMeta(mockKamis as KamisSeries, "demo");
    }
    const normalized = normalizeKamis(data);
    if (normalized.series.length === 0) {
      return withSourceMeta(mockKamis as KamisSeries, "demo");
    }
    return withSourceMeta(
      {
        ...normalized,
        volumeDerivedFromPrice: normalized.volumeDerivedFromPrice ?? true,
      },
      "kamis",
    );
  } catch {
    return withSourceMeta(mockKamis as KamisSeries, "demo");
  }
}
