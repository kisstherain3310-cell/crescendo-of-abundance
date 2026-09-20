/**
 * Shared KAMIS Open API client for periodProductList (방울토마토 도매).
 * Used by the Netlify Function proxy and by Next.js SSR when certs are in env.
 *
 * Honesty: KAMIS returns wholesale *price* only. `volume` in the series is an
 * abundance proxy derived from inverse price — not official 출하량.
 */

export type KamisUpstreamDay = {
  date: string;
  volume: number;
  price: number;
};

export type KamisUpstreamSeries = {
  item: string;
  itemCode: string;
  market: string;
  unit: string;
  priceUnit: string;
  volumeDerivedFromPrice: true;
  series: KamisUpstreamDay[];
  source: "kamis";
  updatedAt: string;
};

type KamisItemRow = {
  itemname?: string;
  kindname?: string;
  countyname?: string;
  marketname?: string;
  yyyy?: string;
  regday?: string;
  price?: string | number;
};

const KAMIS_ENDPOINT = "https://www.kamis.or.kr/service/price/xml.do";
const ITEM_CATEGORY = "200";
const ITEM_CODE = "225";
const PRODUCT_CLASS = "02";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parsePrice(raw: string | number | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "가격없음") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function rowDate(row: KamisItemRow): string | null {
  const yyyy = row.yyyy?.trim();
  const regday = row.regday?.trim();
  if (!yyyy || !regday) return null;
  const parts = regday.split(/[/\-.]/);
  if (parts.length < 2) return null;
  const mm = parts[0].padStart(2, "0");
  const dd = parts[1].padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function averageByDate(items: KamisItemRow[]): Array<{ date: string; price: number }> {
  const preferred = items.filter((r) => r.countyname?.trim() === "평균");
  const pool = preferred.length > 0 ? preferred : items;
  const buckets = new Map<string, number[]>();
  for (const row of pool) {
    const date = rowDate(row);
    const price = parsePrice(row.price);
    if (!date || price === null) continue;
    const list = buckets.get(date) ?? [];
    list.push(price);
    buckets.set(date, list);
  }
  return [...buckets.entries()]
    .map(([date, prices]) => ({
      date,
      price: prices.reduce((a, b) => a + b, 0) / prices.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function abundanceFromPrices(
  points: Array<{ date: string; price: number }>,
): KamisUpstreamDay[] {
  if (points.length === 0) return [];
  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const span = Math.max(maxP - minP, 1);
  return points.map((p) => {
    const t = (maxP - p.price) / span;
    return {
      date: p.date,
      volume: Math.round(50_000 + t * 150_000),
      price: Math.round(p.price),
    };
  });
}

export async function fetchPeriodProductTomato(certs: {
  certKey: string;
  certId: string;
}): Promise<KamisUpstreamSeries> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const params = new URLSearchParams({
    action: "periodProductList",
    p_cert_key: certs.certKey,
    p_cert_id: certs.certId,
    p_returntype: "json",
    p_startday: formatDate(start),
    p_endday: formatDate(end),
    p_productclscode: PRODUCT_CLASS,
    p_itemcategorycode: ITEM_CATEGORY,
    p_itemcode: ITEM_CODE,
    p_convert_kg_yn: "Y",
  });

  const upstream = await fetch(`${KAMIS_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!upstream.ok) {
    throw new Error(`kamis_http_${upstream.status}`);
  }

  const payload = (await upstream.json()) as {
    data?: {
      error_code?: string;
      item?: KamisItemRow[] | KamisItemRow;
    };
  };

  const errorCode = payload?.data?.error_code;
  if (errorCode && errorCode !== "000" && errorCode !== "0") {
    throw new Error(`kamis_error_${errorCode}`);
  }

  const rawItem = payload?.data?.item;
  const items: KamisItemRow[] = Array.isArray(rawItem)
    ? rawItem
    : rawItem
      ? [rawItem]
      : [];

  const averaged = averageByDate(items);
  if (averaged.length === 0) {
    throw new Error("kamis_no_data");
  }

  const series = abundanceFromPrices(averaged);
  const first = items.find((i) => i.itemname?.trim());

  return {
    item: first?.itemname?.trim() || "방울토마토",
    itemCode: ITEM_CODE,
    market: "KAMIS 도매(전국 평균)",
    unit: "kg",
    priceUnit: "원/kg",
    volumeDerivedFromPrice: true,
    series,
    source: "kamis",
    updatedAt: new Date().toISOString(),
  };
}
