import type { Config, Context } from "@netlify/functions";

/**
 * Proxies KAMIS Open API `periodProductList` (일별 품목별 도·소매가격).
 * Credentials stay server-side via Netlify.env — never shipped to the browser.
 *
 * Honesty note: KAMIS returns wholesale *price* only. Abundance visualization
 * (tomato body count) is derived from price drop on the client/server mapper.
 */

const KAMIS_ENDPOINT =
  "https://www.kamis.or.kr/service/price/xml.do";

/** 채소류 */
const ITEM_CATEGORY = "200";
/** 방울토마토 */
const ITEM_CODE = "225";
/** 도매 */
const PRODUCT_CLASS = "02";

type KamisItemRow = {
  itemname?: string;
  kindname?: string;
  countyname?: string;
  marketname?: string;
  yyyy?: string;
  regday?: string;
  price?: string | number;
};

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
  // regday is typically "MM/DD"
  const parts = regday.split(/[/\-.]/);
  if (parts.length < 2) return null;
  const mm = parts[0].padStart(2, "0");
  const dd = parts[1].padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function averageByDate(items: KamisItemRow[]): Array<{ date: string; price: number }> {
  // Prefer national average rows when present
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

/**
 * Inverse-price abundance proxy for HUD "풍요지수".
 * Lower price → higher index. Not a real shipment volume from KAMIS.
 */
function abundanceFromPrices(
  points: Array<{ date: string; price: number }>,
): Array<{ date: string; volume: number; price: number }> {
  if (points.length === 0) return [];
  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const span = Math.max(maxP - minP, 1);
  return points.map((p) => {
    const t = (maxP - p.price) / span; // 0 at peak price, 1 at trough
    const volume = Math.round(50_000 + t * 150_000);
    return { date: p.date, volume, price: Math.round(p.price) };
  });
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const certKey = Netlify.env.get("KAMIS_CERT_KEY");
  const certId = Netlify.env.get("KAMIS_CERT_ID");

  if (!certKey || !certId) {
    return Response.json(
      {
        error: "missing_credentials",
        message:
          "Set KAMIS_CERT_KEY and KAMIS_CERT_ID in Netlify environment variables.",
      },
      { status: 503 },
    );
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const params = new URLSearchParams({
    action: "periodProductList",
    p_cert_key: certKey,
    p_cert_id: certId,
    p_returntype: "json",
    p_startday: formatDate(start),
    p_endday: formatDate(end),
    p_productclscode: PRODUCT_CLASS,
    p_itemcategorycode: ITEM_CATEGORY,
    p_itemcode: ITEM_CODE,
    p_convert_kg_yn: "Y",
  });

  try {
    const upstream = await fetch(`${KAMIS_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "upstream_http", status: upstream.status },
        { status: 502 },
      );
    }

    const payload = (await upstream.json()) as {
      data?: {
        error_code?: string;
        item?: KamisItemRow[] | KamisItemRow;
      };
    };

    const errorCode = payload?.data?.error_code;
    if (errorCode && errorCode !== "000" && errorCode !== "0") {
      return Response.json(
        { error: "kamis_error", code: errorCode },
        { status: 502 },
      );
    }

    const rawItem = payload?.data?.item;
    const items: KamisItemRow[] = Array.isArray(rawItem)
      ? rawItem
      : rawItem
        ? [rawItem]
        : [];

    const averaged = averageByDate(items);
    if (averaged.length === 0) {
      return Response.json({ error: "no_data" }, { status: 404 });
    }

    const series = abundanceFromPrices(averaged);
    const first = items.find((i) => i.itemname?.trim());

    const body = {
      item: first?.itemname?.trim() || "방울토마토",
      itemCode: ITEM_CODE,
      market: "KAMIS 도매(전국 평균)",
      unit: "kg",
      priceUnit: "원/kg",
      // volume here is an abundance proxy derived from price — not KAMIS 출하량.
      volumeDerivedFromPrice: true,
      series,
      source: "kamis",
      updatedAt: new Date().toISOString(),
    };

    return Response.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return Response.json(
      { error: "proxy_failed", message },
      { status: 502 },
    );
  }
};

export const config: Config = {
  path: "/api/kamis/tomato",
  method: ["GET", "OPTIONS"],
};
