import { LandingClient } from "@/components/landing/LandingClient";
import { fetchTomatoSeries } from "@/lib/kamis";

export default async function Home() {
  const series = await fetchTomatoSeries();
  return <LandingClient series={series} />;
}
