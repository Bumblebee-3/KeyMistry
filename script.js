import * as Tone from "https://cdn.skypack.dev/tone@14.8.49";
import { Midi } from "https://cdn.skypack.dev/@tonejs/midi@2.0.28";

if (window.__KM_BLOCKED) {
  // Export an empty module to satisfy type=module
}
savePref('grid', false)
const fileInput = document.getElementById("fileInput");
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingHeadline = document.getElementById('loadingHeadline');
const loadingStatus = document.getElementById('loadingStatus');
const btnLoadPrevious = document.getElementById("btnLoadPrevious");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const btnStop = document.getElementById("btnStop");
const btnRestart = document.getElementById("btnRestart");
const progress = document.getElementById("progress");
const timeLabel = document.getElementById("timeLabel");
const speed = document.getElementById("speed");
const speedLabel = document.getElementById("speedLabel");
const modeSelect = document.getElementById("modeSelect");
const tracksPanel = document.getElementById("tracksPanel");
const scoreEl = document.getElementById("score");
const midiStatus = document.getElementById("midiStatus");
const overlayMsg = document.getElementById("overlayMsg");

const noteWaitToggle = document.getElementById("noteWaitToggle");
const handLeftBtn = document.getElementById("handLeft");
const handRightBtn = document.getElementById("handRight");
const handBothBtn = document.getElementById("handBoth");
const loopToggle = document.getElementById("loopToggle");
const loopStartInput = document.getElementById("loopStart");
const loopEndInput = document.getElementById("loopEnd");
const countdownEl = document.getElementById("countdown");

const feedbackModal = document.getElementById("feedbackModal");
const feedbackClose = document.getElementById("feedbackClose");
const accPercentEl = document.getElementById("accPercent");
const accCorrectEl = document.getElementById("accCorrect");
const accTotalEl = document.getElementById("accTotal");
const missListEl = document.getElementById("missList");

const openMIDISettingsBtn = document.getElementById("openMIDISettings");
const midiModal = document.getElementById("midiModal");
const midiClose = document.getElementById("midiClose");
const openTransposeSettingsBtn = document.getElementById('openTransposeSettings');
const transposeModal = document.getElementById('transposeModal');
const transposeClose = document.getElementById('transposeClose');
const midiInSelect = document.getElementById("midiInSelect");
const midiOutSelect = document.getElementById("midiOutSelect");
const midiConnDot = document.getElementById("midiConnDot");
const refreshMIDI = document.getElementById("refreshMIDI");
const testNoteBtn = document.getElementById("testNoteBtn");
const midiThruToggle = document.getElementById("midiThruToggle");
const practiceToggle = document.getElementById("practiceToggle");
const tailMsInput = document.getElementById("tailMsInput");
const tailMsLabel = document.getElementById("tailMsLabel");

const settingsTabMidi = document.getElementById('settingsTabMidi');
const settingsTabVisuals = document.getElementById('settingsTabVisuals');
const midiSettingsTab = document.getElementById('midiSettingsTab');
const visualSettingsTab = document.getElementById('visualSettingsTab');

const radiusSelect = document.getElementById("radiusSelect");
const fallTime = document.getElementById("fallTime");
const fallTimeLabel = document.getElementById("fallTimeLabel");
const trailToggle = document.getElementById("trailToggle");
const bounceToggle = document.getElementById("bounceToggle");
const enhancedToggle = document.getElementById("enhancedToggle");
const hitLineToggle = document.getElementById("hitLineToggle");
const noteOpacity = document.getElementById("noteOpacity");
const noteOpacityLabel = document.getElementById("noteOpacityLabel");
const glowIntensity = document.getElementById("glowIntensity");
const glowIntensityLabel = document.getElementById("glowIntensityLabel");
// Pitch & Key controls
const transposeInput = document.getElementById('transpose');
const transposeLabel = document.getElementById('transposeLabel');
const keyTonicSelect = document.getElementById('keyTonic');
const keyScaleSelect = document.getElementById('keyScale');
const autoDetectKeyBtn = document.getElementById('autoDetectKey');
const detectedKeyLabel = document.getElementById('detectedKeyLabel');
const effectiveKeyLabel = document.getElementById('effectiveKeyLabel');
// Optional visual latency fine-tuning
const visualLatencyInput = document.getElementById('visualLatencyOffset');
const visualLatencyLabel = document.getElementById('visualLatencyLabel');
let VISUAL_LATENCY = 0; // seconds; positive = advance visuals (hit earlier)

const canvas = document.getElementById("pianoRoll");
const ctx = canvas.getContext("2d");

const btnPianoMode = document.getElementById('btnPianoMode');
const pianoFs = document.getElementById('pianoFs');
const fsExit = document.getElementById('fsExit');
const fsPlayPause = document.getElementById('fsPlayPause');
const fsPlayPauseIcon = document.getElementById('fsPlayPauseIcon');
const pianoFsCanvasWrap = document.getElementById('pianoFsCanvasWrap');
let canvasOriginalParent = null;

const START_DELAY = 0.07; 

const FIRST_MIDI = 21; 
const LAST_MIDI = 108; 
const TOTAL_KEYS = LAST_MIDI - FIRST_MIDI + 1; 

let WIDTH = 0;
let HEIGHT = 0;
const KEYBOARD_HEIGHT = 90; 
let NOTE_FALL_DURATION = 4; 
const HIT_LINE_Y = HEIGHT - KEYBOARD_HEIGHT - 4; 
// Feature flags
const LANDING_FLASH_ENABLED = false; // disable landing flashes to avoid any flicker
const TRAILS_ENABLED = false;        // disable frame trails to avoid composite artifacts
const SHADOWS_ENABLED = false;       // disable shadow/glow rendering to avoid flashes

const TRACK_COLORS = [
  "#60a5fa", 
  "#34d399", 
  "#fbbf24", 
  "#f87171", 
  "#a78bfa", 
  "#fb7185", 
  "#4ade80", 
  "#22d3ee", 
];

