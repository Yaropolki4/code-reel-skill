#!/usr/bin/env bash
# Готовит проект Remotion под вертикальный рилс о коде.
# Использование: bash <skill>/scripts/init_project.sh <папка-проекта> [--force]
#   Пустая/несуществующая папка → создаётся blank-проект Remotion.
#   Существующий проект → в него копируется шаблон (src/reel, scripts). Без --force не трогает существующий src/reel.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?укажите папку проекта}"
FORCE="${2:-}"

if [ ! -f "$DIR/package.json" ]; then
  mkdir -p "$DIR"
  if [ -n "$(ls -A "$DIR" 2>/dev/null | grep -v '^.DS_Store$' || true)" ]; then
    echo "Папка $DIR не пустая и в ней нет package.json — создайте проект в другой папке." >&2
    exit 1
  fi
  rm -f "$DIR/.DS_Store"
  (cd "$DIR" && npx create-video@latest --yes --blank --no-tailwind .)
fi

cd "$DIR"
if [ -d src/reel ] && [ "$FORCE" != "--force" ]; then
  echo "В проекте уже есть src/reel — не перезаписываю. Запустите с --force, если это нужно." >&2
  exit 1
fi

backup() { [ -f "$1" ] && cp "$1" "$1.bak" && echo "сохранён $1.bak"; return 0; }
mkdir -p src/reel scripts public
cp -R "$SKILL/assets/template/src/reel/." src/reel/
backup src/Root.tsx; cp "$SKILL/assets/template/src/Root.tsx" src/Root.tsx
backup remotion.config.ts; cp "$SKILL/assets/template/remotion.config.ts" remotion.config.ts
cp -R "$SKILL/assets/template/scripts/." scripts/
[ -f src/Composition.tsx ] && grep -q "return null" src/Composition.tsx && rm src/Composition.tsx

npm i >/dev/null 2>&1 || npm i
npx remotion add @remotion/google-fonts @remotion/media @remotion/whisper-webgpu @huggingface/transformers mediabunny @mediabunny/server
bash scripts/fetch_sfx.sh
echo "Готово. Превью: npx remotion studio"
