"""Сводит звуки рилса в одну дорожку public/sfx.wav.

Движок общий для всех роликов. События ролика — в scripts/sfx_cues.py (функция build).
Сэмплы — Mixkit (бесплатная лицензия, mixkit.co/license), скачиваются scripts/fetch_sfx.sh в sfx-src/wav/mk<id>.wav.
Время событий — секунды таймлайна блоков; карта src/reel/timewarp.json переводит их в секунды озвучки
(без озвучки или если блоки уже размечены по словам — карта тождественная).
Запуск: python3 scripts/mix_sfx.py
"""
import json
import os
import sys
import wave

import numpy as np

SR = 44100
FPS = 30
ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "sfx-src", "wav")
OUT = os.path.join(ROOT, "public", "sfx.wav")
VOICE = os.path.join(ROOT, "public", "voice.wav")

# ---------- Библиотека: роль → id звука Mixkit ----------
# Новую роль добавляйте сюда и в fetch_sfx.sh.
LIB = {
    "enter": 2542,  # Hard single key press in a laptop
    "click": 1117,  # Classic click — мелкий элемент появился
    "tick": 2580,  # Light button — рамка-выделение
    "pop": 2356,  # Dry pop up notification alert — всплывающее окно, чип
    "swoosh-short": 3115,  # Fast transitions swoosh — рывок, наезд
    "swoosh-mid": 166,  # Fast small sweep transition — въезд блока
    "swoosh-long": 1489,  # Air woosh — плавный пан, отъезд
    "whip": 1492,  # Cinematic whoosh fast transition — хлыст (anchor="peak" на склейку)
    "riser": 790,  # Cinematic trailer riser — нагнетание перед ударом
    "bass": 2299,  # Short bass hit — удар / мягкий тамп (тише)
    "impact": 1143,  # Cinematic whoosh deep impact — смэш-кат (offset=0.5, чтобы начать с удара)
    "error": 1110,  # Click error — ошибка в рантайме
    "error-soft": 2569,  # Negative tone interface tap — подчёркивание, «нет»
    "ding-small": 2867,  # Confirmation tone — зелёная рамка, галочка, «аппрув» (лесенкой через pitch)
    "marker": 2369,  # Writing scribble on paper — зачёркивание
    "paper": 2996,  # Quick paper crumple sound — выбросить код
    "rewind": 1092,  # Fast tape rewind cinematic transition — перемотка (offset≈1.1)
    "rewind-glitch": 1093,  # Glitch sci fi rewind transition — перемотка в петлю
    "fail": 2947,  # Tech break fail — шаг упал
    "stamp": 2995,  # Stapling paper — штамп, бейдж
    "glitch": 2951,  # Digital glitch break
    "lock": 2859,  # Computer digital lock — что-то закрылось/скрыто
    "buzz": 2594,  # Electric buzz glitch — мерцание
    "glass": 759,  # Glass break with hammer thud — трещина (dur=0.1) и разлёт (целиком)
    "counter": 1053,  # Ticking counter — счётчик (offset=0.1, dur=0.5, громче)
    "zip": 3120,  # Technology transition slide — линия-связка
    "data": 3122,  # Technology computer calculations — бегут строки (offset=0.49, dur=0.35)
    "pulse": 490,  # Human single heart beat — пульсация (dur=0.25)
    "hum": 2297,  # Bass rumble hum — подложка в «красных» сценах
    "notify": 2354,  # Message pop alert — пуш-уведомление
}
# Сколько секунд звука оставлять перед пиком, если anchor="peak" (lead по умолчанию для роли).
# У хлыста разгон ~0.7 с: целиком он залезает на предыдущую сцену.
DEFAULT_LEAD = {"whip": 0.3}
TYPING_SRC = 2531  # Typing on a laptop keyboard — режем на отдельные нажатия
BACKSPACE_SRC = 2539  # Laptop backspace typing sequence

_anchors = json.load(open(os.path.join(ROOT, "src", "reel", "timewarp.json")))["anchors"]
_old = [a[0] for a in _anchors]
_new = [a[1] for a in _anchors]


def to_new(old):
    return float(np.interp(old, _old, _new))


def read(id_):
    with wave.open(os.path.join(SRC, f"mk{id_}.wav")) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


def repitch(x, semitones):
    if semitones == 0:
        return x
    k = 2 ** (semitones / 12)
    return np.interp(np.arange(0, len(x) - 1, k), np.arange(len(x)), x)