const app = {
  midi: undefined,
  duration: 0,
  tracks: [],
  scheduled: false,
  synths: [],
  score: 0,
  isLoading: true,
  expectedNotesByTime: new Map(),
  liveKeys: new Set(), 
  keyGlow: new Map(), 
  upcomingKeys: new Set(), 
  _lastLandingFlash: new Map(), 
  pitch: {
    transpose: 0,
    // Target key selection (what user wants to play in)
    keyTonic: 0,
    keyScale: 'major',
    // Original song key (from detection), used as transpose baseline
    detectedTonic: null,
    detectedScale: null,
    // Optional persisted original key baseline
    originalTonicPref: null,
    originalScalePref: null,
  },
  practice: {
    noteWait: false,
    hand: 'both', 
    loop: { enabled: false, start: 0, end: 0, pauseMs: 300, _pending: false, _timer: null },
    waiting: false,
    nextExpected: null, 
    groups: [], 
    currentIndex: 0,
    requiredSet: new Set(), 
    hitSet: new Set(), 
    lastWaitTime: -1,
    stats: { total: 0, correct: 0, misses: [], timings: [] },
  },
  midiIO: {
    access: null,
    inputs: new Map(),
    outputs: new Map(),
    inId: null,
    outId: null,
    input: null,
    output: null,
    thru: false,
    tailMs: 60,
  },
  pedal: {
    sustainDown: new Map(), // channel -> boolean
    sustained: new Map(),   // channel -> Set<midi>
  }
};
app._originalBpm = 120; 

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const formatTime = (sec) => {
  if (!isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

function showOverlay(text, ms = 1200) {
  overlayMsg.textContent = text;
  overlayMsg.classList.remove("hidden");
  clearTimeout(showOverlay._t);
  showOverlay._t = setTimeout(() => overlayMsg.classList.add("hidden"), ms);
}

function updatePreviousButtonLabel() {
  if (!btnLoadPrevious) return;
  try {
    const name = localStorage.getItem('km_last_midi_name') || localStorage.getItem('lp_last_midi_name');
    if (name) {
      btnLoadPrevious.textContent = name;
      btnLoadPrevious.title = `Load previous: ${name}`;
    }
  } catch {}
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  WIDTH = Math.floor(rect.width);
  HEIGHT = Math.floor(rect.height);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const t = getPlaybackTime() || 0;
  drawNotes(t);
  drawKeyboard();
}

function hitLineY() {
  return HEIGHT - KEYBOARD_HEIGHT - 6;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const PREF_PREFIX = 'km_pref_';
function savePref(key, value) {
  try { localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value)); } catch {}
}
let __LP_LOAD_ERRORS = 0;
function loadPref(key, def) {
  try {
    const s = localStorage.getItem(PREF_PREFIX + key);
    return s == null ? def : JSON.parse(s);
  } catch (e) {
    __LP_LOAD_ERRORS++;
  console.warn(`[KeyMistry] Failed to load pref ${key}`, e);
    return def;
  }
}
function setLoadingStatus(msg) { if (loadingStatus) loadingStatus.textContent = msg; }
function setLoadingHeadline(msg) { if (loadingHeadline) loadingHeadline.textContent = msg; }
function hideLoadingOverlay() {
  if (!loadingOverlay) return;
  loadingOverlay.style.opacity = '0';
  setTimeout(() => { loadingOverlay.classList.add('hidden'); app.isLoading = false; }, 520);
}
function applyPrefsToUI() {

  const mode = loadPref('mode', null);
  if (mode && modeSelect) modeSelect.value = mode;
  const practice = loadPref('practiceToggle', null);
  if (practice != null && practiceToggle) practiceToggle.checked = !!practice;
  const noteWait = loadPref('noteWait', null);
  if (noteWait != null && noteWaitToggle) noteWaitToggle.checked = !!noteWait;

  const tempo = loadPref('tempoFactor', null);
  if (tempo != null && speed) {
    speed.value = String(tempo);
    speedLabel.textContent = `${Math.round(tempo * 100)}%`;
  }

  const radius = loadPref('radius', null);
  if (radius && radiusSelect) radiusSelect.value = radius;
  const fall = loadPref('fallTime', null);
  if (fall != null && fallTime) {
    fallTime.value = String(fall);
    NOTE_FALL_DURATION = parseFloat(fallTime.value);
    if (fallTimeLabel) fallTimeLabel.textContent = `${NOTE_FALL_DURATION.toFixed(1)}s`;
  }
  const trails = loadPref('trails', null);
  if (trails != null && trailToggle) trailToggle.checked = !!trails;
  const bounce = loadPref('bounce', null);
  if (bounce != null && bounceToggle) bounceToggle.checked = !!bounce;

  const enh = loadPref('enhanced', null);
  if (enh != null && enhancedToggle) enhancedToggle.checked = !!enh;
  const hitLine = loadPref('hitLine', null);
  if (hitLine != null && hitLineToggle) hitLineToggle.checked = !!hitLine; else if (hitLineToggle) hitLineToggle.checked = true;
  const op = loadPref('noteOpacity', null);
  if (op != null && noteOpacity) {
    noteOpacity.value = String(op);
    if (noteOpacityLabel) noteOpacityLabel.textContent = `${Math.round(op * 100)}%`;
  }
  const glow = loadPref('glowIntensity', null);
  if (glow != null && glowIntensity) {
    glowIntensity.value = String(glow);
    if (glowIntensityLabel) glowIntensityLabel.textContent = `${parseFloat(glow).toFixed(1)}x`;
  }

  // Pitch & Key
  const tr = loadPref('transpose', null);
  if (tr != null && transposeInput) {
    transposeInput.value = String(tr);
    if (transposeLabel) transposeLabel.textContent = `${tr}`;
    app.pitch.transpose = parseInt(tr, 10) || 0;
  }
  const kt = loadPref('keyTonic', null);
  if (kt != null && keyTonicSelect) {
    keyTonicSelect.value = String(kt);
    app.pitch.keyTonic = parseInt(kt, 10) || 0;
  }
  const ks = loadPref('keyScale', null);
  if (ks && keyScaleSelect) {
    keyScaleSelect.value = ks;
    app.pitch.keyScale = ks;
  }
  // Load optional original key (baseline) if stored
  const ok = loadPref('originalTonic', null);
  if (ok != null) app.pitch.originalTonicPref = parseInt(ok, 10) || 0;
  const os = loadPref('originalScale', null);
  if (os) app.pitch.originalScalePref = os;

  const vlat = loadPref('visualLatencyOffset', null);
  if (vlat != null) {
    VISUAL_LATENCY = Number(vlat) || 0;
  }
  if (visualLatencyInput) {
    visualLatencyInput.value = String((VISUAL_LATENCY * 1000) | 0);
    if (visualLatencyLabel) visualLatencyLabel.textContent = `${(VISUAL_LATENCY * 1000) | 0} ms`;
  }

  const hand = loadPref('hand', null);
  if (hand) setHand(hand);
  const loopEn = loadPref('loopEnabled', null);
  if (loopEn != null && loopToggle) loopToggle.checked = !!loopEn;
  const loopStart = loadPref('loopStart', null);
  if (loopStart != null && loopStartInput) loopStartInput.value = String(loopStart);
  const loopEnd = loadPref('loopEnd', null);
  if (loopEnd != null && loopEndInput) loopEndInput.value = String(loopEnd);

  // Mirror loop prefs into runtime state so loop works without requiring a UI change event
  if (loopToggle) app.practice.loop.enabled = !!loopToggle.checked;
  if (loopStartInput) app.practice.loop.start = Math.max(0, parseFloat(loopStartInput.value || '0') || 0);
  if (loopEndInput) app.practice.loop.end = Math.max(0, parseFloat(loopEndInput.value || '0') || 0);

  const thru = loadPref('midiThru', null);
  if (thru != null && midiThruToggle) midiThruToggle.checked = !!thru;
  const tail = loadPref('tailMs', null);
  if (tail != null && tailMsInput) {
    tailMsInput.value = String(tail);
    if (tailMsLabel) tailMsLabel.textContent = `${tail}ms`;
    app.midiIO.tailMs = parseInt(tail, 10);
  }

  app.midiIO.inId = loadPref('midiInId', app.midiIO.inId);
  app.midiIO.outId = loadPref('midiOutId', app.midiIO.outId);
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    initFromMidi(midi);
    showOverlay(`Loaded: ${file.name}`);

    try {
      const bytes = new Uint8Array(arrayBuffer);
      const b64 = btoa(String.fromCharCode(...bytes));
      localStorage.setItem('km_last_midi_b64', b64);
      localStorage.setItem('km_last_midi_name', file.name);
      updatePreviousButtonLabel();
    } catch {}
  } catch (err) {
    console.error(err);
    showOverlay("Failed to load MIDI");
  }
});

btnLoadPrevious?.addEventListener('click', () => {
  try {
    const b64 = localStorage.getItem('km_last_midi_b64') || localStorage.getItem('lp_last_midi_b64');
    if (!b64) return showOverlay('No previous MIDI saved');
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i=0;i<binStr.length;i++) bytes[i] = binStr.charCodeAt(i);
    const midi = new Midi(bytes.buffer);
    initFromMidi(midi);
  const name = localStorage.getItem('km_last_midi_name') || localStorage.getItem('lp_last_midi_name') || 'Previous MIDI';
    showOverlay(`Loaded: ${name}`);
    updatePreviousButtonLabel();
  } catch (e) {
    console.error(e);
    showOverlay('Failed to load previous MIDI');
  }
});

function initFromMidi(midi) {
  app.midi = midi;
  app.tracks = [];
  app.scheduled = false;
  app.expectedNotesByTime.clear();
  app.score = 0;
  app.liveKeys.clear();
  app.keyGlow.clear();
  scoreEl.textContent = String(app.score);
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };

  let duration = 0;
  midi.tracks.forEach((t) => {
    t.notes.forEach((n) => {
      duration = Math.max(duration, n.time + n.duration);
    });
  });
  app.duration = duration;

  try {
    const bpm = midi?.header?.tempos?.[0]?.bpm;
    if (bpm && isFinite(bpm)) {
      app._originalBpm = bpm;
      Tone.Transport.bpm.value = bpm;
    } else {
      app._originalBpm = 120;
      Tone.Transport.bpm.value = 120;
    }
  } catch {}

  if (speed) {
    speed.value = '1';
    speedLabel.textContent = '100%';
  }

  app.tracks = midi.tracks.map((t, i) => {
    const color = TRACK_COLORS[i % TRACK_COLORS.length];
    const channel = (typeof t.channel === 'number') ? t.channel : 0;
    const notes = t.notes.map((n, idx) => ({
      midi: n.midi,
      time: n.time,
      duration: n.duration,
      velocity: n.velocity,
      trackIndex: i,
      channel,
      id: `t${i}n${idx}`,
    }));
    return {
      name: t.name || `Track ${i + 1}`,
      color,
      muted: false,
      solo: false,
      channel,
      notes,
    };
  });

  app.expectedNotesByTime.clear();
  for (const track of app.tracks) {
    for (const n of track.notes) {
      const bucket = Math.round(n.time * 10) / 10; 
      const list = app.expectedNotesByTime.get(bucket) || [];
      list.push({ midi: n.midi, time: n.time, id: n.id, hit: false, trackIndex: n.trackIndex });
      app.expectedNotesByTime.set(bucket, list);
    }
  }

  buildTrackUI();
  rescheduleTransport();
  updateTimeUI(0);

  buildPracticeGroups();

  // Ensure loop defaults are sensible after loading a MIDI
  if (app.practice.loop.enabled) {
    if (!(app.practice.loop.end > app.practice.loop.start)) {
      app.practice.loop.start = 0;
      app.practice.loop.end = app.duration;
      if (loopStartInput) loopStartInput.value = String(app.practice.loop.start);
      if (loopEndInput) loopEndInput.value = String(Math.round(app.practice.loop.end * 10) / 10);
    }
  }

  // Auto-detect key on load (non-destructive, only updates labels/selections)
  const r = detectKeyFromMidi();
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if (r) {
    app.pitch.detectedTonic = r.tonic;
    app.pitch.detectedScale = r.scale;
    if (detectedKeyLabel) detectedKeyLabel.textContent = `${names[r.tonic]} ${r.scale}`;
    // Only set if user hasn't set a key before (no pref saved)
    const hadUserKey = loadPref('keyTonic', null) != null || loadPref('keyScale', null) != null;
    if (!hadUserKey) {
      app.pitch.keyTonic = r.tonic;
      app.pitch.keyScale = r.scale;
      if (keyTonicSelect) keyTonicSelect.value = String(r.tonic);
      if (keyScaleSelect) keyScaleSelect.value = r.scale;
    }
    // Persist baseline original key
    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);
    // Ensure transpose aligns effective key to selected key
    const targetTonic = app.pitch.keyTonic ?? r.tonic;
    const newT = computeTransposeForTarget(targetTonic);
    if (app.pitch.transpose !== newT) {
      app.pitch.transpose = newT;
      savePref('transpose', app.pitch.transpose);
      if (transposeInput) transposeInput.value = String(newT);
      if (transposeLabel) transposeLabel.textContent = `${newT}`;
      rescheduleTransport();
    }
    updateEffectiveKeyLabel();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';
  }
}

