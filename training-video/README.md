# Journal Builder — Training Video

Automated, narrated screen-recording walkthrough of the app, built from the real
running app on `localhost:3000`. Output: `output/journal-builder-training.mp4`
(1280×800, ~3 min, narration + burned-in subtitles).

## How it's made (pipeline)

1. **`scenes.json`** — the script: one entry per scene with the narration text.
2. **`gen_audio.py`** — runs piper TTS on each scene → `audio/<id>.raw.wav`,
   measures durations, writes `durations.json` (per-scene "slot" = lead+speech+gap).
3. **`record.mjs`** — Playwright drives the real app (logs in, clicks through the
   9 sections, preview/export, setup), overlaying an animated cursor, a scene
   title chip, and intro/outro cards. Each scene is paced to its narration slot.
   Writes `video/walkthrough.webm` + `timeline.json` (actual scene start offsets).
4. **`build.py`** — places each scene's audio at its real recorded offset,
   generates sentence-level subtitles, and muxes everything into the final MP4.

## Regenerate

```bash
# app must be running on localhost:3000
cd training-video
tools/venv/bin/python gen_audio.py      # only needed if narration changed
node record.mjs                          # re-records the screen walkthrough
tools/venv/bin/python build.py           # produces output/journal-builder-training.mp4
```

## Edit the narration

Edit `scenes.json` (text only), then rerun all three steps above. To change the
voice, swap the model in `tools/voices/` and update `gen_audio.py`.

## Tooling (all userspace, no sudo)

- `tools/ffmpeg-static/` — static ffmpeg/ffprobe 7.0.2
- `tools/venv/` — Python venv with `piper-tts`
- `tools/voices/en_US-lessac-medium.onnx` — piper voice model
- `node_modules/playwright` — uses system Google Chrome (`channel: "chrome"`)

Config via env vars for `record.mjs`: `BASE_URL`, `APP_EMAIL`, `APP_PASSWORD`.
