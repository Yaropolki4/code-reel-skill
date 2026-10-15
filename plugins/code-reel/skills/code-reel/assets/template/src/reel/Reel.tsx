import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { blockFrom } from "./anim";
import { BlockExample } from "./BlockExample";
import { Captions } from "./Captions";
import { Sfx } from "./Sfx";
import { C } from "./theme";

// Блоки идут подряд; длительность — из границ таймлайна, переведённых картой timewarp.json в секунды озвучки.
// Границы блоков = START в файлах блоков.
export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Series>
      <Series.Sequence name="Пример" durationInFrames={blockFrom(30) - blockFrom(0)}>
        <BlockExample />
      </Series.Sequence>
    </Series>
    <Sfx />
    <Captions />
  </AbsoluteFill>
);