function buildTrackUI() {
  tracksPanel.innerHTML = "";
  app.synths.forEach((s) => s.dispose());
  app.synths = [];

  app.tracks.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-700";

    const swatch = document.createElement("span");
    swatch.className = "inline-block w-3 h-3 rounded-full";
    swatch.style.background = t.color;

    const title = document.createElement("div");
    title.className = "flex-1 truncate text-sm";
    title.textContent = t.name;

    const mute = document.createElement("button");
    mute.className = `text-xs px-2 py-1 rounded-lg ${t.muted ? "bg-rose-600" : "bg-gray-700 hover:bg-gray-600"}`;
    mute.textContent = t.muted ? "Muted" : "Mute";
    mute.onclick = () => {
      t.muted = !t.muted;
      if (t.muted) t.solo = false;
      buildTrackUI();
      rescheduleTransport();
    };

    const solo = document.createElement("button");
    solo.className = `text-xs px-2 py-1 rounded-lg ${t.solo ? "bg-emerald-600" : "bg-gray-700 hover:bg-gray-600"}`;
    solo.textContent = t.solo ? "Soloed" : "Solo";
    solo.onclick = () => {
      t.solo = !t.solo;
      if (t.solo) t.muted = false;
      buildTrackUI();
      rescheduleTransport();
    };

    row.appendChild(swatch);
    row.appendChild(title);
    row.appendChild(mute);
    row.appendChild(solo);
    tracksPanel.appendChild(row);

    if (shouldUseLocalAudio()) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        volume: -8,
        oscillator: { type: "triangle" },

        envelope: { attack: 0.01, decay: 0.1, sustain: 0.25, release: 1.05 },
      }).toDestination();
      app.synths[idx] = synth;
    }
  });
}

function scheduleIfNeeded() {
  if (!app.midi || app.scheduled) return;
  Tone.Transport.cancel();
  const now = 0;

  const isSoloActive = app.tracks.some((t) => t.solo);

  app.tracks.forEach((t, ti) => {
    const synth = app.synths[ti];
    const enabled = isSoloActive ? t.solo : !t.muted;
    if (!enabled) return;
    const filtered = t.notes.filter(n => handFilter(n));
    filtered.forEach((n) => {
      const time = n.time + now;
      Tone.Transport.schedule((schedTime) => {
        const midiOut = applyTranspose(n.midi);
        if (shouldUseLocalAudio() && synth) {
          synth.triggerAttackRelease(Tone.Frequency(midiOut, "midi").toFrequency(), n.duration, schedTime, n.velocity);
        }

        sendNoteOn(midiOut, Math.round(n.velocity * 127), t.channel);
      }, time);

      Tone.Transport.schedule(() => {
        handleNoteOnVisual(applyTranspose(n.midi), t.channel, colorForNoteObj(n));
      }, time);

      Tone.Transport.schedule(() => {
        handleNoteOffVisual(applyTranspose(n.midi), t.channel, colorForNoteObj(n));
        const offDelay = app.midiIO.tailMs / 1000;
        const midiOut = applyTranspose(n.midi);
        setTimeout(() => sendNoteOff(midiOut, t.channel), Math.max(0, offDelay * 1000));
      }, time + n.duration);
      if (modeSelect.value === 'practice') app.practice.stats.total++;
    });
  });

  if (app.midi) {
    const isSolo = isSoloActive;
    app.midi.tracks.forEach((mt, mi) => {
      const enabledTrack = isSolo ? app.tracks[mi]?.solo : !app.tracks[mi]?.muted;
      if (!enabledTrack) return;
      const channel = (typeof mt.channel === 'number') ? mt.channel : (app.tracks[mi]?.channel ?? 0);
      const cc64Arr = mt.controlChanges && (mt.controlChanges[64] || mt.controlChanges["64"]) || [];
      cc64Arr.forEach(cc => {
        const val = Math.round((cc.value ?? 0) * 127);
        Tone.Transport.schedule(() => {
          // Update local sustain state and forward CC if applicable
          updateSustainState(channel, val >= 64, getPlaybackTime());
          sendCC(64, val, channel);
        }, (cc.time ?? 0) + now);
      });
    });
  }

  if (modeSelect.value === 'practice') {
    buildPracticeGroups();
    app.practice.groups.forEach((g, idx) => {
      const pauseAt = Math.max(0, g.time - 0.02);
      Tone.Transport.schedule(() => {
        maybePauseForGroup(idx);
      }, pauseAt);
    });
  }

  Tone.Transport.scheduleRepeat(() => {
    const t = getPlaybackTime();
    updateTimeUI(t);

    // Staff scrolling removed; avoid calling undefined function

    if (app.practice.loop.enabled) {
      const loop = app.practice.loop;
      const { start, end, pauseMs } = loop;
      if (end > start && !loop._pending && t >= end) {
        loop._pending = true;
        const wasRunning = (Tone.Transport.state === 'started');
        try { Tone.Transport.pause(); } catch {}
        if (loop._timer) { try { clearTimeout(loop._timer); } catch {} loop._timer = null; }
        loop._timer = setTimeout(() => {
          loop._timer = null;
          try { Tone.Transport.seconds = start; } catch {}
          ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
          if (wasRunning) { try { Tone.Transport.start(); } catch {} }
          loop._pending = false;
        }, Math.max(0, pauseMs || 300));
      }
    }
  }, 0.05);

  app.scheduled = true;
}

function rescheduleTransport() {
  if (!app.midi) return;
  const wasStarted = Tone.Transport.state === "started";
  const current = Tone.Transport.seconds;
  Tone.Transport.stop();
  Tone.Transport.seconds = current;
  app.scheduled = false;
  scheduleIfNeeded();
  if (wasStarted) {
    Tone.Transport.start();
  }
}

btnPlay.addEventListener("click", async () => {
  await Tone.start(); 
  try { Tone.getContext().lookAhead = Math.max(0.1, Tone.getContext().lookAhead || 0.12); } catch {}
  if (!app.midi) return showOverlay("Upload a MIDI file first");
  scheduleIfNeeded();
  await doCountdownIfNeeded();

  Tone.Transport.start(`+${START_DELAY}`);
  startAnimation();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';

});

btnPause.addEventListener("click", () => {
  Tone.Transport.pause();
  stopAnimation({ clear: false });
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Play';
});

btnStop.addEventListener("click", () => {
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  updateTimeUI(0);
  stopAnimation({ clear: true });
  panicAll();
  clearLoopTimer();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Play';
  // Clear any lingering visual state
  app.liveKeys.clear();
  app.keyGlow.clear();
  app.upcomingKeys.clear();
  app._lastLandingFlash.clear();
});

btnRestart.addEventListener("click", () => {
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  clearLoopTimer();
  // Clear any lingering visual state
  app.liveKeys.clear();
  app.keyGlow.clear();
  app.upcomingKeys.clear();
  app._lastLandingFlash.clear();
  scheduleIfNeeded();

  Tone.Transport.start(`+${START_DELAY}`);
  startAnimation();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';
});

progress.addEventListener("input", () => {
  if (!app.midi) return;
  const pct = parseFloat(progress.value) / 100;
  const t = pct * app.duration;

  Tone.Transport.seconds = t;
  updateTimeUI(t);

  ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  drawNotes(t);
  drawKeyboard();
  clearLoopTimer();
});

speed.addEventListener("input", () => {
  const v = parseFloat(speed.value);

  const newBpm = clamp(app._originalBpm * v, 20, 300);
  Tone.Transport.bpm.value = newBpm;
  speedLabel.textContent = `${Math.round(v * 100)}%`;
});

