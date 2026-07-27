# AuraChess

A polished single-page chess web app with an adaptive AI opponent, ELO tracking, move history, and local game settings.

## Run locally

This project is a static web app, so you can run it locally without a build step.

### Option 1: Open directly in a browser
1. Open the project folder in your file explorer.
2. Double-click [index.html](index.html) to open it in your browser.

### Option 2: Serve it with a local web server
If you want the most reliable local experience, serve the folder from a simple web server.

Using Python:

```bash
cd /path/to/One
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Notes
- The app uses local assets and a local chess engine, so it can work offline once the files are present.
- Game stats and settings are stored in the browser via local storage.

## Before uploading to GitHub
1. Make sure all project files are present, especially [js/chess.min.js](js/chess.min.js).
2. Verify the app opens correctly locally.
3. Commit the full folder contents, including:
   - [index.html](index.html)
   - [style.css](style.css)
   - [js](js)

## Project files
- [index.html](index.html) — app layout and UI
- [style.css](style.css) — styling
- [js/main.js](js/main.js) — main game logic
- [js/ai-worker.js](js/ai-worker.js) — AI engine worker
- [js/pieces.js](js/pieces.js) — chess piece rendering
- [js/storage.js](js/storage.js) — local storage helpers
- [js/chess.min.js](js/chess.min.js) — local chess engine
