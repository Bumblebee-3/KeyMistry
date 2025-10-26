<p align="center">
  <img src="assets/favicon.png" alt="LearnPiano favicon" width="128" />
  <br/>
  <h1 align=center>LearnPiano</h1>
  <h2 align=center>Web MIDI Piano Trainer</h2>
 </p>




<p align="center">
  <img src="assets/image.png" alt="LearnPiano screenshot" width="820" />
</p>


A modern, browser-based MIDI piano trainer built with Tailwind CSS, Tone.js, and the Web MIDI API. Load any MIDI file, visualize falling notes with a piano roll, connect your MIDI keyboard for interactive practice, and track your progress with a Guided Learning flow and a built‑in dashboard.


---

## Features

- MIDI loader + quick reload
  - Upload any .mid/.midi and auto-persist the last song ("Load Previous")
- Transport and controls
  - Play, Pause, Stop, Restart; countdown overlay before starting
  - Tempo slider scales BPM while keeping visuals tightly synced to the audio clock
- Piano roll visualization
  - Crisp note fall synced to the audio clock (Tone.Transport + Tone.Draw)
  - Track/part colors, adjustable fall time, note radius, trails, glow, and hit line
  - Virtual keyboard with colored glow and red outlines for pressed keys
- Web MIDI I/O
  - Device selection (In/Out), MIDI Thru, Test Note, echo guard, CC64 sustain handling
  - Configurable Sustain Tail (ms) for smoother external note‑offs; All Notes Off on Stop
- Practice Mode (note‑wait)
  - Pauses just before the next chord/note group; resumes when you play the required notes
  - Early‑hit lookahead and octave tolerance (±0..2) for forgiving matching
  - Input timing offset calibration (±200 ms) to match your device/latency
  - Loop any range; per‑loop feedback (accuracy, timings)
- Guided Learning (stages)
  - Sections (~20s each) form cumulative stages: Left → Right → Both (or Both only if no hand split)
  - End‑of‑stage accuracy overlay with a brief 5s lock; choose Replay or Continue explicitly
  - Partial‑credit scoring per note, full credit for satisfied chords; no accidental auto‑continue
  - Adaptive tempo nudge on strong accuracy; per‑stage tempo is remembered
  - Progress is saved per song and summarized in the Dashboard
- Transpose & Key
  - Auto‑detects song key on load; adjust Key/Scale and Transpose with live re‑scheduling
  - Per‑song config (key/transpose) is remembered across sessions
- Dashboard
  - View per‑song completion, section accuracies, last played; sort and reset selectively
  - Replay the walkthrough tutorial; progress stored locally in the browser
- Robust MIDI parsing
  - Sanitizes malformed time‑signature meta events for better compatibility with @tonejs/midi
- Mobile‑safe
  - Mobile is intentionally blocked (Web MIDI is unreliable on mobile). Desktop browsers only.

---

## Quick Start

Prereqs: Node.js 18+ recommended.

```sh
# install deps for Tailwind build
npm install

# one-time production build of Tailwind CSS
npm run build:css

# run static server (uses npx serve)
npm start
```

Open the app in a desktop browser with Web MIDI (Chrome/Edge) and grant MIDI permissions when prompted. Entry points: `index.html` (landing), `app.html` (app), `dashboard.html` (progress).


## Using the App

1. MIDI Settings 
   - Select your MIDI Input and Output devices
   - Toggle MIDI Thru to echo input to output
   - Click Test Note to verify the output device
   - Adjust Sustain Tail (0–150 ms) to smooth external device note-offs
2. Load a MIDI
   - Click Upload and select a `.mid/.midi` file
   - Or click the previous-song button (it shows the saved filename)
   - The last loaded file is auto-loaded on startup
3. Controls
   - Play ▶, Pause ⏸, Stop ⏹, Restart ⟳
4. Practice
  - Switch Mode to Practice and enable Note‑wait (pauses before each required chord/note)
  - Choose Hand (Left/Right/Both) if your MIDI separates hands; set Loop start/end (seconds)
  - Start playback (countdown appears); play the required notes to resume
  - Per‑loop feedback shows accuracy and timing; Guided adds an end‑of‑stage overlay
5. Visualization
  - Adjust Note radius (Square/Soft/Pill), Fall time, Trails, Glow, and Hit line

6. Guided Learning
  - Click “Guided” to open the panel; stages progress Left → Right → Both (if applicable)
  - Sections are ~20s each and cumulative across the song
  - When a stage ends, an accuracy overlay appears (locked for ~5s), then choose Replay/Continue

7. Transpose & Key
  - Open Transpose & Key; use Auto‑Detect, then adjust Key/Scale or Transpose as needed
  - Per‑song settings persist; effective key is shown in the modal

8. Dashboard
  - Open Dashboard to view per‑song progress (completion, per‑section accuracies, last played)
  - Sort by Recent/Completion/Title; reset one song or all; replay the tutorial

---

## How It Works

- MIDI parsing: `@tonejs/midi` with a sanitizer for malformed time‑signature meta events
- Scheduling & audio: Tone.Transport for timing + Tone.Draw for visual sync; per‑track `PolySynth`
- Tempo: scales around the song’s original BPM (keeps visuals exactly in lockstep)
- MIDI Out: mirrors scheduled Note On/Off on track channels; CC64 (sustain) forwarded
- Sustain smoothing: Note Offs delayed by a configurable tail (ms) for external gear
- Practice engine
  - Groups close notes into chords; waits just before them (note‑wait)
  - Early‑hit lookahead, octave tolerance, and input timing offset calibration
  - Accuracy uses partial per‑note credit; full credit for satisfied chords
- Guided Learning
  - Cumulative stages across sections; explicit Continue/Replay control (no auto‑continue)
  - Final overlay reports accuracy and average timing (ms) with a short input lock

---


## Troubleshooting

- Web MIDI not showing devices
  - Use Chrome/Edge and run on HTTPS or `http://localhost:3000/`
  - Ensure OS sees your device, and it’s not grabbed exclusively by another app
  - Refresh device list in the MIDI Settings modal
- No sound from output device
  - Select the correct MIDI Output in settings
  - Use Test Note to verify
  - Try increasing Sustain Tail

---

## Development

This is a static client app with a local Tailwind build.
- Tailwind is built locally via PostCSS and output to `./css/tailwind.css` (linked from HTML)
- Source styles live in `./css/src/tailwind.css` (uses `@tailwind` directives)
- Tone.js and `@tonejs/midi` are imported as ESM from CDNs inside `./js/script.js`
- Editor: `.vscode/settings.json` silences harmless CSS warnings for compiled Tailwind output

Project structure (top‑level):

```
app.html        # main app
index.html      # landing/marketing
dashboard.html  # local progress overview
css/
  src/tailwind.css  # Tailwind source (with custom CSS)
  tailwind.css      # compiled output (built via scripts)
js/
  script.js         # app logic (module)
  dashboard.js      # dashboard UI logic (module)
assets/            # images, icons
songs/             # sample songs (mid/midi)
```

Useful scripts:

```sh
# Rebuild Tailwind on changes
npm run dev:css

# Production/minified build
npm run build:css
```

Start a local static server (`npm start` or `npx serve`) and open `app.html`.

PRs and ideas are welcome.

---

## License

GPL V3.

## Author: Hridhuun Savant ([Bumblebee-3 (Github)](https://github.com/Bumblebee-3), [Website](https://bumblebee-2008.github.io/))