modeSelect.addEventListener("change", () => {
  showOverlay(`${modeSelect.value === "practice" ? "Practice" : "Listen"} Mode`);
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
  rescheduleTransport();
  savePref('mode', modeSelect.value);
  if (practiceToggle) practiceToggle.checked = (modeSelect.value === 'practice');
});

noteWaitToggle?.addEventListener('change', () => {
  app.practice.noteWait = noteWaitToggle.checked;
  rescheduleTransport();
  savePref('noteWait', noteWaitToggle.checked);
});

handLeftBtn?.addEventListener('click', () => setHand('left'));
handRightBtn?.addEventListener('click', () => setHand('right'));
handBothBtn?.addEventListener('click', () => setHand('both'));

loopToggle?.addEventListener('change', () => {
  app.practice.loop.enabled = loopToggle.checked;
  savePref('loopEnabled', loopToggle.checked);
  if (!app.practice.loop.enabled) clearLoopTimer();
});
loopStartInput?.addEventListener('input', () => {
  app.practice.loop.start = Math.max(0, parseFloat(loopStartInput.value) || 0);
  savePref('loopStart', app.practice.loop.start);
  clearLoopTimer();
});
loopEndInput?.addEventListener('input', () => {
  app.practice.loop.end = Math.max(0, parseFloat(loopEndInput.value) || 0);
  savePref('loopEnd', app.practice.loop.end);
  clearLoopTimer();
});

feedbackClose?.addEventListener('click', () => {
  feedbackModal.classList.add('hidden');
});

openMIDISettingsBtn?.addEventListener('click', () => midiModal?.classList.remove('hidden'));
midiClose?.addEventListener('click', () => midiModal?.classList.add('hidden'));
openTransposeSettingsBtn?.addEventListener('click', () => transposeModal?.classList.remove('hidden'));
transposeClose?.addEventListener('click', () => transposeModal?.classList.add('hidden'));
refreshMIDI?.addEventListener('click', () => initMIDI(true));
practiceToggle?.addEventListener('change', () => {
  const on = practiceToggle.checked;
  modeSelect.value = on ? 'practice' : 'listen';
  const event = new Event('change');
  modeSelect.dispatchEvent(event);
  savePref('practiceToggle', on);
});
testNoteBtn?.addEventListener('click', () => {

  sendNoteOn(60, 100);
  setTimeout(() => sendNoteOff(60), 250 + (app.midiIO.tailMs || 0));
});
midiThruToggle?.addEventListener('change', () => {
  app.midiIO.thru = !!midiThruToggle.checked;
  savePref('midiThru', app.midiIO.thru);
});
tailMsInput?.addEventListener('input', () => {
  const v = parseInt(tailMsInput.value || '0', 10);
  app.midiIO.tailMs = v;
  if (tailMsLabel) tailMsLabel.textContent = `${v}ms`;
});

function showMidiTab() {
  if (!midiSettingsTab || !visualSettingsTab || !settingsTabMidi || !settingsTabVisuals) return;
  midiSettingsTab.classList.remove('hidden');
  visualSettingsTab.classList.add('hidden');

  settingsTabMidi.classList.add('text-blue-400', 'border-blue-500');
  settingsTabMidi.classList.remove('border-transparent');

  settingsTabVisuals.classList.remove('text-blue-400', 'border-blue-500');
  settingsTabVisuals.classList.add('border-transparent');
}
function showVisualsTab() {
  if (!midiSettingsTab || !visualSettingsTab || !settingsTabMidi || !settingsTabVisuals) return;
  midiSettingsTab.classList.add('hidden');
  visualSettingsTab.classList.remove('hidden');

  settingsTabVisuals.classList.add('text-blue-400', 'border-blue-500');
  settingsTabVisuals.classList.remove('border-transparent');

  settingsTabMidi.classList.remove('text-blue-400', 'border-blue-500');
  settingsTabMidi.classList.add('border-transparent');
}
settingsTabMidi?.addEventListener('click', showMidiTab);
settingsTabVisuals?.addEventListener('click', showVisualsTab);
openMIDISettingsBtn?.addEventListener('click', () => {
  midiModal?.classList.remove('hidden');

  showMidiTab();
});

radiusSelect?.addEventListener('change', () => savePref('radius', radiusSelect.value));
trailToggle?.addEventListener('change', () => savePref('trails', trailToggle.checked));
bounceToggle?.addEventListener('change', () => savePref('bounce', bounceToggle.checked));

btnPianoMode?.addEventListener('click', () => {
  if (!pianoFs || !pianoFsCanvasWrap) return;
  canvasOriginalParent = canvas.parentElement;
  pianoFs.classList.remove('hidden');
  pianoFsCanvasWrap.appendChild(canvas);
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = (Tone.Transport.state === 'started') ? 'Pause' : 'Play';
  requestAnimationFrame(() => resizeCanvas());
});
fsExit?.addEventListener('click', () => {
  if (!pianoFs || !canvasOriginalParent) return;
  canvasOriginalParent.appendChild(canvas);
  pianoFs.classList.add('hidden');
  requestAnimationFrame(() => resizeCanvas());
});
fsPlayPause?.addEventListener('click', async () => {
  await Tone.start();
  try {
    Tone.getContext().latencyHint = 'interactive';
    Tone.getContext().lookAhead = Math.max(0.1, Tone.getContext().lookAhead || 0.12);
  } catch {}
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause();
    fsPlayPauseIcon.textContent = 'Play';
  } else {
    scheduleIfNeeded();

    const atStart = (Tone.Transport.seconds || 0) < 0.02;
    Tone.Transport.start(atStart ? `+${START_DELAY}` : undefined);
    startAnimation();
    fsPlayPauseIcon.textContent = 'Pause';
  }
});
enhancedToggle?.addEventListener('change', () => savePref('enhanced', enhancedToggle.checked));
hitLineToggle?.addEventListener('change', () => savePref('hitLine', hitLineToggle.checked));
noteOpacity?.addEventListener('input', () => { const v = parseFloat(noteOpacity.value || '0.95'); savePref('noteOpacity', v); if (noteOpacityLabel) noteOpacityLabel.textContent = `${Math.round(v*100)}%`; });
glowIntensity?.addEventListener('input', () => { const v = parseFloat(glowIntensity.value || '1'); savePref('glowIntensity', v); if (glowIntensityLabel) glowIntensityLabel.textContent = `${v.toFixed(1)}x`; });
visualLatencyInput?.addEventListener('input', () => {
  const ms = parseInt(visualLatencyInput.value || '0', 10);
  const sec = clamp(ms / 1000, -0.25, 0.25); // clamp to ±250ms
  VISUAL_LATENCY = sec;
  savePref('visualLatencyOffset', sec);
  if (visualLatencyLabel) visualLatencyLabel.textContent = `${ms} ms`;
});

function isBlackKey(midi) {
  const pitchClass = midi % 12;
  return [1, 3, 6, 8, 10].includes(pitchClass);
}

function midiToX(midi) {

  const idx = midi - FIRST_MIDI;
  const whiteKeys = [];
  for (let i = FIRST_MIDI; i <= LAST_MIDI; i++) if (!isBlackKey(i)) whiteKeys.push(i);
  const keyWidth = WIDTH / whiteKeys.length;

  let whiteIndex = 0;
  for (let i = FIRST_MIDI; i < midi; i++) if (!isBlackKey(i)) whiteIndex++;
  let x = whiteIndex * keyWidth;

  if (isBlackKey(midi)) x -= keyWidth * 0.3;
  return x;
}

function keyWidthFor(midi) {
  const whiteCount = (() => {
    let c = 0;
    for (let i = FIRST_MIDI; i <= LAST_MIDI; i++) if (!isBlackKey(i)) c++;
    return c;
  })();
  const whiteW = WIDTH / whiteCount;
  return isBlackKey(midi) ? whiteW * 0.6 : whiteW;
}

