import warp from "./timewarp.json";
import { Easing, interpolate, spring, useCurrentFrame } from "remotion";

export const FPS = 30;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);

// 0→1 за отрезок [a, b]
export const ramp = (t: number, a: number, b: number, easing = outExpo) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing });

export const fadeOut = (t: number, a: number, d = 0.2) =>
  1 - ramp(t, a, a + d);

// Пружинящее появление, может перелетать за 1
// Мягкое появление: пружина почти без перелёта, ~0.35 с
export const pop = (t: number, a: number, damping = 18) =>
  t < a
    ? 0
    : spring({
        frame: (t - a) * FPS,
        fps: FPS,
        config: { damping, stiffness: 170, mass: 0.7 },
      });

// Набор текста: ключи [время, число символов]
export const typing = (t: number, keys: [number, number][]) =>
  Math.floor(
    interpolate(
      t,
      keys.map((k) => k[0]),
      keys.map((k) => k[1]),
      clamp,
    ),
  );

// Плавная дорожка камеры: ключи [время, значение]
export const track = (t: number, keys: [number, number][], easing = inOut) =>
  interpolate(
    t,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { ...clamp, easing },
  );

export const blink = (t: number) => (Math.floor(t * 2.4) % 2 === 0 ? 1 : 0);

// Толчок камеры: лёгкие затухающие колебания и импульс наезда (амплитуды общие для всех сцен)
export const shake = (t: number, kicks: [number, number][]) => {
  let x = 0;
  let y = 0;
  let r = 0;
  let push = 0;
  for (const [a, amp] of kicks) {
    if (t < a) continue;
    const d = t - a;
    const env = amp * Math.exp(-d * 9);
    x += env * Math.sin(d * 38) * 5;
    y += env * Math.sin(d * 47 + 1) * 4;
    r += env * Math.sin(d * 31) * 0.12;
    push += env;
  }
  return { x, y, r, push };
};

// ---------- Синхронизация с озвучкой ----------
// Блоки размечены в «старых» секундах таймлайна; карта timewarp.json переводит их в секунды озвучки.

const OLD = warp.anchors.map((a) => a[0]);
const NEW = warp.anchors.map((a) => a[1]);

export const toNew = (old: number) => interpolate(old, OLD, NEW, clamp);
export const toOld = (t: number) => interpolate(t, NEW, OLD, clamp);
// Первый блок начинается с кадра 0: до первого слова (0.1 с) карта держит стартовый кадр
export const blockFrom = (oldStart: number) => (oldStart <= 0 ? 0 : Math.round(toNew(oldStart) * FPS));

// Время блока в старых секундах: кадр внутри блока → секунда озвучки → секунда таймлайна
export const useBlockTime = (oldStart: number) => {
  const frame = useCurrentFrame();
  return toOld((blockFrom(oldStart) + frame) / FPS);
};
