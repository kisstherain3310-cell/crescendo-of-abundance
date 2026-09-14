import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function formatKg(volume: number) {
  return `${Math.round(volume).toLocaleString("ko-KR")} kg`;
}

export function formatWon(price: number) {
  return `${Math.round(price).toLocaleString("ko-KR")}원`;
}

/** ISO datetime or date → 24h `HH:MM` for HUD copy. No schema change. */
export function formatUpdatedClock(iso: string) {
  const fromIso = iso.match(/T(\d{2}):(\d{2})/);
  if (fromIso) return `${fromIso[1]}:${fromIso[2]}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "00:00";
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