function drawKeyboard() {
  const kbY = HEIGHT - KEYBOARD_HEIGHT;
  ctx.save();

  ctx.fillStyle = "#0b1220"; 
  ctx.fillRect(0, kbY, WIDTH, KEYBOARD_HEIGHT);

  ctx.fillStyle = "#f9fafb"; 
  let wIdx = 0;
  const whiteKeys = [];
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!isBlackKey(m)) {
      whiteKeys.push(m);
    }
  }
  const whiteW = WIDTH / whiteKeys.length;
  whiteKeys.forEach((m) => {
    const x = wIdx * whiteW;
    const pressed = app.liveKeys.has(m);

    const glow = getKeyGlowLevel(m);
    const color = getKeyGlowColor(m, "#60a5fa");
    const fill = "#ffffff";
    ctx.fillStyle = fill;
    ctx.fillRect(x, kbY, whiteW - 1, KEYBOARD_HEIGHT);
    ctx.fillStyle = "#111827";
    ctx.fillRect(x + whiteW - 1, kbY, 1, KEYBOARD_HEIGHT);

      if (pressed || glow > 0.01) {
        const grad = ctx.createLinearGradient(x, kbY, x, kbY + KEYBOARD_HEIGHT);
        grad.addColorStop(0, hexToRgba(color, 0.55 * glow + (pressed ? 0.35 : 0)));
        grad.addColorStop(1, hexToRgba(color, 0.15 * glow + (pressed ? 0.15 : 0)));
        ctx.fillStyle = grad;
        ctx.fillRect(x, kbY, whiteW - 1, KEYBOARD_HEIGHT);
      }

    ctx.strokeStyle = pressed ? "rgba(239,68,68,0.95)" : "rgba(239,68,68,0.6)"; 
    ctx.lineWidth = pressed ? 2 : 1;
    ctx.strokeRect(x + 0.5, kbY + 0.5, whiteW - 2, KEYBOARD_HEIGHT - 1);
    wIdx++;
  });

  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (isBlackKey(m)) {
      const x = midiToX(m);
      const w = keyWidthFor(m);
      const pressed = app.liveKeys.has(m);
      const glow = getKeyGlowLevel(m);
      const color = getKeyGlowColor(m, "#60a5fa");

      ctx.fillStyle = "#1f2937"; 
      ctx.fillRect(x, kbY, w, KEYBOARD_HEIGHT * 0.6);

      if (pressed || glow > 0.01) {
        const grad = ctx.createLinearGradient(x, kbY, x, kbY + KEYBOARD_HEIGHT * 0.6);
        grad.addColorStop(0, hexToRgba(color, 0.6 * glow + (pressed ? 0.4 : 0)));
        grad.addColorStop(1, hexToRgba(color, 0.2 * glow + (pressed ? 0.2 : 0)));
        ctx.fillStyle = grad;
        ctx.fillRect(x, kbY, w, KEYBOARD_HEIGHT * 0.6);
      }

      ctx.strokeStyle = pressed ? "rgba(239,68,68,0.95)" : "rgba(239,68,68,0.6)"; 
      ctx.lineWidth = pressed ? 2 : 1;
      ctx.strokeRect(x + 0.5, kbY + 0.5, w - 1, KEYBOARD_HEIGHT * 0.6 - 1);
    }
  }

  if (!hitLineToggle || hitLineToggle.checked) {
    ctx.strokeStyle = "#38bdf8"; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, hitLineY());
    ctx.lineTo(WIDTH, hitLineY());
    ctx.stroke();
  }

  ctx.restore();
}

function drawNotes(currentTime) {
  if (!app.midi) return;

  const timeAdvanced = lastTimeDrawn < 0 || Math.abs(currentTime - lastTimeDrawn) > 1e-3;
  if (TRAILS_ENABLED && trailToggle?.checked && Tone.Transport.state === "started" && timeAdvanced) {
    ctx.fillStyle = "rgba(9, 12, 22, 0.25)"; 
    ctx.fillRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  } else {
    ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  }

  if (enhancedToggle?.checked) {
    ctx.fillStyle = "rgba(2,6,14,0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  }

  // Grid lines feature removed

  const FALL_DURATION = NOTE_FALL_DURATION; // seconds
  const SPAWN_EARLY = 0.03; // small pre-spawn window for stability

  const isSoloActive = app.tracks.some((t) => t.solo);

  const nowMs = performance.now();
  const pulse = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(nowMs / 250)); 
  const waitingRequired = app.practice.waiting ? new Set(app.practice.requiredSet) : null;

  app.upcomingKeys.clear();

  const overlapMap = new Map(); 

  app.tracks.forEach((t) => {
    const enabled = isSoloActive ? t.solo : !t.muted;
    if (!enabled) return;
  const tNotes = t.notes.filter(n => handFilter(n));

  tNotes.forEach((n) => {
    const start = n.time; // MIDI event time (audio note-on)
    const end = n.time + n.duration;
    if (currentTime >= end) return;

    // Visual start time: spawn so that the note reaches hit line exactly at 'start'
    const startTime = start - FALL_DURATION; // baseline
    if (currentTime < startTime - SPAWN_EARLY) return; // not yet spawned

  const visMidi = applyTranspose(n.midi);
  let x = midiToX(visMidi);
  const baseW = keyWidthFor(visMidi) * 0.9;
  let w = baseW;
      const baseH = Math.max(6, n.duration * (HEIGHT - KEYBOARD_HEIGHT) / FALL_DURATION);
      const r = getRadius();
      const targetY = hitLineY();
      const startY = -40; 

      // Progress of fall strictly from visual clock aligned to playback
      const tNorm = clamp((currentTime - startTime + VISUAL_LATENCY) / FALL_DURATION, 0, 1);
      const eased = easeInQuad(tNorm); // smooth but precise
      const y = startY + (targetY - startY) * eased;
      let h;
      if (currentTime < start) {
        h = baseH; // pre-hit: full height
      } else {
        const remaining = end - currentTime;
        const frac = clamp(remaining / n.duration, 0, 1);
        h = Math.max(0, baseH * frac);
        if (h < 1.5) return;
      }

      const bucket = Math.round(start * 100) / 100; 
      const key = `${bucket}:${n.midi}`;
      const idx = overlapMap.get(key) || 0;
      overlapMap.set(key, idx + 1);
      x += (idx % 2 === 0 ? 1 : -1) * Math.min(2, idx);

  const col = colorForNoteObj(n);

      const isWaitingNote = waitingRequired?.has(n.midi) && Math.abs(start - currentTime) < 2; 
      if (isWaitingNote) {
        w = baseW * (0.95 + 0.06 * pulse);
      }

      const baseOpacity = parseFloat(noteOpacity?.value || '0.95');
      const grad = ctx.createLinearGradient(x, y - h, x, y);
      grad.addColorStop(0, hexToRgba(col, Math.min(1, baseOpacity * 0.8)));
      grad.addColorStop(1, hexToRgba(shadeColor(col, -10), Math.min(1, baseOpacity * 1.0)));
      ctx.fillStyle = grad;
      roundRect(ctx, x, y - h, w, h, r);
      ctx.fill();

  if (SHADOWS_ENABLED) {
    ctx.save();
    const glowFactor = parseFloat(glowIntensity?.value || '1');
    ctx.shadowColor = hexToRgba(col, 0.35 * (enhancedToggle?.checked ? glowFactor : 0.8));
    ctx.shadowBlur = 8 * (enhancedToggle?.checked ? glowFactor : 0.8);
    ctx.shadowOffsetY = 2;
    roundRect(ctx, x, y - h, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  const nearStart = Math.abs(start - currentTime) < 0.02 || Math.abs(1 - tNorm) < 0.02;
      const pressed = app.liveKeys.has(n.midi);
      const isWaitingTarget = app.practice.waiting && waitingRequired?.has(n.midi);
      if (nearStart || isWaitingTarget) {

        ctx.strokeStyle = pressed ? "#22c55e" : (isWaitingTarget ? "#ef4444" : "#f43f5e");
        ctx.lineWidth = 2;
        roundRect(ctx, x, y - h, w, h, r);
        ctx.stroke();
        if (isWaitingTarget && SHADOWS_ENABLED) {
          ctx.save();
          const glowFactor = parseFloat(glowIntensity?.value || '1');
          ctx.shadowColor = hexToRgba('#ef4444', 0.7);
          ctx.shadowBlur = 12 * pulse * (enhancedToggle?.checked ? glowFactor : 1);
          roundRect(ctx, x, y - h, w, h, r);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (start - currentTime <= 0.4 && start - currentTime > 0) {
        app.upcomingKeys.add(visMidi);
        startKeyGlow(visMidi, true, col);
      }

      if (LANDING_FLASH_ENABLED) {
        if (Math.abs(start - currentTime) < 1/90) {
          const last = app._lastLandingFlash.get(visMidi) || 0;
          const now = performance.now();
          if (now - last > 180) {
            keyLandingFlash(visMidi, col);
            app._lastLandingFlash.set(visMidi, now);
          }
        }
      }
    });
  });
}

// drawBeatGrid removed

function keyLandingFlash(midi, col) {
  const now = performance.now();
  // Use a brighter variant of the note color instead of pure white to avoid white flashes
  const bright = shadeColor(col || '#60a5fa', 20);
  app.keyGlow.set(midi, { state: 'fade-in', start: now, end: now + 60, color: bright });
  setTimeout(() => {
    startKeyGlow(midi, true, col);
    setTimeout(() => startKeyGlow(midi, false, col), 120);
  }, 70);
}

let rafId = null;
let animRunning = false;
let lastTimeDrawn = -1;
function startAnimation() {
  if (animRunning) return;
  animRunning = true;
  cancelAnimationFrame(rafId);
  const loop = () => {
    if (!animRunning) return;
    const t = getPlaybackTime();
    drawNotes(t);
    drawKeyboard();

    updateTimeUI(t);
    lastTimeDrawn = t;
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}
function stopAnimation({ clear = false } = {}) {
  animRunning = false;
  cancelAnimationFrame(rafId);
  if (clear) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
    drawKeyboard();
  }
}

function updateTimeUI(t) {
  const d = app.duration || 0;
  timeLabel.textContent = `${formatTime(t)} / ${formatTime(d)}`;
  const pct = d ? (t / d) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, pct));
  if (!isNaN(clamped)) setProgressPercent(clamped);
  if (d && t >= d && !app.practice.loop.enabled) {

    Tone.Transport.stop();
    stopAnimation({ clear: true });
    if (modeSelect.value === 'practice') showFeedback();
  }
}

function setProgressPercent(pct) {
  try {
    progress.value = String(pct);

    progress.style.setProperty('--progress', `${pct}%`);
  } catch {}
}

// Clear any pending loop timers and reset loop state
function clearLoopTimer() {
  const loop = app.practice?.loop;
  if (!loop) return;
  if (loop._timer) {
    try { clearTimeout(loop._timer); } catch {}
    loop._timer = null;
  }
  loop._pending = false;
}

const BASE_TOLERANCE = 0.1; 

async function initMIDI(forceRefresh = false) {
  if (!navigator.requestMIDIAccess) {
    midiStatus.textContent = "Web MIDI not supported (HTTPS/localhost).";
    if (midiConnDot) midiConnDot.style.backgroundColor = '#ef4444';
    return;
  }
  try {
    if (!app.midiIO.access || forceRefresh) {
      app.midiIO.access = await navigator.requestMIDIAccess({ sysex: false });
      app.midiIO.access.onstatechange = () => populateMIDIDevices();
    }
    populateMIDIDevices();
  } catch (e) {
    midiStatus.textContent = "MIDI access denied.";
    if (midiConnDot) midiConnDot.style.backgroundColor = '#ef4444';
  }
}

function populateMIDIDevices() {
  const access = app.midiIO.access;
  if (!access) return;
  app.midiIO.inputs = new Map(access.inputs);
  app.midiIO.outputs = new Map(access.outputs);

  if (midiInSelect) {
    midiInSelect.innerHTML = '';
    for (const [id, input] of app.midiIO.inputs) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = input.name || id;
      midiInSelect.appendChild(opt);
    }

    if (app.midiIO.inId && app.midiIO.inputs.has(app.midiIO.inId)) {
      midiInSelect.value = app.midiIO.inId;
    } else if (midiInSelect.options.length) {
      midiInSelect.selectedIndex = 0;
      app.midiIO.inId = midiInSelect.value;
    }

    bindSelectedInput();
    midiInSelect.onchange = () => {
      app.midiIO.inId = midiInSelect.value;
      bindSelectedInput();
      savePref('midiInId', app.midiIO.inId);
    };
  }
  if (midiOutSelect) {
    midiOutSelect.innerHTML = '';
    const DEFAULT_OUT_ID = 'default';

    const defOpt = document.createElement('option');
    defOpt.value = DEFAULT_OUT_ID;
    defOpt.textContent = 'Default (WebAudio)';
    midiOutSelect.appendChild(defOpt);
    for (const [id, output] of app.midiIO.outputs) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = output.name || id;
      midiOutSelect.appendChild(opt);
    }
    if (app.midiIO.outId && (app.midiIO.outId === DEFAULT_OUT_ID || app.midiIO.outputs.has(app.midiIO.outId))) {
      midiOutSelect.value = app.midiIO.outId;
    } else if (midiOutSelect.options.length) {

      midiOutSelect.value = DEFAULT_OUT_ID;
      app.midiIO.outId = DEFAULT_OUT_ID;
    }
    app.midiIO.output = (app.midiIO.outId && app.midiIO.outId !== DEFAULT_OUT_ID) ? (app.midiIO.outputs.get(app.midiIO.outId) || null) : null;
    midiOutSelect.onchange = () => {
      app.midiIO.outId = midiOutSelect.value;
      app.midiIO.output = (app.midiIO.outId && app.midiIO.outId !== DEFAULT_OUT_ID) ? (app.midiIO.outputs.get(app.midiIO.outId) || null) : null;
      savePref('midiOutId', app.midiIO.outId);

      try { app.synths.forEach(s => s.dispose?.()); } catch {}
      app.synths = [];
      buildTrackUI();
      rescheduleTransport();
    };
  }

  const inNames = [...app.midiIO.inputs.values()].map(i => i.name).join(', ');
  const outNames = [...app.midiIO.outputs.values()].map(o => o.name).join(', ');
  midiStatus.textContent = `MIDI In: ${inNames || '—'} | Out: ${outNames || '—'}`;
  if (midiConnDot) midiConnDot.style.backgroundColor = (app.midiIO.inputs.size || app.midiIO.outputs.size) ? '#22c55e' : '#ef4444';
}

