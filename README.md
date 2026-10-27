# Book Animation

A Three.js book-turn animation with a browser preview and an optional MP4 renderer.

## Project structure

```text
.
├── index.html
├── package.json
├── server.js
├── render.js
├── js/
│   ├── main.js
│   ├── book.js
│   ├── cameraPath.js
│   ├── config.js
│   └── skin.js
└── skin/
    ├── README.txt
    ├── cover.jpg
    ├── cover-inside.jpg
    ├── page-01.jpg
    └── back-inside.jpg
```

## Preview locally

1. Install Node.js (LTS).
2. From this folder, run `npm install` if you want to render MP4s. For just previewing, no npm install is needed.
3. Start the local server:

   ```bash
   npm start
   ```

4. Open `http://localhost:8000` in your browser.

The preview loads Three.js from jsDelivr, so an internet connection is required. Space pauses/plays; Left/Right arrows scrub; Home restarts; F toggles fullscreen. Add `?t=7.5` to the URL to inspect a specific moment.

## Artwork

Put your four artwork images in `skin/` using these exact names:

- `cover.jpg` — outside front cover
- `cover-inside.jpg` — inside front cover
- `page-01.jpg` — first reading page (page 3 in the book)
- `back-inside.jpg` — fourth surface / inside back cover

The image mapping is configured in `js/config.js`. Keep the filenames in sync with that mapping.

## Render an MP4 (optional)

Install dependencies and make sure `ffmpeg` is available on your PATH:

```bash
npm install
npm run render
```

The default output is `out/book.mp4`. Examples:

```bash
npm run render -- --width 1080 --height 1920
npm run render -- --stills 3,7.5,9,14
npm run render -- --blur 4
```

## Deploy on GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, select `main` and the `/(root)` folder, then save. Wait for the published URL to appear. The static page uses relative paths for project files and loads Three.js from jsDelivr.
