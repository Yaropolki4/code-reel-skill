import React from "react";
import { AbsoluteFill } from "remotion";
import { pop, ramp, shake, typing, useBlockTime } from "./anim";
import { cmd, out } from "./lines";
import { C } from "./theme";
import { Background, Box, Camera, Card, Code, cols, Headline } from "./ui";

// Шаблон блока. Блок = отрезок между склейками; внутри — сцены с непрерывной камерой.
// START — секунда начала блока в таймлайне; все удары ниже — в тех же глобальных секундах.
const START = 0;

const X = 110; // карточки на x = 110…970: соцсети срезают 20–30 px по бокам
const LX = X + 44;
const L0 = 760 + 104;

export const BlockExample: React.FC = () => {
  const t = useBlockTime(START);

  const cam = {
    // Камера стоит: без микрозумов и дрейфа (design.md, «Камера»)
    fx: 540,
    fy: 795,
    s: 1,
    kick: shake(t, [[1.2, 0.6]]),
  };

  return (
    <AbsoluteFill>
      <Background tone={0.4} />
      <Camera cam={cam} id="cam-example">
        {/* Заголовок хука — сразу: слова на 0.1 и 0.3 с, въезд 0.12 с; на кадре 0 его нет (петля) */}
        <Headline y={500} lines={[["ЗАГОЛОВОК"], ["ХУКА"]]} words={[0.1, 0.3].map((a) => ramp(t, a, a + 0.12))} colors={[C.text, C.red]} />
        <Card x={X} y={760} w={860} h={240} file="terminal" dot={C.muted} />
        <Code x={LX} y={L0} fs={40} segs={cmd("npm install")} chars={typing(t, [[1.0, 0], [1.4, 13]])} caret={t < 1.6} t={t} />
        <Box r={cols(LX, L0, 2, 12, 40)} color={C.accent} p={pop(t, 1.6)} />
        <Code x={LX} y={L0 + 72} fs={40} segs={out("added 1243 packages in 12s")} opacity={t >= 2.2 ? 1 : 0} />
      </Camera>
    </AbsoluteFill>
  );
};