function bindSelectedInput() {

  if (app.midiIO.input) {
    try { app.midiIO.input.onmidimessage = null; } catch {}
  }
  app.midiIO.input = app.midiIO.inputs.get(app.midiIO.inId) || null;
  if (app.midiIO.input) {
    app.midiIO.input.onmidimessage = onMIDIMessage;
  }
}

function onMIDIMessage(e) {
  const [status, data1, data2] = e.data;
  const cmd = status & 0xf0;
  const ch = status & 0x0f;
  const note = data1;
  const velocity = data2 / 127;
  const now = Tone.Transport.seconds;

  if (cmd === 0x90 && velocity > 0) {
    console.debug && console.debug(`[LP] Note ${note} ON ch${ch} at ${now.toFixed(3)}`);
  const tNote = applyTranspose(note);
    handleNoteOnVisual(tNote, ch, colorForIncoming(note));
    if (app.midiIO.thru) sendNoteOn(tNote, Math.round(velocity * 127));
  checkNoteHit(tNote, now);

    if (app.practice.waiting) {
      if (app.practice.requiredSet.has(tNote)) {
        app.practice.hitSet.add(tNote);
        if (isCurrentChordSatisfied()) {
          resumeFromGroupWait(now);
        }
      } else {
        flashKey(tNote, false);
        app.practice.stats.misses.push({ midi: tNote, time: now });
      }
    }
  } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
    console.debug && console.debug(`[LP] Note ${note} OFF ch${ch} at ${now.toFixed(3)}`);
    const tNote = applyTranspose(note);
    handleNoteOffVisual(tNote, ch, colorForIncoming(note));
    if (app.midiIO.thru) sendNoteOff(tNote);
  } else if (cmd === 0xB0) {

    const controller = data1 & 0x7f;
    const value = data2 & 0x7f;
    if (controller === 64) {
      updateSustainState(ch, value >= 64, now);
    }
    if (app.midiIO.thru) sendCC(controller, value);
  }
}

function updateSustainState(channel, isDown, now) {
  const wasDown = !!app.pedal.sustainDown.get(channel);
  app.pedal.sustainDown.set(channel, isDown);
  if (!isDown && wasDown) {
    // Pedal released: flush sustained notes
    const set = app.pedal.sustained.get(channel);
    if (set && set.size) {
      for (const midi of [...set]) {
        app.liveKeys.delete(midi);
        startKeyGlow(midi, false, getKeyGlowColor(midi));
        set.delete(midi);
      }
    }
  }
}

function ensureSustainSet(channel) {
  if (!app.pedal.sustained.has(channel)) app.pedal.sustained.set(channel, new Set());
  return app.pedal.sustained.get(channel);
}

function handleNoteOnVisual(midi, channel, color) {
  app.liveKeys.add(midi);
  startKeyGlow(midi, true, color);
  // Track for potential sustain
  ensureSustainSet(channel);
}

function handleNoteOffVisual(midi, channel, color) {
  const sustain = !!app.pedal.sustainDown.get(channel);
  const set = ensureSustainSet(channel);
  if (sustain) {
    // Defer release until pedal is lifted
    set.add(midi);
  } else {
    app.liveKeys.delete(midi);
    startKeyGlow(midi, false, color);
    set.delete(midi);
  }
}

function checkNoteHit(midi, timeSec) {
  if (!app.midi) return false;
  const tolerance = modeSelect.value === "practice" ? BASE_TOLERANCE * 0.8 : BASE_TOLERANCE * 1.2;

  const bucket = Math.round(timeSec * 10) / 10;
  const neighborBuckets = [bucket, Math.round((timeSec + 0.05) * 10) / 10, Math.round((timeSec - 0.05) * 10) / 10];

  let matched = false;
  for (const b of neighborBuckets) {
    const list = app.expectedNotesByTime.get(b);
    if (!list) continue;
    for (const exp of list) {
      if (!exp.hit && applyTranspose(exp.midi) === midi && Math.abs(exp.time - timeSec) <= tolerance) {
        exp.hit = true;
        matched = true;
        app.score += 1;
        scoreEl.textContent = String(app.score);
        flashKey(midi, true);

        startKeyGlow(midi, true, '#22c55e');
        setTimeout(() => startKeyGlow(midi, false, '#22c55e'), 140);
        return true;
      }
    }
  }

  flashKey(midi, false);

  startKeyGlow(midi, true, '#ef4444');
  setTimeout(() => startKeyGlow(midi, false, '#ef4444'), 200);
  return false;
}

