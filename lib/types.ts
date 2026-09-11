export type KamisDay = {
  date: string;
  volume: number;
  price: number;
};

export type KamisSeries = {
  item: string;
  itemCode?: string;
  market?: string;
  unit: string;
  priceUnit: string;
  series: KamisDay[];
};

export type PhysicsConfig = {
  bodyCount: number;
  gravity: number;
  restitution: number;
  dropRatio: number;
  day: KamisDay;
  item: string;
  unit: string;
  priceUnit: string;
};

export type TomatoSwatch = {
  id: string;
  highlight: string;
  mid: string;
  shadow: string;
  calyx: string;
  spark: string;
};

export type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  servings: string;
  whyNow: string;
  ingredients: string[];
  steps: string[];
};

export const BODY_COUNT_MIN = 18;
export const BODY_COUNT_MAX = 110;
