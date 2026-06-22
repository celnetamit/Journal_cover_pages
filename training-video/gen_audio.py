#!/usr/bin/env python3
"""Generate per-scene narration WAVs with piper, measure durations, and build a
single concatenated narration track (with gaps between scenes). Writes
durations.json describing each scene's audio length and its paced "slot"
(duration + gap) so the Playwright recorder can stay in sync."""
import json, os, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(ROOT, "tools")
PY = os.path.join(TOOLS, "venv", "bin", "python")
MODEL = os.path.join(TOOLS, "voices", "en_US-lessac-medium.onnx")
FFMPEG = os.path.join(TOOLS, "ffmpeg-static", "ffmpeg")
FFPROBE = os.path.join(TOOLS, "ffmpeg-static", "ffprobe")
AUDIO = os.path.join(ROOT, "audio")
GAP = 0.7          # silence after each scene (seconds)
LEAD = 0.4         # silence before narration starts in a scene
SR = 22050

os.makedirs(AUDIO, exist_ok=True)

with open(os.path.join(ROOT, "scenes.json")) as f:
    scenes = json.load(f)["scenes"]

def dur(path):
    out = subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path]).decode().strip()
    return float(out)

# one reusable silence clip for the gap, and one for the lead-in
sil_gap = os.path.join(AUDIO, "_sil_gap.wav")
sil_lead = os.path.join(AUDIO, "_sil_lead.wav")
for path, length in ((sil_gap, GAP), (sil_lead, LEAD)):
    subprocess.run([FFMPEG, "-y", "-f", "lavfi", "-i",
                    f"anullsrc=r={SR}:cl=mono", "-t", str(length),
                    "-c:a", "pcm_s16le", path],
                   check=True, capture_output=True)

manifest = []
concat_parts = []
for sc in scenes:
    raw = os.path.join(AUDIO, f"{sc['id']}.raw.wav")
    subprocess.run([PY, "-m", "piper", "-m", MODEL, "-f", raw],
                   input=sc["narration"].encode(), check=True, capture_output=True)
    d = dur(raw)
    slot = LEAD + d + GAP
    manifest.append({"id": sc["id"], "title": sc["title"],
                     "speech": round(d, 3), "slot": round(slot, 3)})
    concat_parts += [sil_lead, raw, sil_gap]
    print(f"  {sc['id']:14s} speech={d:5.2f}s  slot={slot:5.2f}s")

# build the full narration track in scene order: lead + speech + gap, repeated
listfile = os.path.join(AUDIO, "concat.txt")
with open(listfile, "w") as f:
    for p in concat_parts:
        f.write(f"file '{p}'\n")
narration = os.path.join(AUDIO, "narration.wav")
subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                "-c", "copy", narration], check=True, capture_output=True)

total = dur(narration)
with open(os.path.join(ROOT, "durations.json"), "w") as f:
    json.dump({"scenes": manifest, "total": round(total, 3),
               "lead": LEAD, "gap": GAP}, f, indent=2)

print(f"\nTotal narration: {total:.1f}s ({total/60:.1f} min)")
print(f"Wrote {narration}")
print(f"Wrote {os.path.join(ROOT, 'durations.json')}")
