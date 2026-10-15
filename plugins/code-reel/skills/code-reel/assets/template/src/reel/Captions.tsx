import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import captions from "./captions.json";
import { FPS } from "./anim";
import { C, MONO, TITLE } from "./theme";

// Субтитры по озвучке. Слова и экраны — в captions.json (pageBreakAfter: новый экран после слова).
// Стоят в верхней части нижней зоны: выше подписи и кнопок приложения, правый край свободен.

type Word = { text: string; startMs: number; endMs: number; code?: boolean; pageBreakAfter?: boolean };

const WORDS = captions as Word[];
const PAGES: Word[][] = [];
{
  let cur: Word[] = [];
  for (const w of WORDS) {
    cur.push(w);
    if (w.pageBreakAfter) {
      PAGES.push(cur);
      cur = [];
    }
  }
  if (cur.length) PAGES.push(cur);
}

const TOP = 1400;
const WIDTH = 820;
const FS = 50;

export const Captions: React.FC = () => {
  const ms = (useCurrentFrame() / FPS) * 1000;
  const idx = PAGES.findIndex((p, i) => ms >= p[0].startMs && (i === PAGES.length - 1 || ms < PAGES[i + 1][0].startMs));
  if (idx < 0) return null;
  const page = PAGES[idx];
  const sinceStart = ms - page[0].startMs;
  const enter = interpolate(sinceStart, [0, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: TOP,
          left: (1080 - WIDTH) / 2,
          width: WIDTH,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "0.32em",
          fontFamily: TITLE,
          fontWeight: 800,
          fontSize: FS,
          lineHeight: 1.25,
          color: C.text,
          textShadow: "0 4px 18px #000000e0, 0 0 2px #000",
          opacity: enter,
          scale: String(interpolate(enter, [0, 1], [0.92, 1])),
        }}
      >
        {page.map((w, i) => {
          const next = page[i + 1]?.startMs ?? w.endMs + 250;
          const active = ms >= w.startMs && ms < next;
          return (
            <span
              key={i}
              style={{
                fontFamily: w.code ? MONO : TITLE,
                fontWeight: w.code ? 700 : 800,
                color: active ? C.accent : w.code ? C.orange : C.text,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
