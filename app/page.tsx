import { LandingClient } from "@/components/landing/LandingClient";
import { fetchTomatoSeries } from "@/lib/kamis";

/** Always hit the KAMIS proxy (or mock) at request time — never bake mock into static HTML when live keys exist. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const series = await fetchTomatoSeries();
  return <LandingClient series={series} />;
}