function flashKey(midi, ok) {

  showOverlay(ok ? "Correct!" : "Oops", 400);
}

async function loadPracticeStats() {
  try {
    const s = localStorage.getItem('practiceStats');
    if (!s) return false;
    const obj = JSON.parse(s);
    if (obj && typeof obj === 'object') {
      app.practice.stats = {
        total: Number(obj.total) || 0,
        correct: Number(obj.correct) || 0,
        misses: Array.isArray(obj.misses) ? obj.misses : [],
        timings: Array.isArray(obj.timings) ? obj.timings : [],
      };
      return true;
    }
  } catch (e) {
    __LP_LOAD_ERRORS++;
  console.warn('[KeyMistry] Failed to load practiceStats', e);
  }
  return false;
}

function anySavedDataPresent() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith(PREF_PREFIX) || k === 'practiceStats' || k === 'lp_last_midi_b64' || k === 'lp_last_midi_name') return true;
    }
  } catch {}
  return false;
}

async function bootstrap() {
  try {
    setLoadingHeadline('Loading your practice setup…');
    setLoadingStatus('Loading preferences…');
    // Migrate old LearnPiano keys to KeyMistry if present
    try {
      const oldPrefix = 'lp_pref_';
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (k.startsWith(oldPrefix)) {
          const v = localStorage.getItem(k);
          const newKey = 'km_pref_' + k.slice(oldPrefix.length);
          if (localStorage.getItem(newKey) == null && v != null) {
            localStorage.setItem(newKey, v);
          }
        }
      }
      // Also migrate saved MIDI blobs and names
      const oldMidi = localStorage.getItem('lp_last_midi_b64');
      const oldName = localStorage.getItem('lp_last_midi_name');
      if (oldMidi && !localStorage.getItem('km_last_midi_b64')) localStorage.setItem('km_last_midi_b64', oldMidi);
      if (oldName && !localStorage.getItem('km_last_midi_name')) localStorage.setItem('km_last_midi_name', oldName);
    } catch {}
    applyPrefsToUI();

    setLoadingStatus('Loading MIDI config…');
    await initMIDI();

    setLoadingStatus('Loading practice progress…');
    await loadPracticeStats();
    updatePreviousButtonLabel();

    const hadAny = anySavedDataPresent();
    if (!hadAny || __LP_LOAD_ERRORS > 0) {
      setLoadingHeadline('Starting fresh…');
      setLoadingStatus(__LP_LOAD_ERRORS > 0 ? 'Some saved data could not be read.' : '');
      await sleep(1500);
    } else {
  const b64 = localStorage.getItem('km_last_midi_b64') || localStorage.getItem('lp_last_midi_b64');
  const name = localStorage.getItem('km_last_midi_name') || localStorage.getItem('lp_last_midi_name');
      if (b64) {
        setLoadingStatus('Loading previous MIDI…');
        try {
          const binStr = atob(b64);
          const bytes = new Uint8Array(binStr.length);
          for (let i=0;i<binStr.length;i++) bytes[i] = binStr.charCodeAt(i);
          const midi = new Midi(bytes.buffer);
          initFromMidi(midi);
          if (name) showOverlay(`Loaded previous: ${name}`);
        } catch (e) {
          __LP_LOAD_ERRORS++;
          console.warn('[KeyMistry] Failed to load previous MIDI', e);
        }
      }
      await sleep(300);
    }
  } finally {
    hideLoadingOverlay();
  }
}

drawKeyboard();
bootstrap();

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex, a) {
  const c = hex.replace('#', '');
  const bigint = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function shadeColor(hex, percent) {
  const c = hex.replace('#', '');
  const bigint = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r = Math.round(r * (100 + percent) / 100);
  g = Math.round(g * (100 + percent) / 100);
  b = Math.round(b * (100 + percent) / 100);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInQuad(t) {
  return t * t;
}

function getRadius() {
  switch (radiusSelect?.value) {
    case 'square': return 2;
    case 'pill': return 24;
    case 'soft':
    default: return 10;
  }
}

function startKeyGlow(midi, pressed, color) {
  const now = performance.now();
  const item = app.keyGlow.get(midi) || { state: 'idle', start: now, color };
  if (pressed) {
    app.keyGlow.set(midi, { state: 'fade-in', start: now, end: now + 100, color });
  } else {
    // Faster fade-out for snappier release (~200ms)
    app.keyGlow.set(midi, { state: 'fade-out', start: now, end: now + 200, color: item.color || color });
  }
}

function getKeyGlowLevel(midi) {
  const now = performance.now();
  const item = app.keyGlow.get(midi);
  if (!item) return 0;
  if (item.state === 'fade-in') {
    const t = clamp((now - item.start) / (item.end - item.start), 0, 1);
    if (t >= 1) app.keyGlow.set(midi, { state: 'hold', start: now, color: item.color });
    return t;
  }
  if (item.state === 'hold') {
    return 1;
  }
  if (item.state === 'fade-out') {
    const t = clamp((now - item.start) / (item.end - item.start), 0, 1);
    if (t >= 1) app.keyGlow.delete(midi);
    return 1 - t;
  }
  return 0;
}

function getKeyGlowColor(midi, fallback = "#60a5fa") {
  const item = app.keyGlow.get(midi);
  return item?.color || handColorForMidi(midi) || fallback;
}

fallTime?.addEventListener('input', () => {
  NOTE_FALL_DURATION = parseFloat(fallTime.value);
  fallTimeLabel.textContent = `${NOTE_FALL_DURATION.toFixed(1)}s`;
  savePref('fallTime', NOTE_FALL_DURATION);
});

function setHand(hand) {
  app.practice.hand = hand;
  if (handLeftBtn && handRightBtn && handBothBtn) {
    handLeftBtn.className = `px-2 py-1 ${hand === 'left' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`;
    handBothBtn.className = `px-2 py-1 ${hand === 'both' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`;
    handRightBtn.className = `px-2 py-1 ${hand === 'right' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`;
  }
  buildPracticeGroups();
  rescheduleTransport();
}

function handFilter(n) {
  const threshold = applyTranspose(60);
  if (app.practice?.hand === 'left') return applyTranspose(n.midi) < threshold;
  if (app.practice?.hand === 'right') return applyTranspose(n.midi) >= threshold;
  return true;
}

async function doCountdownIfNeeded() {
  if (modeSelect.value !== 'practice') return;
  if (!countdownEl) return;
  countdownEl.classList.remove('hidden');
  for (let i = 3; i >= 1; i--) {
    countdownEl.textContent = String(i);
    await sleep(500);
  }
  countdownEl.classList.add('hidden');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function initNoteWait() {
  const t = Tone.Transport.seconds;
  const all = app.tracks.flatMap((tr, ti) => tr.notes.map(n => ({...n, color: app.tracks[ti].color})));
  const next = all.filter(handFilter).filter(n => n.time >= t).sort((a,b)=>a.time-b.time)[0];
  if (next) {
    app.practice.waiting = true;
    app.practice.nextExpected = { midi: next.midi, time: next.time, id: next.id, color: next.color };
    Tone.Transport.pause();
  }
}

function buildPracticeGroups() {
  if (!app.midi) { app.practice.groups = []; return; }
  const all = app.tracks.flatMap((tr) => tr.notes);
  const filtered = all.filter(n => handFilter(n));
  const sorted = filtered.sort((a,b)=>a.time - b.time);
  const groups = [];
  const tol = 0.05; 
  let current = null;
  for (const n of sorted) {
    if (!current || Math.abs(n.time - current.time) > tol) {
      current = { time: n.time, notes: [applyTranspose(n.midi)], ids: [n.id] };
      groups.push(current);
    } else {
      current.notes.push(applyTranspose(n.midi));
      current.ids.push(n.id);
    }
  }
  app.practice.groups = groups;
  app.practice.currentIndex = 0;
}

function maybePauseForGroup(index) {
  if (!app.practice.noteWait || modeSelect.value !== 'practice') return;
  const g = app.practice.groups[index];
  if (!g) return;
  const t = Tone.Transport.seconds;

  if (t > g.time + 0.02) return;

  if (app.practice.waiting && app.practice.currentIndex === index) return;
  app.practice.waiting = true;
  app.practice.currentIndex = index;
  app.practice.requiredSet = new Set(g.notes);
  app.practice.hitSet = new Set();
  app.practice.lastWaitTime = g.time;
  Tone.Transport.pause();
}

function isCurrentChordSatisfied() {
  if (!app.practice.waiting) return false;
  for (const n of app.practice.requiredSet) {
    if (!app.practice.hitSet.has(n)) return false;
  }
  return true;
}

function resumeFromGroupWait(now) {
  app.practice.waiting = false;

  app.practice.stats.correct += app.practice.requiredSet.size;
  const delta = now - (app.practice.lastWaitTime ?? now);
  app.practice.stats.timings.push(delta);

  Tone.Transport.start();
}

function showFeedback() {
  if (!feedbackModal) return;
  const { total, correct, timings, misses } = app.practice.stats;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  if (accPercentEl) accPercentEl.textContent = String(percent);
  if (accCorrectEl) accCorrectEl.textContent = String(correct);
  if (accTotalEl) accTotalEl.textContent = String(total);
  if (missListEl) {
    missListEl.innerHTML = '';
    misses.forEach(m => {
      const li = document.createElement('li');
      li.textContent = `Note ${m.midi} at ${formatTime(m.time)}`;
      missListEl.appendChild(li);
    });
  }
  try { localStorage.setItem('practiceStats', JSON.stringify(app.practice.stats)); } catch {}
  feedbackModal.classList.remove('hidden');
}

function sendNoteOn(midi, velocity = 100, channel = 0) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0x90 | (channel & 0x0f);
  try { out.send([status, midi & 0x7f, clamp(velocity, 0, 127)]); } catch {}
}
function sendNoteOff(midi, channel = 0) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0x80 | (channel & 0x0f);
  try { out.send([status, midi & 0x7f, 0x00]); } catch {}
}
function sendCC(controller, value, channel = 0) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0xB0 | (channel & 0x0f);
  try { out.send([status, controller & 0x7f, clamp(value, 0, 127)]); } catch {}
}

