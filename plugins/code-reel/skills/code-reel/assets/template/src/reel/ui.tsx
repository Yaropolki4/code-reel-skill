import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { blink } from "./anim";
import { C, CODE_FS, CW, CY, H, MONO, Seg, segLen, TITLE, W } from "./theme";

const abs = (x: number, y: number): React.CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
});

// ---------- Фон и камера ----------

export const Background: React.FC<{ tone: number }> = ({ tone }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 60% at 50% 42%, ${C.red}40, transparent 70%)`,
        opacity: tone,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 40% at 50% 40%, ${C.deep}, transparent)`,
        opacity: 1 - tone,
      }}
    />
  </AbsoluteFill>
);

// Точечная сетка: экранный фон, который сдвигается и масштабируется вместе с камерой.
// Дешевле, чем огромный слой внутри мира.
const Grid: React.FC<{ tx: number; ty: number; s: number }> = ({ tx, ty, s }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(circle, #ffffff12 ${2 * s}px, transparent ${2.5 * s}px)`,
      backgroundSize: `${50 * s}px ${50 * s}px`,
      backgroundPosition: `${tx - 25 * s}px ${ty - 25 * s}px`,
    }}
  />
);

export type Cam = {
  fx: number;
  fy: number;
  s: number;
  kick?: { x: number; y: number; r: number; push: number };
  blurX?: number;
  offsetX?: number;
  // 0..1: цветовое расслоение и рывки по горизонтали
  glitch?: number;
  // кадр — для случайных рывков глитча
  seed?: number;
};

