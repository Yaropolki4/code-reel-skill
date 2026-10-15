import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadTitleFont } from "@remotion/google-fonts/Inter";

export const { fontFamily: MONO } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin", "cyrillic"],
});

// Заголовок хука и субтитры: жирный гротеск с кириллицей. Свой шрифт — замените импорт и вес.
export const { fontFamily: TITLE } = loadTitleFont("normal", {
  weights: ["800"],
  subsets: ["latin", "cyrillic"],
});

// Палитра. Поменяйте под свой канал: accent — главный акцент (выделение, промпт $, текущее слово субтитров).
export const C = {
  bg: "#0A0A0F",
  card: "#141518",
  stroke: "#22232B",
  popup: "#1B1C23",
  text: "#EDEDF2",
  sec: "#C9C9D4",
  muted: "#6B6B7A",
  accent: "#4C8DFF",
  green: "#3DDC84",
  orange: "#F5A524",
  red: "#FF5A3C",
  violet: "#9A95AD",
  deep: "#0F101A",
};

export const W = 1080;
export const H = 1920;
// Центр полосы контента 230–1360 px
export const CY = 795;

// JetBrains Mono: ширина символа 0.6em
export const CW = (fs: number) => fs * 0.6;
export const CODE_FS = 42;
export const LH = 88;

export type Seg = { t: string; c: string };

export const segLen = (segs: Seg[]) =>
  segs.reduce((n, s) => n + s.t.length, 0);
