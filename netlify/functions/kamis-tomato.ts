import type { Config, Context } from "@netlify/functions";
import { fetchPeriodProductTomato } from "../../lib/kamisUpstream";

/**
 * Proxies KAMIS Open API `periodProductList` (일별 품목별 도·소매가격).
 * Credentials stay server-side via Netlify.env — never shipped to the browser.
 *
 * Honesty note: KAMIS returns wholesale *price* only. Abundance visualization
 * (tomato body count) is derived from price drop on the client/server mapper.
 */

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

  try {
    const body = await fetchPeriodProductTomato({ certKey, certId });
    return Response.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = message.includes("no_data") ? 404 : 502;
    return Response.json({ error: "proxy_failed", message }, { status });
  }
};

export const config: Config = {
  path: "/api/kamis/tomato",
  method: ["GET", "OPTIONS"],
};
