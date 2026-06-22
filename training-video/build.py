#!/usr/bin/env python3
"""Assemble the final MP4: place each scene's narration at its real recorded
offset (timeline.json), burn sentence-level subtitles, and mux over the
Playwright screen recording."""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(ROOT, "tools", "ffmpeg-static")
FFMPEG, FFPROBE = os.path.join(TOOLS, "ffmpeg"), os.path.join(TOOLS, "ffprobe")
SLUG = os.environ.get("SLUG", "main")
SUFFIX = "" if SLUG == "main" else f"-{SLUG}"
AUDIO, VIDEO, OUT = (os.path.join(ROOT, d) for d in (f"audio{SUFFIX}", "video", "output"))
os.makedirs(OUT, exist_ok=True)

scenes_txt = {s["id"]: s["narration"] for s in json.load(open(os.path.join(ROOT, f"scenes{SUFFIX}.json")))["scenes"]}
tl = json.load(open(os.path.join(ROOT, f"timeline{SUFFIX}.json")))
lead = tl["lead"]
webm = os.path.join(VIDEO, f"walkthrough{SUFFIX}.webm")

def dur(p):
    return float(subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode().strip())

vdur = dur(webm)
print(f"video duration: {vdur:.2f}s")

# ---- subtitles (sentence-level, proportional to char length) ----
def ts(sec):
    if sec < 0: sec = 0
    h = int(sec // 3600); m = int(sec % 3600 // 60); s = sec % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s-int(s))*1000)):03d}"

srt, idx = [], 1
for sc in tl["scenes"]:
    text = scenes_txt[sc["id"]]
    start = sc["startMs"] / 1000 + lead
    speech = sc["speech"]
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", text) if p.strip()]
    total_chars = sum(len(p) for p in parts) or 1
    t = start
    for p in parts:
        seg = speech * (len(p) / total_chars)
        srt.append(f"{idx}\n{ts(t)} --> {ts(t + seg)}\n{p}\n")
        idx += 1; t += seg
srt_path = os.path.join(ROOT, f"subs{SUFFIX}.srt")
open(srt_path, "w").write("\n".join(srt))
print(f"wrote {idx-1} subtitle cues")

# ---- audio mix: each scene's raw wav delayed to its real start ----
inputs, filt, mixlabels = ["-i", webm], [], []
for i, sc in enumerate(tl["scenes"]):
    wav = os.path.join(AUDIO, f"{sc['id']}.raw.wav")
    delay = int(sc["startMs"] + lead * 1000)
    inputs += ["-i", wav]
    n = i + 1  # input index (0 = video)
    filt.append(f"[{n}:a]adelay={delay}|{delay}[a{n}]")
    mixlabels.append(f"[a{n}]")
filt.append("".join(mixlabels) + f"amix=inputs={len(tl['scenes'])}:normalize=0,"
            f"apad,atrim=0:{vdur:.3f}[mix]")
style = ("FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00FFFFFF,"
         "BorderStyle=3,OutlineColour=&HC0000000,Outline=1,Shadow=0,Alignment=2,MarginV=24")
filt.append(f"[0:v]subtitles={srt_path}:force_style='{style}'[v]")
filter_complex = ";".join(filt)

out_name = "journal-builder-training.mp4" if SLUG == "main" else f"journal-{SLUG}-training.mp4"
out = os.path.join(OUT, out_name)
cmd = [FFMPEG, "-y", *inputs, "-filter_complex", filter_complex,
       "-map", "[v]", "-map", "[mix]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]
print("encoding...")
r = subprocess.run(cmd, capture_output=True)
if r.returncode != 0:
    print(r.stderr.decode()[-3000:]); raise SystemExit("ffmpeg failed")
print(f"\nDONE -> {out}  ({dur(out):.1f}s, {os.path.getsize(out)//1024//1024} MB)")
