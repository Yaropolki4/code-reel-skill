# code-reel

Скилл для Claude Code: собирает вертикальный рилс 1080×1920 о программировании в [Remotion](https://www.remotion.dev) — от текста озвучки до MP4. Таймлайн, анимированные сцены с кодом и терминалом, звуки, синхронизация с записанной озвучкой и субтитры.

## Установка

Как плагин (обновления приходят сами):

```bash
claude plugin marketplace add Yaropolki4/code-reel-skill
claude plugin install code-reel@code-reel
```

Или вручную — скопировать папку скилла:

```bash
git clone https://github.com/Yaropolki4/code-reel-skill
cp -R code-reel-skill/plugins/code-reel/skills/code-reel ~/.claude/skills/
```

## Как пользоваться

Пришлите Claude текст рилса (и, если есть, запись озвучки) и попросите собрать видео. Скилл предложит таймлайн и варианты хука, создаст проект Remotion, соберёт сцены, сведёт звук и сделает субтитры.

Нужны Node.js 20+, Python 3 с `numpy`, браузер с WebGPU для распознавания речи.

Палитра и шрифты — в `assets/template/src/reel/theme.ts`, поменяйте под свой канал.

## Звуки

Звуки скачиваются при создании проекта с [Mixkit](https://mixkit.co) и в репозитории не хранятся. Условия использования — [mixkit.co/license](https://mixkit.co/license/).

## Лицензия

MIT — см. [LICENSE](LICENSE).
