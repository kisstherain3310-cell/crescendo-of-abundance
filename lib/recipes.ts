import type { Recipe } from "@/lib/types";

export const OVERSUPPLY_RECIPES: Recipe[] = [
  {
    id: "burst-pasta",
    title: "과잉 파스타",
    subtitle: "터지는 방울토마토 오일 스파게티",
    time: "18분",
    servings: "2인분 · 토마토 40알",
    whyNow: "가격이 무너진 날엔 소스보다 과육이 주인공입니다. 많이 넣고, 더 많이 터뜨리세요.",
    ingredients: [
      "방울토마토 40알",
      "스파게티 200g",
      "마늘 4쪽",
      "엑스트라 버진 올리브오일 6큰술",
      "소금, 후추, 바질",
    ],
    steps: [
      "팬에 오일과 편마늘을 약불로 향만 올립니다.",
      "방울토마토를 한꺼번에 넣고 껍질이 갈라질 때까지 볶습니다.",
      "삶은 면을 넣고 과육 국물과 함께 30초 더 섞습니다.",
      "바질을 찢어 뿌리고, 과잉의 신맛을 그대로 냅니다.",
    ],
  },
  {
    id: "cold-crush",
    title: "서리 카프레제",
    subtitle: "차가운 과잉을 한입에",
    time: "10분",
    servings: "4인분 · 토마토 30알",
    whyNow: "산지 출하가 정점을 찍은 날은 가열보다 생식이 정답입니다.",
    ingredients: [
      "방울토마토 30알",
      "부라타 또는 모차렐라 1개",
      "바질 한 줌",
      "발사믹 글레이즈",
      "꽃소금",
    ],
    steps: [
      "토마토를 반으로 갈라 따뜻한 간을 합니다.",
      "치즈를 가운데 두고 과육을 무너뜨리듯 올립니다.",
      "바질과 글레이즈로 단면을 그립니다.",
      "차갑게, 그러나 서둘러 먹습니다.",
    ],
  },
  {
    id: "jam-crash",
    title: "폭락 잼",
    subtitle: "남는 단맛을 병에 가둡니다",
    time: "45분",
    servings: "340ml 2병",
    whyNow: "시세가 바닥일 때 저장은 소비의 연장입니다. 내일의 식탁을 오늘 사두세요.",
    ingredients: [
      "방울토마토 1kg",
      "설탕 280g",
      "레몬즙 2큰술",
      "월계수 잎 1장",
      "소금 한 꼬집",
    ],
    steps: [
      "토마토를 살짝 짓이겨 설탕과 30분 재웁니다.",
      "중불에서 거품이 잦아들 때까지 끓입니다.",
      "레몬과 월계수로 산미를 고정합니다.",
      "뜨거울 때 병에 담고 뚜껑을 닫아 과잉을 봉인합니다.",
    ],
  },
  {
    id: "pan-confit",
    title: "대지의 콩피",
    subtitle: "느린 불에 맡긴 방울토마토",
    time: "40분",
    servings: "3~4인분",
    whyNow: "물량이 중력처럼 내려앉는 날, 천천히 익히면 단맛이 남습니다.",
    ingredients: [
      "방울토마토 500g",
      "올리브오일 200ml",
      "타임, 로즈마리",
      "통마늘 6쪽",
      "고추 한 개",
    ],
    steps: [
      "오븐 140°C, 팬에 모든 재료를 잠기듯 담습니다.",
      "껍질이 주름질 때까지 35분 굽습니다.",
      "오일은 따로 두고 다음 과잉에도 씁니다.",
      "빵에 올려 무너지는 가격을 맛으로 받칩니다.",
    ],
  },
];

export function recipeForSeed(seed: number): Recipe {
  const index = Math.abs(Math.floor(seed)) % OVERSUPPLY_RECIPES.length;
  return OVERSUPPLY_RECIPES[index];
}
