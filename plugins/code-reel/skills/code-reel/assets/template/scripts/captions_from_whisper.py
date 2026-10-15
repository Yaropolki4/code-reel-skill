"""Whisper → субтитры ролика.

Вход: src/reel/voice-captions.json (из scripts/transcribe.mts).
Правки: scripts/caption_fixes.json — {"fixes": {"лог": "lock", ...}, "code": ["npm", "install", ...]}.
Выход: src/reel/captions.json — слова с таймингом, code: true для команд, pageBreakAfter: true — конец экрана.
Экраны режутся автоматически (знак препинания, 4 слова или ~22 символа); после — поправьте руками, если нужно.
Запуск: python3 scripts/captions_from_whisper.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "src", "reel", "voice-captions.json")
OUT = os.path.join(ROOT, "src", "reel", "captions.json")
FIXES = os.path.join(os.path.dirname(__file__), "caption_fixes.json")

cfg = json.load(open(FIXES)) if os.path.exists(FIXES) else {}
fixes = cfg.get("fixes", {})
code = set(cfg.get("code", []))

words = [dict(text=w["text"].strip(), s=w["startMs"], e=w["endMs"]) for w in json.load(open(SRC))]

# Whisper режет «package» + «.json», «Из» + «-за» — склеиваем
i = len(words) - 2
while i >= 0:
    nxt = words[i + 1]["text"]
    if nxt.startswith(".") or nxt.startswith("-"):
        words[i]["text"] += nxt
        words[i]["e"] = words[i + 1]["e"]
        del words[i + 1]
    i -= 1

for w in words:
    w["text"] = fixes.get(w["text"], w["text"])

out = []
page_words = 0
page_chars = 0
for k, w in enumerate(words):
    d = dict(text=w["text"], startMs=w["s"], endMs=w["e"])
    if w["text"].strip(".,!?…:;") in code:
        d["code"] = True
    page_words += 1
    page_chars += len(w["text"]) + 1
    nxt = words[k + 1]["text"] if k + 1 < len(words) else ""
    bare = w["text"].strip(".,!?…:;")
    # не обрываем экран на предлоге/союзе и между частями команды («npm» + «install»)
    sticky = len(bare) <= 2 and bare.lower() == bare and w["text"][-1:] not in ".,!?…:;"
    sticky = sticky or (bare in code and nxt.strip(".,!?…:;") in code and w["text"][-1:] not in ".,!?…:;")
    punct = w["text"][-1:] in ".,!?…:;"
    if punct or (not sticky and (page_words >= 4 or page_chars + len(nxt) > 22)):
        d["pageBreakAfter"] = True
        page_words = 0
        page_chars = 0
    out.append(d)

json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
pages, cur = [], []
for d in out:
    cur.append(d["text"])
    if d.get("pageBreakAfter"):
        pages.append(" ".join(cur))
        cur = []
if cur:
    pages.append(" ".join(cur))
print(f"{len(out)} слов, {len(pages)} экранов → {OUT}")
for p in pages:
    print("  ", p)