function panicAll() {

  for (let ch = 0; ch < 16; ch++) {
    sendCC(64, 0, ch); 
    const out = app.midiIO.output;
    if (!out) continue;
    try { out.send([0xB0 | ch, 123, 0]); } catch {}
  }
}

function handColorForMidi(midi) {
  // This function expects visual MIDI (already transposed if needed)
  return midi < 60 ? '#60a5fa' : '#fb923c';
}

function colorForNoteObj(n) {
  const trackCount = app.tracks?.length || 0;
  if (trackCount > 1) {

    if (n.trackIndex === 0) return '#60a5fa';
    if (n.trackIndex === 1) return '#fb923c';
    return TRACK_COLORS[n.trackIndex % TRACK_COLORS.length] || '#a78bfa';
  }
  return handColorForMidi(applyTranspose(n.midi));
}

function colorForIncoming(midi) {
  const trackCount = app.tracks?.length || 0;
  if (trackCount <= 1) return handColorForMidi(applyTranspose(midi));
  const now = Tone.Transport.seconds;
  let best = null;
  for (let ti = 0; ti < app.tracks.length; ti++) {
    const notes = app.tracks[ti].notes;

    let nearestDt = Infinity;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.midi !== midi) continue;
      const dt = Math.abs(n.time - now);
      if (dt < nearestDt) {
        nearestDt = dt;
        best = { trackIndex: ti };
      }
      if (dt < 0.02) break; 
    }
  }
  if (best) {
    if (best.trackIndex === 0) return '#60a5fa';
    if (best.trackIndex === 1) return '#fb923c';
    return TRACK_COLORS[best.trackIndex % TRACK_COLORS.length] || '#a78bfa';
  }

  return handColorForMidi(midi);
}

function shouldUseLocalAudio() {

  return !app.midiIO.output; 
}

function getPlaybackTime() { try { return Tone.Transport.seconds || 0; } catch { return 0; } }

// ---------- Transpose & Key helpers ----------
function applyTranspose(midi) {
  const t = app.pitch?.transpose || 0;
  return clamp(Math.round(midi + t), 0, 127);
}

function updateEffectiveKeyLabel() {
  if (!effectiveKeyLabel) return;
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const tonic = (app.pitch.keyTonic || 0);
  const scale = app.pitch.keyScale || 'major';
  effectiveKeyLabel.textContent = `${names[tonic]} ${scale}`;
}

function detectKeyFromMidi() {
  if (!app.midi) return null;
  const maj = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
  const min = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const counts = new Array(12).fill(0);
  for (const tr of app.tracks) {
    for (const n of tr.notes) counts[n.midi % 12] += Math.max(1, n.duration);
  }
  const scoreFor = (profile) => {
    let best = { tonic: 0, score: -Infinity };
    for (let shift = 0; shift < 12; shift++) {
      let sc = 0;
      for (let i = 0; i < 12; i++) sc += counts[i] * profile[(12 + i - shift) % 12];
      if (sc > best.score) best = { tonic: shift, score: sc };
    }
    return best;
  };
  const M = scoreFor(maj);
  const m = scoreFor(min);
  const scale = M.score >= m.score ? 'major' : 'minor';
  const tonic = (scale === 'major' ? M.tonic : m.tonic) % 12;
  return { tonic, scale };
}

function getOriginalTonic() {
  // Prefer persisted original key, then detected, else assume C
  if (app.pitch.originalTonicPref != null) return app.pitch.originalTonicPref;
  if (app.pitch.detectedTonic != null) return app.pitch.detectedTonic;
  return 0;
}

function computeTransposeForTarget(targetTonic) {
  // We want: originalTonic + transpose ≡ targetTonic (mod 12)
  const orig = getOriginalTonic();
  let t = ((targetTonic - orig) % 12 + 12) % 12; // 0..11
  // Map to [-6, +6] where possible, then clamp to [-12, +12]
  if (t > 6) t = t - 12; // prefer negative equivalent
  return clamp(t, -12, 12);
}

function syncTransposeUI() {
  if (transposeInput) transposeInput.value = String(app.pitch.transpose);
  if (transposeLabel) transposeLabel.textContent = `${app.pitch.transpose}`;
}

// Bind transpose/key UI
transposeInput?.addEventListener('input', () => {
  const v = parseInt(transposeInput.value || '0', 10) || 0;
  app.pitch.transpose = clamp(v, -12, 12);
  if (transposeLabel) transposeLabel.textContent = `${app.pitch.transpose}`;
  savePref('transpose', app.pitch.transpose);
  // Keep selected key equal to effective key: selectedKey = original + transpose (mod 12)
  const newKey = ((getOriginalTonic() + app.pitch.transpose) % 12 + 12) % 12;
  app.pitch.keyTonic = newKey;
  if (keyTonicSelect) keyTonicSelect.value = String(newKey);
  savePref('keyTonic', newKey);
  // Clear visual/key states to prevent stuck highlights after transposition
  try {
    app.liveKeys.clear();
    app.keyGlow.clear();
    app.upcomingKeys.clear();
    app._lastLandingFlash.clear();
    // Clear sustained pedal buffers
    app.pedal.sustained.forEach(set => set.clear());
  } catch {}
  const t = getPlaybackTime();
  drawNotes(t); drawKeyboard();
  rescheduleTransport();
  updateEffectiveKeyLabel();
});
keyTonicSelect?.addEventListener('change', () => {
  app.pitch.keyTonic = parseInt(keyTonicSelect.value || '0', 10) || 0;
  savePref('keyTonic', app.pitch.keyTonic);
  // Adjust transpose so that effective key matches selected key
  const newT = computeTransposeForTarget(app.pitch.keyTonic);
  if (app.pitch.transpose !== newT) {
    app.pitch.transpose = newT;
    savePref('transpose', app.pitch.transpose);
    syncTransposeUI();
    // Clear visual/key states to prevent stuck highlights after transposition
    try {
      app.liveKeys.clear();
      app.keyGlow.clear();
      app.upcomingKeys.clear();
      app._lastLandingFlash.clear();
      app.pedal.sustained.forEach(set => set.clear());
    } catch {}
    const t = getPlaybackTime();
    drawNotes(t); drawKeyboard();
    rescheduleTransport();
  }
  updateEffectiveKeyLabel();
});
keyScaleSelect?.addEventListener('change', () => {
  app.pitch.keyScale = keyScaleSelect.value || 'major';
  savePref('keyScale', app.pitch.keyScale);
  updateEffectiveKeyLabel();
});
autoDetectKeyBtn?.addEventListener('click', () => {
  const r = detectKeyFromMidi();
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if (r) {
    app.pitch.detectedTonic = r.tonic;
    app.pitch.detectedScale = r.scale;
    if (detectedKeyLabel) detectedKeyLabel.textContent = `${names[r.tonic]} ${r.scale}`;
    if (keyTonicSelect) keyTonicSelect.value = String(r.tonic);
    if (keyScaleSelect) keyScaleSelect.value = r.scale;
    app.pitch.keyTonic = r.tonic;
    app.pitch.keyScale = r.scale;
    savePref('keyTonic', app.pitch.keyTonic);
    savePref('keyScale', app.pitch.keyScale);
    // Set baseline original key for consistent transpose calc
    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);
    updateEffectiveKeyLabel();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';
  }
});

updateEffectiveKeyLabel();