def slice_hits(id_, count, length=0.09):
    """Вырезает из записи отдельные нажатия клавиш одинаковой громкости."""
    x = read(id_)
    hop = int(SR * 0.005)
    env = np.array([np.abs(x[i : i + hop]).max() for i in range(0, len(x) - hop, hop)])
    thr = env.max() * 0.25
    hits = []
    i = 1
    while i < len(env):
        if env[i] > thr and env[i - 1] <= thr:
            start = max(0, i * hop - int(SR * 0.004))
            seg = x[start : start + int(SR * length)]
            hits.append((np.abs(seg).max(), seg))
            i += int(0.12 * SR / hop)
        i += 1
    hits.sort(key=lambda h: h[0])
    mid = hits[len(hits) // 4 : len(hits) // 4 + count]
    out = []
    for _, seg in mid:
        seg = seg.copy()
        fade = int(SR * 0.02)
        seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(norm(seg))
    return out


KEYS = slice_hits(TYPING_SRC, 8)
BACKSPACES = slice_hits(BACKSPACE_SRC, 6)
_cache = {}


def sample(role):
    if role not in _cache:
        _cache[role] = norm(read(LIB[role]))
    return _cache[role]


cues = []


def cue(at, role, vol, anchor="onset", dur=None, offset=0.0, pitch=0, fade_in=0.0, fade_out=0.15, lead=None):
    """at — секунда таймлайна; anchor: "onset" — начало звука на at, "peak" — самая громкая точка на at.
    offset/dur — какой кусок сэмпла взять; pitch — полутона; fade_in/fade_out — секунды.
    lead — только для anchor="peak": сколько секунд звука оставить перед пиком (разгон обрезается с коротким fade-in)."""
    if lead is None:
        lead = DEFAULT_LEAD.get(role)
    cues.append(dict(at=at, x=sample(role), vol=vol, anchor=anchor, dur=dur, offset=offset, pitch=pitch, fade_in=fade_in, fade_out=fade_out, lead=lead, typing=False))


def typing(t0, t1, chars, back=False, vol=0.32, max_rate=14):
    """Клики печати (или backspace) на отрезке [t0, t1], не чаще max_rate в секунду."""
    pool = BACKSPACES if back else KEYS
    n = max(1, min(chars, round((t1 - t0) * max_rate) + 1))
    for k in range(n):
        at = t0 + (t1 - t0) * (k + 0.5) / n
        h = (round(at * 1000) * 7919) % 1000 / 1000
        cues.append(dict(at=at, x=pool[int(h * len(pool))], vol=vol * (0.8 + 0.4 * h), anchor="onset", dur=None, offset=0.0, pitch=0, fade_in=0.0, fade_out=0.0, lead=None, typing=True))


def duck_gain(n):
    """Сайдчейн: под голосом звуки тише на ~45%, в паузах — полная громкость."""
    if not os.path.exists(VOICE):
        return np.ones(n)
    with wave.open(VOICE) as w:
        ch, sr = w.getnchannels(), w.getframerate()
        v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    v = np.abs(v.reshape(-1, ch).mean(axis=1))
    v = np.interp(np.arange(n) * sr / SR, np.arange(len(v)), v)
    hop = int(SR * 0.01)
    env = np.array([v[i : i + hop].mean() for i in range(0, n, hop)])
    env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
    out = np.zeros_like(env)
    g = 0.0
    for i, e in enumerate(env):
        g = e if e > g else g * 0.86
        out[i] = g
    return np.repeat(1 - 0.45 * out, hop)[:n]


def main():
    sys.path.insert(0, os.path.dirname(__file__))
    import sfx_cues

    duration = sfx_cues.DURATION
    sfx_cues.build(cue, typing)
    pad = int(SR * 1.5)
    mix = np.zeros(pad + int(SR * (duration + 3)))
    accents = [to_new(c["at"]) for c in cues if not c["typing"]]
    for c in cues:
        at_old = c["at"]
        c["at"] = to_new(at_old)
        x = repitch(c["x"], c["pitch"])[int(SR * c["offset"]) :]
        if c["dur"] is not None:
            dur = to_new(at_old + c["dur"]) - c["at"] if c["dur"] > 1 else c["dur"]
            x = x[: int(SR * dur)]
        x = x.copy()
        lead_ref = None
        if c["lead"] is not None and c["anchor"] == "peak":
            pk = int(np.argmax(np.abs(x)))
            cut = max(0, pk - int(SR * c["lead"]))
            x = x[cut:].copy()
            k = min(len(x), int(SR * 0.05))
            x[:k] *= np.linspace(0, 1, k)
            lead_ref = pk - cut
        if c["fade_in"] > 0:
            k = min(len(x), int(SR * c["fade_in"]))
            x[:k] *= np.linspace(0, 1, k)
        if c["dur"] is not None and c["fade_out"] > 0:
            k = min(len(x), int(SR * c["fade_out"]))
            x[-k:] *= np.linspace(1, 0, k)
        vol = c["vol"]
        if c["typing"] and any(abs(c["at"] - a) < 0.12 for a in accents):
            vol *= 0.5
        ref = int(np.argmax(np.abs(x))) if c["anchor"] == "peak" else int(np.argmax(np.abs(x) > 0.05))
        if c["offset"] > 0 or c["fade_in"] > 0:
            ref = 0
        if lead_ref is not None:
            ref = lead_ref
        start = max(0, pad + int(round(c["at"] * FPS) / FPS * SR) - ref)
        mix[start : start + len(x)] += x[: len(mix) - start] * vol
    mix = mix[pad : pad + int(SR * duration)]
    mix *= duck_gain(len(mix))
    mix = np.tanh(mix * 1.1) / 1.1
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.5
    with wave.open(OUT, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(f"{len(cues)} звуков → {OUT}")


if __name__ == "__main__":
    main()
