import type { TomatoSwatch } from "@/lib/types";

export const TOMATO_PALETTE: TomatoSwatch[] = [
  {
    id: "crimson",
    highlight: "#ff8a72",
    mid: "#e23a2b",
    shadow: "#8a1210",
    calyx: "#2f6b28",
    spark: "#ffd7c4",
  },
  {
    id: "scarlet",
    highlight: "#ff7a63",
    mid: "#d61f1a",
    shadow: "#7a0d12",
    calyx: "#245c22",
    spark: "#ffe1d0",
  },
  {
    id: "ruby",
    highlight: "#ff6f7a",
    mid: "#c81d3b",
    shadow: "#6d1024",
    calyx: "#1f5a2b",
    spark: "#ffcfd6",
  },
  {
    id: "sunset",
    highlight: "#ffb07a",
    mid: "#f26b2b",
    shadow: "#9a3412",
    calyx: "#3b6d27",
    spark: "#ffe4c8",
  },
  {
    id: "amber",
    highlight: "#ffd27a",
    mid: "#f0a202",
    shadow: "#a15c00",
    calyx: "#3a7224",
    spark: "#fff1c9",
  },
  {
    id: "gold",
    highlight: "#fff0a8",
    mid: "#f5c518",
    shadow: "#b45309",
    calyx: "#2f6a22",
    spark: "#fff8d6",
  },
  {
    id: "blush",
    highlight: "#ff9d8a",
    mid: "#ef4444",
    shadow: "#9f1239",
    calyx: "#276749",
    spark: "#ffd6cc",
  },
];

export function swatchAt(index: number): TomatoSwatch {
  return TOMATO_PALETTE[index % TOMATO_PALETTE.length];
}

export function randomSwatch(seed: number): TomatoSwatch {
  const i = Math.abs(Math.floor(seed * 9301 + 49297)) % TOMATO_PALETTE.length;
  return TOMATO_PALETTE[i];
}
