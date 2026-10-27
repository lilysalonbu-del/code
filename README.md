# Book animation (HTML + CSS + JS, three.js)

No text, no UI — just the book. Everything is a pure function of time, so what you preview in the browser is exactly what the MP4 contains.

## 1. Preview in the browser
    node server.js            # then open http://localhost:8000
Keys: Space = pause/play · ← / → = scrub · Home = restart · F = fullscreen · `?t=7.5` in the URL = freeze at 7.5 s

## 2. Render the MP4 (only when you're happy)
    npm install               # once (downloads Chrome for the renderer)
    node render.js            # → out/book.mp4   1920x1080, 30 fps
    node render.js --width 1080 --height 1920     # vertical
    node render.js --blur 4   # real motion blur (4x slower)
    node render.js --stills 3,7.5,9,14            # PNG stills only, quick look check
Needs `ffmpeg` on your PATH. Options: --fps --crf (lower = better) --start --end --out --headed

## 3. Your skin
Put images in `skin/` (names in `skin/README.txt`). Reload the browser — no code changes.

## 4. Tweak
Everything is in `js/config.js`: durations, which leaves turn and when, how floppy each page is (`curl`),
camera keyframes, light/colours, depth of field. Turn another page by adding `{ leaf: 3, start: 19, dur: 2.7, curl: 0.78 }`.
