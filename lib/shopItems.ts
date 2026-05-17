export interface CircleThemeData {
  bg: string;
  inner: string;
  stroke: string;
  tickMajor: string;
  tickMinor: string;
  label: string;
  hint: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "circle_theme" | "badge";
  preview: string; // emoji or color hex for preview
  data: string;    // JSON string
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── 뱃지 ──────────────────────────────────────────────
  {
    id: "badge_star",
    name: "⭐ 스타",
    description: "이름 옆에 별이 빛납니다",
    price: 200,
    type: "badge",
    preview: "⭐",
    data: "⭐",
  },
  {
    id: "badge_fire",
    name: "🔥 파이어",
    description: "열정 넘치는 당신에게",
    price: 300,
    type: "badge",
    preview: "🔥",
    data: "🔥",
  },
  {
    id: "badge_crown",
    name: "👑 왕관",
    description: "그룹의 왕",
    price: 500,
    type: "badge",
    preview: "👑",
    data: "👑",
  },
  {
    id: "badge_diamond",
    name: "💎 다이아",
    description: "최고 등급 뱃지",
    price: 800,
    type: "badge",
    preview: "💎",
    data: "💎",
  },
  {
    id: "badge_cat",
    name: "🐱 고양이",
    description: "귀여운 고양이",
    price: 200,
    type: "badge",
    preview: "🐱",
    data: "🐱",
  },

  // ── 원형 테마 ─────────────────────────────────────────
  {
    id: "theme_ocean",
    name: "🌊 오션 블루",
    description: "시원한 바다색 시간표",
    price: 300,
    type: "circle_theme",
    preview: "#0a4a7e",
    data: JSON.stringify({
      bg: "#0a1628",
      inner: "#060e1a",
      stroke: "#1a3a5e",
      tickMajor: "#2a6aae",
      tickMinor: "#1a3a5e",
      label: "#6ab0de",
      hint: "#4a80ae",
    } satisfies CircleThemeData),
  },
  {
    id: "theme_sunset",
    name: "🌅 선셋",
    description: "따뜻한 노을빛 시간표",
    price: 300,
    type: "circle_theme",
    preview: "#c04a10",
    data: JSON.stringify({
      bg: "#1e0e04",
      inner: "#140804",
      stroke: "#5e2a10",
      tickMajor: "#ae5a20",
      tickMinor: "#5e2a10",
      label: "#de8a4a",
      hint: "#ae5a20",
    } satisfies CircleThemeData),
  },
  {
    id: "theme_forest",
    name: "🌲 포레스트",
    description: "싱그러운 숲속 분위기",
    price: 500,
    type: "circle_theme",
    preview: "#1a6a2a",
    data: JSON.stringify({
      bg: "#0a1e0c",
      inner: "#061208",
      stroke: "#1a4a1e",
      tickMajor: "#2a8a3a",
      tickMinor: "#1a4a1e",
      label: "#6ade8a",
      hint: "#4aae5a",
    } satisfies CircleThemeData),
  },
  {
    id: "theme_neon",
    name: "⚡ 네온",
    description: "강렬한 네온 사이버펑크",
    price: 700,
    type: "circle_theme",
    preview: "#cc00ff",
    data: JSON.stringify({
      bg: "#0a0010",
      inner: "#060008",
      stroke: "#3a005a",
      tickMajor: "#cc00ff",
      tickMinor: "#6600aa",
      label: "#ff66ff",
      hint: "#cc00ff",
    } satisfies CircleThemeData),
  },
  {
    id: "theme_gold",
    name: "✨ 미드나이트 골드",
    description: "고급스러운 다크 골드",
    price: 1000,
    type: "circle_theme",
    preview: "#c8a000",
    data: JSON.stringify({
      bg: "#100e00",
      inner: "#080600",
      stroke: "#3a3000",
      tickMajor: "#c8a000",
      tickMinor: "#6a5800",
      label: "#f0d050",
      hint: "#c8a000",
    } satisfies CircleThemeData),
  },
];

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export const REFERRAL_REWARD_REFERRER = 1000;
export const REFERRAL_REWARD_NEW_USER = 500;
