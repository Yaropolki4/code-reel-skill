// Распознаёт озвучку и сохраняет тайминги слов: node scripts/transcribe.mts
import { registerMediabunnyServer } from "@mediabunny/server";
import {
  WHISPER_WEBGPU_SAMPLE_RATE,
  canUseWhisperWebGpu,
  downloadWhisperModel,
  loadWhisperModel,
  toCaptions,
  transcribe,
} from "@remotion/whisper-webgpu";
import { ALL_FORMATS, Conversion, FilePathSource, Input, NullTarget, Output, WavOutputFormat } from "mediabunny";
import { writeFile } from "node:fs/promises";

const SRC = "public/voice.wav";
const OUT = "src/reel/voice-captions.json";
const model = "large-v3-turbo";

registerMediabunnyServer();

const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);

const chunks: { startFrame: number; waveform: Float32Array }[] = [];
const input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(SRC) });
const audioTrack = await input.getPrimaryAudioTrack();
if (audioTrack === null) throw new Error("Нет аудиодорожки");

const conversion = await Conversion.init({
  input,
  output: new Output({ format: new WavOutputFormat(), target: new NullTarget() }),
  video: { discard: true },
  audio: (track) => {
    if (track.id !== audioTrack.id) return { discard: true };
    return {
      codec: "pcm-f32",
      forceTranscode: true,
      numberOfChannels: 1,
      sampleFormat: "f32",
      sampleRate: WHISPER_WEBGPU_SAMPLE_RATE,
      process: (sample) => {
        const waveform = new Float32Array(sample.allocationSize({ format: "f32", planeIndex: 0 }) / Float32Array.BYTES_PER_ELEMENT);
        sample.copyTo(waveform, { format: "f32", planeIndex: 0 });
        chunks.push({ startFrame: Math.round(sample.timestamp * WHISPER_WEBGPU_SAMPLE_RATE), waveform });
        return sample;
      },
    };
  },
});
if (!conversion.isValid) throw new Error("Не удалось декодировать аудио");
await conversion.execute();

const length = chunks.reduce((m, c) => Math.max(m, c.startFrame + c.waveform.length), 0);
const channelWaveform = new Float32Array(length);
for (const c of chunks) {
  const dst = Math.max(0, c.startFrame);
  const src = Math.max(0, -c.startFrame);
  const n = Math.min(c.waveform.length - src, channelWaveform.length - dst);
  if (n > 0) channelWaveform.set(c.waveform.subarray(src, src + n), dst);
}

await downloadWhisperModel({ model });
const handle = await loadWhisperModel({ model });
const transcription = await transcribe({ channelWaveform, model, language: "ru" });
const { captions } = toCaptions({ whisperWebGpuOutput: transcription });
await handle[Symbol.asyncDispose]?.();
input.dispose();
await writeFile(OUT, JSON.stringify(captions, null, 2));
console.log(`${captions.length} слов → ${OUT}`);
