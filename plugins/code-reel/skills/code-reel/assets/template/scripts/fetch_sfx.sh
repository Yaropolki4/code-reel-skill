#!/usr/bin/env bash
# Скачивает звуки Mixkit из библиотеки mix_sfx.py и конвертирует в sfx-src/wav/mk<id>.wav.
# Запуск из корня проекта: bash scripts/fetch_sfx.sh [доп. id ...]
set -euo pipefail
ids=$(python3 - <<'PY'
import re
s = open("scripts/mix_sfx.py").read()
ids = set(re.findall(r'":\s*(\d+),', s)) | set(re.findall(r'_SRC = (\d+)', s))
print(" ".join(sorted(ids, key=int)))
PY
)
ids="$ids $*"
mkdir -p sfx-src/mixkit sfx-src/wav
for id in $ids; do
  [ -s "sfx-src/wav/mk$id.wav" ] && continue
  [ -s "sfx-src/mixkit/$id.mp3" ] || curl -sfL -o "sfx-src/mixkit/$id.mp3" "https://assets.mixkit.co/active_storage/sfx/$id/$id-preview.mp3" || { echo "не скачался $id"; continue; }
  npx remotion ffmpeg -loglevel error -y -i "sfx-src/mixkit/$id.mp3" -ac 1 -ar 44100 -c:a pcm_s16le "sfx-src/wav/mk$id.wav"
done
echo "звуки: $(ls sfx-src/wav | wc -l | tr -d ' ') файлов в sfx-src/wav"
