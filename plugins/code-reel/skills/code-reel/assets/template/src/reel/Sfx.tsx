import React from "react";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

// Озвучка и звуки. Звуки сведены заранее в одну дорожку (python3 scripts/mix_sfx.py) и приглушены под голосом.
// Пока озвучки нет — HAS_VOICE = false. Пока звуки не сведены — HAS_SFX = false.
const HAS_VOICE = false;
const HAS_SFX = false;

export const Sfx: React.FC = () => (
  <>
    {HAS_VOICE ? <Audio src={staticFile("voice.wav")} volume={1} /> : null}
    {HAS_SFX ? <Audio src={staticFile("sfx.wav")} volume={HAS_VOICE ? 0.45 : 0.8} /> : null}
  </>
);