// Камера: точка мира (fx, fy) оказывается в центре полосы контента
export const Camera: React.FC<{
  cam: Cam;
  id: string;
  children: React.ReactNode;
}> = ({ cam, id, children }) => {
  const k = cam.kick ?? { x: 0, y: 0, r: 0, push: 0 };
  const s = cam.s * (1 + k.push * 0.012);
  const blur = cam.blurX ?? 0;
  const g = cam.glitch ?? 0;
  const jitter = g > 0.01 ? (random(`g${cam.seed ?? 0}`) - 0.5) * 30 * g : 0;
  const tx = W / 2 - cam.fx * s + k.x + (cam.offsetX ?? 0) + jitter;
  const ty = CY - cam.fy * s + k.y;
  return (
    <AbsoluteFill
      style={{ rotate: `${k.r}deg`, transformOrigin: `${W / 2}px ${CY}px` }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={`${blur} ${blur * 0.05}`} />
        </filter>
      </svg>
      <Grid tx={tx} ty={ty} s={s} />
      <div
        style={{
          ...abs(0, 0),
          width: W,
          height: H,
          transformOrigin: "0 0",
          translate: `${tx}px ${ty}px`,
          scale: String(s),
          filter:
            [
              blur > 0.5 ? `url(#${id})` : "",
              g > 0.01
                ? `drop-shadow(${10 * g}px 0 0 ${C.red}cc) drop-shadow(${-10 * g}px 0 0 #3DD6FFaa)`
                : "",
            ]
              .join(" ")
              .trim() || undefined,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ o: number; color?: string }> = ({
  o,
  color = C.accent,
}) => (o > 0.001 ? <AbsoluteFill style={{ background: color, opacity: o }} /> : null);

// ---------- Код ----------

export const Segs: React.FC<{ segs: Seg[]; chars?: number }> = ({
  segs,
  chars = Infinity,
}) => {
  let left = chars;
  return (
    <>
      {segs.map((s, i) => {
        if (left <= 0) return null;
        const part = s.t.slice(0, left);
        left -= part.length;
        return (
          <span key={i} style={{ color: s.c }}>
            {part}
          </span>
        );
      })}
    </>
  );
};

export const Code: React.FC<{
  x: number;
  y: number;
  segs: Seg[];
  chars?: number;
  fs?: number;
  caret?: boolean;
  t?: number;
  opacity?: number;
}> = ({ x, y, segs, chars = Infinity, fs = CODE_FS, caret, t = 0, opacity = 1 }) => {
  const shown = Math.min(chars, segLen(segs));
  return (
    <div
      style={{
        ...abs(x, y),
        fontFamily: MONO,
        fontSize: fs,
        fontWeight: 500,
        lineHeight: `${fs * 1.3}px`,
        whiteSpace: "pre",
        fontVariantLigatures: "none",
        opacity,
      }}
    >
      <Segs segs={segs} chars={chars} />
      {caret ? (
        <span
          style={{
            ...abs(shown * CW(fs), fs * 0.12),
            width: 4,
            height: fs * 1.06,
            background: C.accent,
            opacity: blink(t),
          }}
        />
      ) : null}
    </div>
  );
};

// Прямоугольник вокруг колонок c0..c1 строки кода
export const cols = (
  x: number,
  y: number,
  c0: number,
  c1: number,
  fs = CODE_FS,
  pad = 10,
) => ({
  x: x + c0 * CW(fs) - pad,
  y: y - pad * 0.6,
  w: (c1 - c0 + 1) * CW(fs) + pad * 2,
  h: fs * 1.3 + pad * 1.2,
});

// ---------- Акценты ----------

export const Box: React.FC<{
  r: { x: number; y: number; w: number; h: number };
  color: string;
  p: number;
  dashed?: boolean;
}> = ({ r, color, p, dashed }) =>
  p <= 0.01 ? null : (
    <div
      style={{
        ...abs(r.x, r.y),
        width: r.w,
        height: r.h,
        border: `5px ${dashed ? "dashed" : "solid"} ${color}`,
        borderRadius: 14,
        opacity: Math.min(1, p),
        scale: String(interpolate(p, [0, 1], [1.08, 1])),
        boxShadow: `0 0 32px ${color}99, inset 0 0 20px ${color}33`,
      }}
    />
  );

export const Strike: React.FC<{
  r: { x: number; y: number; w: number; h: number };
  p: number;
  color?: string;
}> = ({ r, p, color = C.red }) =>
  p <= 0.01 ? null : (
    <div
      style={{
        ...abs(r.x - 6, r.y + r.h / 2 - 5),
        width: (r.w + 12) * Math.min(1, p),
        height: 10,
        borderRadius: 6,
        background: color,
        rotate: "-4deg",
        transformOrigin: "0 50%",
        boxShadow: `0 0 24px ${color}`,
      }}
    />
  );

// Волнистое подчёркивание ошибки, как в редакторе
export const Squiggle: React.FC<{
  x: number;
  y: number;
  w: number;
  p: number;
}> = ({ x, y, w, p }) => {
  const d = Array.from({ length: Math.ceil(w / 12) + 1 }, (_, i) =>
    `${i === 0 ? "M" : "L"}${i * 12} ${i % 2 === 0 ? 2 : 10}`,
  ).join(" ");
  return p <= 0.01 ? null : (
    <div style={{ ...abs(x, y), width: w * Math.min(1, p), height: 14, overflow: "hidden" }}>
      <svg width={w} height={14}>
        <path d={d} stroke={C.red} strokeWidth={3.5} fill="none" />
      </svg>
    </div>
  );
};

// ---------- Карточки ----------

export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  file: string;
  dot?: string;
  fileColor?: string;
}> = ({ x, y, w, h, file, dot = C.orange, fileColor = C.text }) => (
  <div
    style={{
      ...abs(x, y),
      width: w,
      height: h,
      background: C.card,
      border: `2px solid ${C.stroke}`,
      borderRadius: 26,
      boxShadow: "0 40px 80px #00000080",
    }}
  >
    <div
      style={{
        ...abs(36, 0),
        height: 76,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 30,
        color: fileColor,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          background: dot,
          boxShadow: `0 0 12px ${dot}`,
        }}
      />
      {file}
    </div>
  </div>
);

// Подсветка строки кода
export const Band: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  p: number;
}> = ({ x, y, w, h, color, p }) =>
  p <= 0.01 ? null : (
    <div
      style={{
        ...abs(x, y),
        width: w,
        height: h,
        borderRadius: 10,
        background: `${color}2e`,
        borderLeft: `6px solid ${color}`,
        boxShadow: `0 0 ${24 * p}px ${color}44`,
        opacity: Math.min(1, p),
      }}
    />
  );

// Заголовок хука: слова впечатываются по очереди (words[i] — прогресс pop для слова)
export const Headline: React.FC<{
  y: number;
  lines: string[][];
  words: number[];
  colors?: string[];
  fs?: number;
}> = ({ y, lines, words, colors = [], fs = 88 }) => {
  let k = 0;
  return (
    <div
      style={{
        ...abs(0, y),
        width: W,
        textAlign: "center",
        fontFamily: TITLE,
        fontWeight: 800,
        fontSize: fs,
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
      }}
    >
      {lines.map((line, li) => (
        <div key={li}>
          {line.map((word, wi) => {
            const i = k++;
            const p = words[i] ?? 1;
            const color = colors[i] ?? C.text;
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  marginRight: wi < line.length - 1 ? "0.28em" : 0,
                  color,
                  opacity: Math.min(1, Math.max(0, p * 3)),
                  translate: `0px ${interpolate(p, [0, 1], [li === 0 ? -60 : 60, 0])}px`,
                  transformOrigin: "50% 60%",
                  textShadow: color === C.text ? undefined : `0 0 40px ${color}aa`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
