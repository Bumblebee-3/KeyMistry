import * as Tone from "https://cdn.skypack.dev/tone@14.8.49";
import { Midi } from "https://cdn.skypack.dev/@tonejs/midi@2.0.28";

if (window.__KM_BLOCKED) {
  // Export an empty module to satisfy type=module
}
// Debug logging flag (disable to avoid performance hits)
const LOG_MIDI = false;
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
// Removed redundant practice toggle; use modeSelect instead
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
// Timing calibration UI
const inputOffsetMsInput = document.getElementById('inputOffsetMs');
const inputOffsetLabel = document.getElementById('inputOffsetLabel');
// Octave tolerance UI
const octaveTolInput = document.getElementById('octaveTol');
const octaveTolLabel = document.getElementById('octaveTolLabel');
// Pitch & Key controls
const transposeInput = document.getElementById('transpose');
const transposeLabel = document.getElementById('transposeLabel');
const keyTonicSelect = document.getElementById('keyTonic');
const keyScaleSelect = document.getElementById('keyScale');
const autoDetectKeyBtn = document.getElementById('autoDetectKey');
const detectedKeyLabel = document.getElementById('detectedKeyLabel');
// --- MIDI sanitization helpers -------------------------------------------------
// Some MIDIs encode time signature meta (0xFF 0x58) with wrong length (e.g., 2 instead of 4),
// which @tonejs/midi rejects. As a local workaround, downgrade such events to a benign
// sequencer-specific meta (0xFF 0x7F) keeping the same length so chunk sizes remain valid.
function sanitizeTimeSignatureMeta(u8) {
  const out = new Uint8Array(u8); // copy to avoid mutating original
  const n = out.length;
  for (let i = 0; i < n - 3; i++) {
    if (out[i] === 0xFF && out[i + 1] === 0x58) {
      // Read VLQ length starting at i+2
      let j = i + 2;
      let len = 0;
      let consumed = 0;
      while (j < n) {
        const b = out[j++];
        consumed++;
        len = (len << 7) | (b & 0x7F);
        if ((b & 0x80) === 0) break;
      }
      if (len !== 4) {
        // Change meta type to sequencer-specific to avoid strict parser check
        out[i + 1] = 0x7F;
      }
      // Skip over data payload to continue scanning
      i = (j + len - 1);
    }
  }
  return out;
}

// Guided UI elements
const guidedToggleBtn = document.getElementById('guidedToggle');
const guidedPanel = document.getElementById('guidedPanel');
const guidedPanelHeader = document.getElementById('guidedPanelHeader');
const guidedSectionLabel = document.getElementById('guidedSectionLabel'); // will display "Stage X of N"
const guidedStageLabel = document.getElementById('guidedStageLabel');
const guidedAccBar = document.getElementById('guidedAccBar');
const guidedAccLabel = document.getElementById('guidedAccLabel');
const guidedPrevSecBtn = document.getElementById('guidedPrevSec');
const guidedNextSecBtn = document.getElementById('guidedNextSec');
const guidedUnderstoodBtn = document.getElementById('guidedUnderstoodBtn');
const guidedNextStageBtn = document.getElementById('guidedNextStageBtn');
const guidedHint = document.getElementById('guidedHint');
const guidedPrompt = document.getElementById('guidedPrompt');
const guidedPromptMsg = document.getElementById('guidedPromptMsg');
const guidedPromptContinue = document.getElementById('guidedPromptContinue');
// Guided decision and step UI
const guidedDecision = document.getElementById('guidedDecision');
const guidedPracticeAgainBtn = document.getElementById('guidedPracticeAgainBtn');
const guidedPhaseContinueBtn = document.getElementById('guidedPhaseContinueBtn');
const guidedStepLeft = document.getElementById('guidedStepLeft');
const guidedStepRight = document.getElementById('guidedStepRight');
const guidedStepBoth = document.getElementById('guidedStepBoth');
const guidedScopeEl = document.getElementById('guidedScope');
const guidedOverallBar = document.getElementById('guidedOverallBar');
const guidedOverallLabel = document.getElementById('guidedOverallLabel');
// Accuracy overlay elements
const accuracyOverlay = document.getElementById('accuracyOverlay');
const accOvPercentEl = document.getElementById('accOvPercent');
const accOvTimingEl = document.getElementById('accOvTiming');
const accOvReplayBtn = document.getElementById('accReplayBtn');
const accOvContinueBtn = document.getElementById('accContinueBtn');
const accOvUnlockHint = document.getElementById('accOvUnlockHint');
// Guided config inputs
// Section length UI removed; fixed to 20s
const guidedSectionLenInput = null;
// Strict mode and threshold UI removed
const guidedStrictToggle = null;
const guidedAccThresholdInput = null;
const guidedAccThresholdLabel = null;

const effectiveKeyLabel = document.getElementById('effectiveKeyLabel');
// Optional visual latency fine-tuning
const visualLatencyInput = document.getElementById('visualLatencyOffset');
const visualLatencyLabel = document.getElementById('visualLatencyLabel');
let VISUAL_LATENCY = 0; // seconds; positive = advance visuals (hit earlier)

// Multi-track warning modal elements
const multiTrackModal = document.getElementById('multiTrackModal');
const multiTrackText = document.getElementById('multiTrackText');
const multiTrackTitle = document.getElementById('multiTrackTitle');
const multiTrackCancel = document.getElementById('multiTrackCancel');
const multiTrackContinue = document.getElementById('multiTrackContinue');
// Walkthrough elements
const walkthroughWelcome = document.getElementById('walkthroughWelcome');
const walkthroughStart = document.getElementById('walkthroughStart');
const walkthroughSkip = document.getElementById('walkthroughSkip');
const helpWalkthroughBtn = document.getElementById('helpWalkthroughBtn');

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
  guided: {
    enabled: false,
    hasSeparateHands: false,
    sections: [], // time slices only: {label, start, end}
    stages: [],   // cumulative learning stages: {index, mastery:{left,right,both}, accByStage:{...}, lastTempo:number}
    currentIndex: 0,
    stage: 'left', // 'left'|'right'|'both'
    progressKey: null, // localStorage key
    sectionLenSec: 20,
    // Overlay/input lock state during end-of-section summary
    inputLocked: false,
    overlayUnlockAt: 0,
  // strictMode/accThreshold removed from UI; continue is always available
  },
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
  renderToken: 0, // increments on each song load to invalidate old scheduled visuals
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
    groupTimeById: new Map(),
    inputOffsetSec: 0, // calibration: positive means user's input arrives late (so shift forward)
  hitWindowSec: 0.30, // acceptance window for early/late hits (±)
    chordWindowSec: 0.06, // grouping window for chords
    _waitTimeout: null,
    autoContinue: false, // if true, auto-continue after grace when user doesn't complete chord
    octaveTol: 1, // accept ±octaves for matching (0..2)
    // Smart play-ahead
    lookaheadSec: 2.5,
    earlyHits: new Map(), // index -> Set<midi> matched early
    skipWaitFor: new Set(), // indices that should not pause when reached
    satisfiedGroups: new Set(), // group indices satisfied this loop
    lastLoopAccPercent: 0, // persist last loop's accuracy for steady UI at loop restart
    matchedIds: new Set(), // per-loop set of matched expected note ids
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
    // Echo guard to prevent MIDI loopback from causing double-highlights
    _echo: new Map(), // key: `${ch}:${midi}:on|off` -> last sent time (sec)
    echoWindowSec: 0.3,
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
  // practice toggle removed
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

  // Timing calibration
  const inOff = loadPref('inputOffsetMs', 0);
  app.practice.inputOffsetSec = clamp((parseInt(inOff, 10) || 0) / 1000, -0.4, 0.4);
  if (inputOffsetMsInput) inputOffsetMsInput.value = String(parseInt(inOff, 10) || 0);
  if (inputOffsetLabel) inputOffsetLabel.textContent = `${parseInt(inOff, 10) || 0} ms`;

  // Octave tolerance
  const oTol = clamp(parseInt(loadPref('octaveTol', 1), 10) || 0, 0, 2);
  app.practice.octaveTol = oTol;
  if (octaveTolInput) octaveTolInput.value = String(oTol);
  if (octaveTolLabel) octaveTolLabel.textContent = `±${oTol} oct`;

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

  // Guided config: section length fixed to 20s (no UI); strict/threshold removed
  const glen = 20;
  app.guided.sectionLenSec = glen;
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    let midi;
    try {
      midi = new Midi(arrayBuffer);
    } catch (err) {
      console.warn('[KeyMistry] Strict MIDI parse failed, attempting sanitize fallback…', err);
      const bytes = new Uint8Array(arrayBuffer);
      const safe = sanitizeTimeSignatureMeta(bytes);
      midi = new Midi(safe.buffer);
    }
    // Warn if too many tracks (likely multiple instruments)
    if (!(await shouldProceedWithMultiTrack(midi))) {
      showOverlay("Loading cancelled.");
      return;
    }
    // Persist the song name BEFORE initializing so per-song keys use the correct normalized title
    try {
      localStorage.setItem('km_last_midi_name', file.name);
      updatePreviousButtonLabel();
    } catch {}
    initFromMidi(midi);
    showOverlay(`Loaded: ${file.name}`);

    try {
      const bytes = new Uint8Array(arrayBuffer);
      const b64 = btoa(String.fromCharCode(...bytes));
      localStorage.setItem('km_last_midi_b64', b64);
      // name already stored above; keep base64 for quick reloads
    } catch {}
  } catch (err) {
    console.error(err);
    showOverlay("Failed to load MIDI");
  }
});

btnLoadPrevious?.addEventListener('click', async () => {
  try {
    const b64 = localStorage.getItem('km_last_midi_b64') || localStorage.getItem('lp_last_midi_b64');
    if (!b64) return showOverlay('No previous MIDI saved');
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i=0;i<binStr.length;i++) bytes[i] = binStr.charCodeAt(i);
    let midi;
    try {
      midi = new Midi(bytes.buffer);
    } catch (err) {
      console.warn('[KeyMistry] Previous MIDI parse failed, applying sanitize fallback…', err);
      const safe = sanitizeTimeSignatureMeta(bytes);
      midi = new Midi(safe.buffer);
    }
    if (!(await shouldProceedWithMultiTrack(midi))) {
      showOverlay("Loading cancelled.");
      return;
    }
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
  // Stop any previous playback and clear visuals to avoid lingering highlights
  try {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  } catch {}
  try { stopAnimation({ clear: true }); } catch {}
  panicAll();
  clearLoopTimer();
  try {
    app.liveKeys.clear();
    app.keyGlow.clear();
    app.upcomingKeys.clear();
    app._lastLandingFlash.clear();
    app.pedal.sustainDown.clear();
    app.pedal.sustained.forEach(set => set.clear());
  } catch {}
  try {
    ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
    drawKeyboard();
  } catch {}

  // Bump render token to invalidate any previously scheduled callbacks
  app.renderToken = (app.renderToken || 0) + 1;

  app.midi = midi;
  app.tracks = [];
  app.scheduled = false;
  app.expectedNotesByTime.clear();
  app.score = 0;
  app.liveKeys.clear();
  app.keyGlow.clear();
  scoreEl.textContent = String(app.score);
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };

  // Reset transpose to zero for each newly loaded song
  app.pitch.transpose = 0;
  savePref('transpose', 0);
  if (transposeInput) transposeInput.value = '0';
  if (transposeLabel) transposeLabel.textContent = '0';

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

  // Guided: initialize time sections (~20s each) and detection of hand separation
  try {
    const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
    const base = String(name).replace(/\.[^/.]+$/, '').trim();
    const normalized = base.toLowerCase();
    app.guided.progressKey = `km_progress_${normalized}`;
    app.songCfgKey = `km_songcfg_${normalized}`;
  } catch { app.guided.progressKey = null; }

  const hasTwoOrMore = (app.tracks?.length || 0) > 1;
  app.guided.hasSeparateHands = hasTwoOrMore;
  const secLen = 20; // fixed
  app.guided.sectionLenSec = secLen;
  const count = Math.max(1, Math.ceil(app.duration / secLen));
  app.guided.sections = Array.from({length: count}, (_, i) => {
    const start = i * secLen;
    const end = Math.min(app.duration, (i + 1) * secLen);
    return { label: `Section ${i+1}`, start, end };
  });
  // Build cumulative-learning stages (one per section)
  app.guided.stages = Array.from({length: count}, (_, i) => ({
    index: i+1,
    mastery: { left: !hasTwoOrMore, right: !hasTwoOrMore, both: false },
    accByStage: { left: 0, right: 0, both: 0 },
    lastTempo: 1
  }));
  app.guided.currentIndex = 0; // current stage index
  app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
  restoreGuidedProgress();
  updateGuidedUI();

  // Ensure loop defaults are sensible after loading a MIDI
  if (app.practice.loop.enabled) {
    if (!(app.practice.loop.end > app.practice.loop.start)) {
      app.practice.loop.start = 0;
      app.practice.loop.end = app.duration;
      if (loopStartInput) loopStartInput.value = String(app.practice.loop.start);
      if (loopEndInput) loopEndInput.value = String(Math.round(app.practice.loop.end * 10) / 10);
    }
  }

  // Auto-detect key on load (set as default for this song)
  const r = detectKeyFromMidi();
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if (r) {
    app.pitch.detectedTonic = r.tonic;
    app.pitch.detectedScale = r.scale;
    if (detectedKeyLabel) detectedKeyLabel.textContent = `${names[r.tonic]} ${r.scale}`;
    // Always set the song's key to the detected key on new load
    app.pitch.keyTonic = r.tonic;
    app.pitch.keyScale = r.scale;
    if (keyTonicSelect) keyTonicSelect.value = String(r.tonic);
    if (keyScaleSelect) keyScaleSelect.value = r.scale;
    savePref('keyTonic', app.pitch.keyTonic);
    savePref('keyScale', app.pitch.keyScale);
    // Persist baseline original key
    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);
    // Ensure transpose remains zero for new song (effective key == original detected)
    app.pitch.transpose = 0;
    savePref('transpose', 0);
    if (transposeInput) transposeInput.value = '0';
    if (transposeLabel) transposeLabel.textContent = '0';
    rescheduleTransport();
    updateEffectiveKeyLabel();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';
    // Fall back to C major with zero transpose
    app.pitch.keyTonic = 0;
    app.pitch.keyScale = 'major';
    savePref('keyTonic', 0);
    savePref('keyScale', 'major');
    if (keyTonicSelect) keyTonicSelect.value = '0';
    if (keyScaleSelect) keyScaleSelect.value = 'major';
    app.pitch.originalTonicPref = 0; savePref('originalTonic', 0);
    app.pitch.originalScalePref = 'major'; savePref('originalScale', 'major');
    app.pitch.transpose = 0; savePref('transpose', 0);
    if (transposeInput) transposeInput.value = '0';
    if (transposeLabel) transposeLabel.textContent = '0';
    updateEffectiveKeyLabel();
  }

  // Finally, restore any per-song overrides (transpose/key) if present
  restoreSongConfig();
  // Ensure a baseline song config is saved for this title
  persistSongConfig();
}

// Per-song config persistence
function restoreSongConfig() {
  try {
    if (!app.songCfgKey) return;
    const raw = localStorage.getItem(app.songCfgKey);
    if (!raw) return;
    const cfg = JSON.parse(raw);
    let changed = false;
    if (typeof cfg.transpose === 'number' && cfg.transpose !== app.pitch.transpose) {
      app.pitch.transpose = clamp(cfg.transpose, -12, 12);
      if (transposeInput) transposeInput.value = String(app.pitch.transpose);
      if (transposeLabel) transposeLabel.textContent = `${app.pitch.transpose}`;
      savePref('transpose', app.pitch.transpose);
      changed = true;
    }
    if (typeof cfg.keyTonic === 'number') {
      app.pitch.keyTonic = ((cfg.keyTonic % 12) + 12) % 12;
      if (keyTonicSelect) keyTonicSelect.value = String(app.pitch.keyTonic);
      savePref('keyTonic', app.pitch.keyTonic);
      changed = true;
    }
    if (typeof cfg.keyScale === 'string' && cfg.keyScale) {
      app.pitch.keyScale = cfg.keyScale;
      if (keyScaleSelect) keyScaleSelect.value = cfg.keyScale;
      savePref('keyScale', app.pitch.keyScale);
      changed = true;
    }
    if (changed) {
      // Rebuild visuals/groups with restored settings
      clearEarlyLookaheadState?.();
      buildPracticeGroups?.();
      rescheduleTransport?.();
      updateEffectiveKeyLabel?.();
    }
  } catch {}
}

function persistSongConfig() {
  try {
    if (!app.songCfgKey) return;
    const payload = {
      transpose: app.pitch.transpose || 0,
      keyTonic: app.pitch.keyTonic ?? 0,
      keyScale: app.pitch.keyScale || 'major',
      originalTonic: app.pitch.originalTonicPref ?? null,
      originalScale: app.pitch.originalScalePref ?? null,
    };
    localStorage.setItem(app.songCfgKey, JSON.stringify(payload));
  } catch {}
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

// Guided helpers and events (top-level)
function restoreGuidedProgress() {
  if (!app.guided.progressKey) return;
  try {
    const raw = localStorage.getItem(app.guided.progressKey);
    if (!raw) return;
    const data = JSON.parse(raw);
    // Preferred: stages array (cumulative learning)
    if (Array.isArray(data.stages) && data.stages.length) {
      const n = Math.min(app.guided.sections.length, data.stages.length);
      app.guided.stages = Array.from({length: app.guided.sections.length}, (_, i) => {
        const saved = i < n ? data.stages[i] : null;
        return {
          index: i+1,
          mastery: saved ? { left: !!saved.left, right: !!saved.right, both: !!saved.both } : { left: !app.guided.hasSeparateHands, right: !app.guided.hasSeparateHands, both: false },
          accByStage: saved && saved.accByStage ? { left: saved.accByStage.left||0, right: saved.accByStage.right||0, both: saved.accByStage.both||0 } : { left:0,right:0,both:0 },
          lastTempo: saved && typeof saved.lastTempo === 'number' ? clamp(saved.lastTempo, 0.5, 1.5) : 1
        };
      });
      return;
    }
    // Backward-compat: legacy per-section structure
    if (data?.sections) {
      app.guided.stages = app.guided.sections.map((_, i) => {
        const saved = data.sections[String(i+1)] || {};
        return {
          index: i+1,
          mastery: { left: !!saved.left, right: !!saved.right, both: !!saved.both },
          accByStage: saved.accByStage || { left:0,right:0,both:0 },
          lastTempo: typeof saved.lastTempo === 'number' ? clamp(saved.lastTempo, 0.5, 1.5) : 1
        };
      });
    }
  } catch {}
}

function persistGuidedProgress() {
  if (!app.guided.progressKey) return;
  const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
  // New: stages array for cumulative learning
  const stages = app.guided.stages.map(st => ({
    stage: st.index,
    left: !!st.mastery.left,
    right: !!st.mastery.right,
    both: !!st.mastery.both,
    accByStage: { ...st.accByStage },
    lastTempo: st.lastTempo || 1
  }));
  const separate = !!app.guided.hasSeparateHands;
  const totalPhases = (app.guided.stages.length || 0) * (separate ? 3 : 1);
  const completedPhases = app.guided.stages.reduce((a, st) => {
    if (separate) return a + (st.mastery.left?1:0) + (st.mastery.right?1:0) + (st.mastery.both?1:0);
    return a + (st.mastery.both ? 1 : 0);
  }, 0);
  const completion = totalPhases ? Math.round((completedPhases / totalPhases) * 100) : 0;
  const payload = {
    title: name.replace(/\.[^/.]+$/, ''),
    separateHands: !!app.guided.hasSeparateHands,
    stages,
    // Keep legacy 'sections' for older dashboards (best-effort projection)
    sections: Object.fromEntries(app.guided.stages.map((st, i) => [String(i+1), {
      left: !!st.mastery.left,
      right: !!st.mastery.right,
      both: !!st.mastery.both,
      accByStage: { ...st.accByStage },
      lastTempo: st.lastTempo || 1
    }])),
    completion,
    lastPlayed: new Date().toISOString(),
  };
  try { localStorage.setItem(app.guided.progressKey, JSON.stringify(payload)); } catch {}
}

function updateGuidedUI() {
  if (!guidedPanel) return;
  const stageIdx = app.guided.currentIndex;
  const totalStages = app.guided.sections.length;
  const stage = app.guided.stages[stageIdx];
  if (!stage) return;
  const endTime = getStageEndTime(stageIdx);
  const scopeLabel = stageIdx === 0 ? 'Section 1' : `Sections 1–${stageIdx+1}`;
  if (guidedSectionLabel) guidedSectionLabel.textContent = `Stage ${stageIdx+1} of ${totalStages}`;
  guidedStageLabel && (guidedStageLabel.textContent = (app.guided.stage === 'left' ? 'Left Hand' : app.guided.stage === 'right' ? 'Right Hand' : 'Both Hands'));
  if (guidedHint) {
    guidedHint.textContent = app.guided.stage === 'left' ? 'Now practice your left hand.' : app.guided.stage === 'right' ? 'Now practice your right hand.' : 'Try combining both hands!';
  }
  if (guidedScopeEl) guidedScopeEl.textContent = `Scope: ${scopeLabel}`;
  // Compute accuracy to display:
  // 1) If current stats exist, show live percent
  // 2) Else, show last saved accuracy for this section/stage (persisted)
  // 3) Else, fall back to last loop percent or 0
  const { total, correct } = app.practice.stats || { total: 0, correct: 0 };
  const saved = (stage.accByStage && typeof stage.accByStage[app.guided.stage] === 'number') ? stage.accByStage[app.guided.stage] : null;
  const fallback = app.practice.lastLoopAccPercent || 0;
  const percent = total ? Math.round((correct / total) * 100) : (saved != null ? Math.round(saved) : fallback);
  if (guidedAccBar) guidedAccBar.style.width = `${percent}%`;
  if (guidedAccLabel) {
    const mk = (ok) => ok ? '✅' : '🔄';
    const status = app.guided.hasSeparateHands ? `Left: ${mk(!!stage.mastery.left)} | Right: ${mk(!!stage.mastery.right)} | Both: ${mk(!!stage.mastery.both)}` : `Both: ${mk(!!stage.mastery.both)}`;
    guidedAccLabel.textContent = `${percent}% accuracy — ${status}`;
  }
  const mastered = isStageMastered(app.guided.currentIndex, app.guided.stage);
  if (guidedNextStageBtn) guidedNextStageBtn.classList.toggle('hidden', !mastered);
  // Update step pills
  if (guidedStepLeft && guidedStepRight && guidedStepBoth) {
    const setPill = (el, active, done) => {
      el.classList.remove('bg-gray-800','border-gray-700','bg-blue-600','bg-emerald-600');
      el.classList.add('border');
      if (done) el.classList.add('bg-emerald-600');
      else if (active) el.classList.add('bg-blue-600');
      else el.classList.add('bg-gray-800','border-gray-700');
    };
    setPill(guidedStepLeft, app.guided.stage==='left', !!stage.mastery.left);
    setPill(guidedStepRight, app.guided.stage==='right', !!stage.mastery.right);
    setPill(guidedStepBoth, app.guided.stage==='both', !!stage.mastery.both);
  }
  // Update overall progress
  const separate = !!app.guided.hasSeparateHands;
  const totalPhases = (app.guided.stages.length || 0) * (separate ? 3 : 1);
  const completedPhases = app.guided.stages.reduce((a, st) => {
    if (separate) return a + (st.mastery.left?1:0) + (st.mastery.right?1:0) + (st.mastery.both?1:0);
    return a + (st.mastery.both ? 1 : 0);
  }, 0);
  const overallPct = totalPhases ? Math.round((completedPhases / totalPhases) * 100) : 0;
  if (guidedOverallBar) guidedOverallBar.style.width = `${overallPct}%`;
  if (guidedOverallLabel) guidedOverallLabel.textContent = `${overallPct}% overall`;
}

function isStageMastered(index, stage) {
  const st = app.guided.stages[index];
  if (!st) return false;
  return !!st.mastery?.[stage];
}

function markStageOnContinue() {
  // User chose to continue; record last accuracy and mark mastered unconditionally
  const { total, correct } = app.practice.stats || { total: 0, correct: 0 };
  const percent = total ? Math.round((correct / total) * 100) : (app.practice.lastLoopAccPercent || 0);
  const st = app.guided.stages[app.guided.currentIndex];
  if (st) {
    if (st.accByStage) st.accByStage[app.guided.stage] = percent;
    st.mastery[app.guided.stage] = true;
    persistGuidedProgress();
    updateGuidedUI();
  }
}

function evaluateLoopPerformance() {
  // Calculate accuracy per-note for notes within [start, end),
  // giving full credit for satisfied groups and partial credit otherwise.
  const loopStart = app.practice.loop?.start ?? 0;
  const loopEnd = app.practice.loop?.end ?? app.duration;
  const groups = app.practice.groups || [];
  const matched = app.practice.matchedIds || new Set();
  let expected = 0;
  let correct = 0;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (!g) continue;
    if (g.time < loopStart) continue;
    if (g.time >= loopEnd) break;
    const sz = g.notes?.length || 0;
    expected += sz;
    if (app.practice.satisfiedGroups.has(i)) {
      // Full credit if group satisfied (either by early hits or during wait)
      correct += sz;
    } else if (Array.isArray(g.ids) && g.ids.length) {
      // Partial credit: count matched ids belonging to this group
      for (const id of g.ids) if (matched.has(id)) correct += 1;
    }
  }
  correct = Math.min(correct, expected);
  app.practice.stats.total = expected;
  app.practice.stats.correct = correct;
  const percent = expected ? Math.round((correct / expected) * 100) : 0;
  app.practice.lastLoopAccPercent = percent;
  const st = app.guided.stages[app.guided.currentIndex];
  if (st) {
    if (st.accByStage) st.accByStage[app.guided.stage] = percent;
  }
  // Adaptive pacing
  const currentFactor = parseFloat(speed.value || '1') || 1;
  const thrPct = 90; // hidden default for tempo nudge
  if (percent >= thrPct) {
    const next = clamp(currentFactor + 0.1, 1.0, 1.3);
    if (next > currentFactor + 1e-6) {
      speed.value = String(next);
      speed.dispatchEvent(new Event('input'));
      showOverlay(`Great job! Increasing pace slightly… (${Math.round(next*100)}%)`, 1200);
    }
    if (st) st.lastTempo = next;
    // Also mark stage mastered to unlock Next, but don't auto-advance
    if (st) st.mastery[app.guided.stage] = true;
    persistGuidedProgress();
  } else if (percent < Math.max(80, thrPct - 10) && currentFactor > 1.0) {
    speed.value = '1';
    speed.dispatchEvent(new Event('input'));
    if (st) st.lastTempo = 1;
    showOverlay('Tempo back to normal for focus', 900);
    persistGuidedProgress();
  } else if (st) {
    st.lastTempo = currentFactor;
    persistGuidedProgress();
  }
  // Prepare for next loop iteration
  app.practice.satisfiedGroups.clear();
  updateGuidedUI();
  // Show guided decision buttons with encouraging toast
  if (percent >= 98) showOverlay(`🔥 Accuracy: ${percent}% – Ready to continue?`, 1400);
  else showOverlay(`🎯 Accuracy: ${percent}%`, 1200);
  showGuidedDecision(percent);
}

// ---- Guided section accuracy overlay ---------------------------------------
function avgTimingMs() {
  const arr = app.practice?.stats?.timings || [];
  if (!arr.length) return 0;
  const mean = arr.reduce((a,b)=>a+b,0) / arr.length;
  return Math.round(mean * 1000); // signed: +late, -early
}

function setOverlayButtonsEnabled(en) {
  if (accOvReplayBtn) { accOvReplayBtn.disabled = !en; }
  if (accOvContinueBtn) { accOvContinueBtn.disabled = !en; }
  if (accOvUnlockHint) accOvUnlockHint.classList.toggle('hidden', en);
}

function showAccuracyOverlay() {
  if (!accuracyOverlay) return;
  // Populate numbers
  const total = Number(app.practice?.stats?.total) || 0;
  const correct = Number(app.practice?.stats?.correct) || 0;
  const percent = total > 0 ? Math.round((correct/total)*100) : 0; // no fallback to avoid stale 100%
  const avgMs = avgTimingMs();
  if (accOvPercentEl) accOvPercentEl.textContent = String(percent);
  if (accOvTimingEl) accOvTimingEl.textContent = `${avgMs > 0 ? '+' : ''}${avgMs} ms`;
  // Lock inputs for at least 5s
  app.guided.inputLocked = true;
  app.guided.overlayUnlockAt = performance.now() + 5000;
  setOverlayButtonsEnabled(false);
  accuracyOverlay.classList.remove('hidden');
  let interval = null;
  if (accOvUnlockHint) {
    interval = setInterval(() => {
      const rem = Math.ceil((app.guided.overlayUnlockAt - performance.now())/1000);
      if (rem > 0) accOvUnlockHint.textContent = `You can continue in ${rem}s…`;
      if (performance.now() >= app.guided.overlayUnlockAt) {
        clearInterval(interval); interval = null;
        setOverlayButtonsEnabled(true);
        accOvUnlockHint.textContent = '';
      }
    }, 250);
  }

  const cleanup = () => {
    if (interval) { try{ clearInterval(interval);}catch{} interval = null; }
    accuracyOverlay.classList.add('hidden');
    app.guided.inputLocked = false;
    // Allow loop engine to progress again
    if (app.practice?.loop) app.practice.loop._pending = false;
  };

  // Button handlers
  accOvReplayBtn?.addEventListener('click', async () => {
    if (performance.now() < app.guided.overlayUnlockAt) return;
    cleanup();
    // Reset stats and restart current loop
    app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
    app.practice.matchedIds = new Set();
    clearEarlyLookaheadState();
    try {
      const { start } = app.practice.loop || { start: 0 };
      Tone.Transport.seconds = start || 0;
      updateTimeUI(start || 0);
      Tone.Transport.start(`+${START_DELAY}`);
      startAnimation();
    } catch {}
  }, { once: true });

  accOvContinueBtn?.addEventListener('click', async () => {
    if (performance.now() < app.guided.overlayUnlockAt) return;
    cleanup();
    // Mark and move to next guided phase/section
    guidedPhaseContinueBtn?.click();
  }, { once: true });
}

// Guided loop decision controls
function showGuidedDecision(percent) {
  if (!guidedDecision) return;
  guidedDecision.classList.remove('hidden');
  const text = (app.guided.stage==='left') ? '➡ Continue to Right Hand' : (app.guided.stage==='right') ? '➡ Continue to Both Hands' : '➡ Continue to Next Section';
  if (guidedPhaseContinueBtn) guidedPhaseContinueBtn.textContent = text;
  // Continue is always available; no strict gating
  if (guidedPhaseContinueBtn) {
    guidedPhaseContinueBtn.disabled = false;
    guidedPhaseContinueBtn.classList.remove('opacity-60');
  }
}

guidedPracticeAgainBtn?.addEventListener('click', () => {
  guidedDecision?.classList.add('hidden');
  // Keep same stage; loop already restarts
});

guidedPhaseContinueBtn?.addEventListener('click', () => {
  guidedDecision?.classList.add('hidden');
  markStageOnContinue();
  if (!app.guided.hasSeparateHands) {
    guidedNextSecBtn?.click();
    return;
  }
  if (app.guided.stage === 'left') app.guided.stage = 'right';
  else if (app.guided.stage === 'right') app.guided.stage = 'both';
  else {
    guidedNextSecBtn?.click();
    return;
  }
  startGuidedPracticeCycle();
  persistGuidedProgress();
});

function getStageEndTime(index) {
  const i = Math.max(0, Math.min(index, app.guided.sections.length - 1));
  const lastSec = app.guided.sections[i];
  return lastSec ? lastSec.end : 0;
}

function setGuidedLoopToCurrentStage() {
  const end = getStageEndTime(app.guided.currentIndex);
  app.practice.loop.enabled = true;
  app.practice.loop.start = 0;
  app.practice.loop.end = end;
  if (loopToggle) loopToggle.checked = true;
  if (loopStartInput) loopStartInput.value = String(0);
  if (loopEndInput) loopEndInput.value = String(Math.round(end * 10) / 10);
  savePref('loopEnabled', true);
  savePref('loopStart', 0);
  savePref('loopEnd', end);
  // Ensure transport starts at the beginning of this section
  try {
    Tone.Transport.seconds = 0;
    updateTimeUI(0);
    clearLoopTimer();
  } catch {}
}

function applyGuidedStageHand() {
  if (!app.guided.enabled) return;
  if (!app.guided.hasSeparateHands) { setHand('both'); return; }
  if (app.guided.stage === 'left') setHand('left');
  else if (app.guided.stage === 'right') setHand('right');
  else setHand('both');
}

function startGuidedPracticeCycle() {
  if (!app.guided.enabled) return;
  // Force practice mode and note-wait
  if (modeSelect) modeSelect.value = 'practice';
  app.practice.noteWait = true;
  if (noteWaitToggle) noteWaitToggle.checked = true;
  // In note-wait guided practice, do NOT auto-continue — wait for user to play
  app.practice.autoContinue = false;
  // reset stats for this section run
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
  app.practice.matchedIds = new Set();
  app.practice.lastLoopAccPercent = 0;
  clearEarlyLookaheadState();
  updateGuidedUI();
  setGuidedLoopToCurrentStage();
  applyGuidedStageHand();
  // Restore last tempo used for this section
  const st = app.guided.stages[app.guided.currentIndex];
  const factor = clamp(Number(st?.lastTempo) || 1, 0.5, 1.5);
  if (speed) { speed.value = String(factor); speed.dispatchEvent(new Event('input')); }
  guidedDecision?.classList.add('hidden');
  rescheduleTransport();
}

guidedToggleBtn?.addEventListener('click', () => {
  app.guided.enabled = !app.guided.enabled;
  guidedPanel?.classList.toggle('hidden', !app.guided.enabled);
  // When opening, ensure custom position (if saved) is applied and z-index stays above fullscreen overlay
  if (app.guided.enabled) {
    try { applyGuidedPanelSavedPosition(); } catch {}
  }
  if (app.guided.enabled) {
    // Prompt depending on tracks
    if (guidedPrompt && guidedPromptMsg) {
      if (app.guided.hasSeparateHands) {
        guidedPromptMsg.textContent = "Detected separate left and right hand tracks. You’ll learn this song step-by-step — left, right, and then both together!";
      } else {
        guidedPromptMsg.textContent = "This MIDI file doesn’t differentiate left and right hand parts. You’ll practice both together.";
      }
      guidedPrompt.classList.remove('hidden');
    }
    startGuidedPracticeCycle();
    // Ensure a dashboard entry exists immediately when Guided starts
    persistGuidedProgress();
  }
});

guidedPromptContinue?.addEventListener('click', () => {
  guidedPrompt?.classList.add('hidden');
});

// No strict gating; keep for compatibility with previous code paths
function markStageIfThreshold() {
  // Intentionally empty: Continue is always enabled
}

guidedPrevSecBtn?.addEventListener('click', () => {
  if (app.guided.currentIndex > 0) {
    app.guided.currentIndex--;
    app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
    guidedDecision?.classList.add('hidden');
    startGuidedPracticeCycle();
    persistGuidedProgress();
  }
});
guidedNextSecBtn?.addEventListener('click', () => {
  if (app.guided.currentIndex < app.guided.sections.length - 1) {
    app.guided.currentIndex++;
    app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
    guidedDecision?.classList.add('hidden');
    startGuidedPracticeCycle();
    persistGuidedProgress();
  }
});

guidedUnderstoodBtn?.addEventListener('click', () => {
  const st = app.guided.stages[app.guided.currentIndex];
  if (st) {
    if (!st.understoodByStage) st.understoodByStage = { left: false, right: false, both: false };
    st.understoodByStage[app.guided.stage] = true;
  }
  // If current stats meet threshold, mark stage as mastered
  markStageIfThreshold();
  updateGuidedUI();
  persistGuidedProgress();
  // Progress flow: move to next stage when user indicates understanding
  if (!app.guided.hasSeparateHands) {
    guidedNextSecBtn?.click();
  } else {
    if (app.guided.stage === 'left') app.guided.stage = 'right';
    else if (app.guided.stage === 'right') app.guided.stage = 'both';
    else guidedNextSecBtn?.click();
    startGuidedPracticeCycle();
  }
});

guidedNextStageBtn?.addEventListener('click', () => {
  // Advance through left -> right -> both, or only both on single-track
  if (!app.guided.hasSeparateHands) {
    // advance to next section
    guidedNextSecBtn?.click();
    return;
  }
  if (app.guided.stage === 'left') app.guided.stage = 'right';
  else if (app.guided.stage === 'right') app.guided.stage = 'both';
  else {
    // all done, next section
    guidedNextSecBtn?.click();
    return;
  }
  startGuidedPracticeCycle();
  persistGuidedProgress();
});

function scheduleIfNeeded() {
  if (!app.midi || app.scheduled) return;
  Tone.Transport.cancel();
  const now = 0;
  const token = app.renderToken;

  const isSoloActive = app.tracks.some((t) => t.solo);

  app.tracks.forEach((t, ti) => {
    const synth = app.synths[ti];
    const enabled = isSoloActive ? t.solo : !t.muted;
    if (!enabled) return;
    const filtered = t.notes.filter(n => handFilter(n));
    filtered.forEach((n) => {
      const time = n.time + now;
      Tone.Transport.schedule((schedTime) => {
        if (token !== app.renderToken) return; // stale schedule, abort
        const midiOut = applyTranspose(n.midi);
        if (shouldUseLocalAudio() && synth && modeSelect?.value === 'listen') {
          const dur = Math.max(0.02, Number(n.duration) || 0);
          synth.triggerAttackRelease(
            Tone.Frequency(midiOut, "midi").toFrequency(),
            dur,
            schedTime,
            n.velocity
          );
        }
        // Only send scheduled playback to external MIDI in Listen mode
        if (modeSelect?.value === 'listen') {
          sendNoteOn(midiOut, Math.round(n.velocity * 127), t.channel, schedTime);
          // Schedule visual key-on precisely on the audio clock for robustness across rewinds/loops
          Tone.Draw.schedule(() => {
            if (token !== app.renderToken) return;
            if (modeSelect?.value !== 'listen') return;
            handleNoteOnVisual(midiOut, t.channel, colorForNoteObj(n));
          }, schedTime);
        }
      }, time);

      // Schedule visual key-off on the transport timeline (no tail) and draw on the audio clock
      const visualOffAt = time + Math.max(0.02, Number(n.duration) || 0);
      Tone.Transport.schedule((offSchedTime) => {
        if (token !== app.renderToken) return;
        if (modeSelect?.value !== 'listen') return;
        const midiOut = applyTranspose(n.midi);
        Tone.Draw.schedule(() => {
          if (token !== app.renderToken) return;
          if (modeSelect?.value !== 'listen') return;
          handleNoteOffVisual(midiOut, t.channel, colorForNoteObj(n));
        }, offSchedTime);
      }, visualOffAt);

      // Schedule external MIDI note-off precisely on the transport timeline (with optional tail)
      Tone.Transport.schedule((offTime) => {
        if (token !== app.renderToken) return;
        if (modeSelect?.value === 'listen') {
          const midiOut = applyTranspose(n.midi);
          sendNoteOff(midiOut, t.channel, offTime);
        }
      }, time + Math.max(0.02, Number(n.duration) || 0) + (app.midiIO.tailMs / 1000));
      // Do not accumulate totals at schedule-time; accuracy is computed per loop window
    });
  });

  if (app.midi) {
    // Schedule sustain (CC64) for all tracks/channels regardless of mute/solo.
    // Pedal is a per-channel controller that affects overlapping tracks; gating by
    // track enablement can leave sustain-down state stuck and cause lingering highlights.
    app.midi.tracks.forEach((mt, mi) => {
      const channel = (typeof mt.channel === 'number') ? mt.channel : (app.tracks[mi]?.channel ?? 0);
      const cc64Arr = mt.controlChanges && (mt.controlChanges[64] || mt.controlChanges["64"]) || [];
      cc64Arr.forEach(cc => {
        const val = Math.round((cc.value ?? 0) * 127);
        Tone.Transport.schedule(() => {
          if (token !== app.renderToken) return;
          if (modeSelect?.value !== 'listen') return;
          // In Listen mode, follow song sustain and forward CC
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
        // In Guided mode, pause and show overlay instead of auto-restarting
        if (app.guided.enabled && modeSelect.value === 'practice') {
          try { evaluateLoopPerformance(); } catch {}
          // Persist progress snapshot
          persistGuidedProgress?.();
          // Clear satisfied marks for next attempt, keep stats until overlay action
          ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
          drawKeyboard();
          showAccuracyOverlay();
          // Keep _pending true until user chooses Replay/Continue to avoid re-triggering
        } else {
          // Legacy fallback: short pause then auto-loop
          loop._timer = setTimeout(() => {
            loop._timer = null;
            try { evaluateLoopPerformance(); } catch {}
            app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
            app.practice.matchedIds = new Set();
            clearEarlyLookaheadState();
            try { Tone.Transport.seconds = start; } catch {}
            // Clear any lingering audio and visual state before restarting the loop
            try { panicAll(); } catch {}
            try {
              app.liveKeys.clear();
              app.keyGlow.clear();
              app.upcomingKeys.clear();
              app._lastLandingFlash.clear();
              app.pedal.sustainDown.clear();
              app.pedal.sustained.forEach(set => set.clear());
            } catch {}
            ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
            if (wasRunning) { try { Tone.Transport.start(); } catch {} }
            loop._pending = false;
          }, Math.max(0, pauseMs || 300));
        }
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
  try {
    Tone.getContext().latencyHint = 'interactive';
    Tone.getContext().lookAhead = Math.max(0.2, Tone.getContext().lookAhead || 0.2);
  } catch {}
  if (!app.midi) return showOverlay("Upload a MIDI file first");
  scheduleIfNeeded();
  // If loop is enabled (e.g., in Guided), start from loop.start when outside the window
  try {
    if (app.practice?.loop?.enabled) {
      const { start, end } = app.practice.loop;
      const t = Tone.Transport.seconds || 0;
      if (!(t >= start && t < end)) {
        Tone.Transport.seconds = start;
        updateTimeUI(start);
      }
    }
  } catch {}
  await doCountdownIfNeeded();

  Tone.Transport.start(`+${START_DELAY}`);
  startAnimation();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';

});

btnPause.addEventListener("click", () => {
  Tone.Transport.pause();
  stopAnimation({ clear: false });
  // Ensure no notes keep sounding (external MIDI or local synth)
  panicAll();
  // Clear visual and sustain states to avoid stuck keys
  try {
    app.liveKeys.clear();
    app.keyGlow.clear();
    app.upcomingKeys.clear();
    app._lastLandingFlash.clear();
    app.pedal.sustainDown.clear();
    app.pedal.sustained.forEach(set => set.clear());
  } catch {}
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
  panicAll();
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
  // Stop any lingering notes when scrubbing
  panicAll();

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
  // practice toggle removed
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
// practice toggle removed
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

// Guided config handlers
// Section length control removed; always 20s

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
    Tone.getContext().lookAhead = Math.max(0.2, Tone.getContext().lookAhead || 0.2);
  } catch {}
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause();
    panicAll();
    fsPlayPauseIcon.textContent = 'Play';
  } else {
    scheduleIfNeeded();
    // Ensure we start inside loop window when enabled
    try {
      if (app.practice?.loop?.enabled) {
        const { start, end } = app.practice.loop;
        const t = Tone.Transport.seconds || 0;
        if (!(t >= start && t < end)) {
          Tone.Transport.seconds = start;
          updateTimeUI(start);
        }
      }
    } catch {}

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

// --- Guided Panel Drag & Persist ------------------------------------------------
const GUIDED_POS_KEY = 'km_guided_panel_pos_v1';

function clampPanelPos(x, y) {
  const pad = 8; // keep a bit of margin
  const w = guidedPanel?.offsetWidth || 320;
  const h = guidedPanel?.offsetHeight || 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const nx = Math.min(Math.max(pad, x), Math.max(pad, vw - w - pad));
  const ny = Math.min(Math.max(pad, y), Math.max(pad, vh - h - pad));
  return { x: nx, y: ny };
}

function applyGuidedPanelSavedPosition() {
  if (!guidedPanel) return;
  try {
    const raw = localStorage.getItem(GUIDED_POS_KEY);
    if (!raw) return;
    const { x, y } = JSON.parse(raw);
    const clamped = clampPanelPos(Number(x) || 0, Number(y) || 0);
    // Switch from bottom-right utility classes to explicit top/left when custom position exists
    guidedPanel.classList.remove('right-3','bottom-3');
    guidedPanel.style.right = 'auto';
    guidedPanel.style.bottom = 'auto';
    guidedPanel.style.left = `${Math.round(clamped.x)}px`;
    guidedPanel.style.top = `${Math.round(clamped.y)}px`;
  } catch {}
}

function saveGuidedPanelPosition(x, y) {
  try { localStorage.setItem(GUIDED_POS_KEY, JSON.stringify({ x, y })); } catch {}
}

function makeGuidedPanelDraggable() {
  if (!guidedPanel || !guidedPanelHeader) return;
  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const onMouseDown = (e) => {
    if (!guidedPanel) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    // Get current left/top; if using bottom/right defaults, compute from bounding rect
    const rect = guidedPanel.getBoundingClientRect();
    if (guidedPanel.style.left) {
      origX = parseFloat(guidedPanel.style.left) || rect.left;
      origY = parseFloat(guidedPanel.style.top) || rect.top;
    } else {
      origX = rect.left;
      origY = rect.top;
    }
    // Switch positioning mode to top/left if needed
    guidedPanel.classList.remove('right-3','bottom-3');
    guidedPanel.style.right = 'auto';
    guidedPanel.style.bottom = 'auto';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!dragging || !guidedPanel) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const { x, y } = clampPanelPos(origX + dx, origY + dy);
    guidedPanel.style.left = `${Math.round(x)}px`;
    guidedPanel.style.top = `${Math.round(y)}px`;
  };

  const onMouseUp = (e) => {
    if (!dragging || !guidedPanel) return;
    dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // Persist final position
    const rect = guidedPanel.getBoundingClientRect();
    saveGuidedPanelPosition(rect.left, rect.top);
  };

  guidedPanelHeader.addEventListener('mousedown', onMouseDown);

  // Re-clamp position on resize to keep panel on-screen
  window.addEventListener('resize', () => {
    if (!guidedPanel) return;
    const rect = guidedPanel.getBoundingClientRect();
    const { x, y } = clampPanelPos(rect.left, rect.top);
    if (guidedPanel.style.left) {
      guidedPanel.style.left = `${Math.round(x)}px`;
      guidedPanel.style.top = `${Math.round(y)}px`;
    }
  });
}

// Initialize draggable + restore saved position
try {
  makeGuidedPanelDraggable();
  applyGuidedPanelSavedPosition();
} catch {}

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
    // Use grouped time for synchronized chord visuals if available
    const groupedTime = app.practice.groupTimeById?.get(n.id);
    const start = (groupedTime != null ? groupedTime : n.time); // MIDI event time (audio note-on)
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

      // Only pre-glow upcoming keys when actually playing in Listen mode
      if (start - currentTime <= 0.4 && start - currentTime > 0) {
        app.upcomingKeys.add(visMidi);
        if (modeSelect?.value === 'listen' && Tone.Transport.state === 'started') {
          startKeyGlow(visMidi, true, col);
        }
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
    const t = getSmoothVisualTime();
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

const BASE_TOLERANCE = 0.30; 

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
  const nowCal = now + (app.practice.inputOffsetSec || 0);

  // During accuracy overlay lock, ignore input for visuals/detection but allow optional MIDI Thru
  if (app.guided?.inputLocked) {
    if (cmd === 0x90 && velocity > 0) {
      if (app.midiIO.thru) sendNoteOn(applyTranspose(note), Math.round(velocity * 127), ch);
    } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
      if (app.midiIO.thru) sendNoteOff(applyTranspose(note), ch);
    } else if (cmd === 0xB0) {
      const controller = data1 & 0x7f; const value = data2 & 0x7f;
      if (app.midiIO.thru) sendCC(controller, value, ch);
    }
    return;
  }

  if (cmd === 0x90 && velocity > 0) {
    if (LOG_MIDI && console.debug) console.debug(`[LP] Note ${note} ON ch${ch} at ${now.toFixed(3)}`);
    const tNote = applyTranspose(note);
    // In Listen mode, visuals are driven by the song; ignore inbound highlights entirely
    if (modeSelect?.value === 'listen') {
      if (app.midiIO.thru) sendNoteOn(tNote, Math.round(velocity * 127), ch);
      return;
    }
    // Filter looped-back echoes of our own outbound messages
    if (isLikelyEcho('on', tNote, ch, now)) {
      return;
    }
    handleNoteOnVisual(tNote, ch, colorForIncoming(note));
    if (app.midiIO.thru) sendNoteOn(tNote, Math.round(velocity * 127), ch);
    checkNoteHit(tNote, nowCal);

    // Smart play-ahead: credit hits for groups within lookahead window and skip their wait later
    if (modeSelect.value === 'practice' && app.practice.noteWait) {
      const ahead = findGroupsInLookahead(nowCal);
      const tol = app.practice.octaveTol || 0;
      for (const g of ahead) {
        let set = app.practice.earlyHits.get(g.index);
        if (!set) { set = new Set(); app.practice.earlyHits.set(g.index, set); }
        // Mark if matches any required note by pitch class ±octaveTol
        for (const req of g.notes) {
          if (set.has(req)) continue;
          if (midiMatchesWithOctave(req, tNote, tol)) {
            set.add(req);
            break;
          }
        }
        if (set.size >= g.notes.length) {
          app.practice.skipWaitFor.add(g.index);
        }
      }

      // Also allow slight early arming of the immediate upcoming group (within hit window)
      const near = findUpcomingGroupNearTime(nowCal);
      if (near) {
        if (!app.practice.waiting) {
          app.practice.waiting = true;
          app.practice.currentIndex = near.index;
          app.practice.requiredSet = new Set(near.notes);
          app.practice.hitSet = new Set();
          app.practice.lastWaitTime = near.time;
        }
        if (matchAndMarkRequired(tNote)) {
          if (isCurrentChordSatisfied()) {
            if (Tone.Transport.state !== 'started') resumeFromGroupWait(now);
          }
        }
      }
    }

    if (app.practice.waiting) {
      if (matchAndMarkRequired(tNote)) {
        if (isCurrentChordSatisfied()) {
          resumeFromGroupWait(now);
        }
      } else {
        // Ignore extra notes during waiting (no penalty)
      }
    }
  } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
    if (LOG_MIDI && console.debug) console.debug(`[LP] Note ${note} OFF ch${ch} at ${now.toFixed(3)}`);
    const tNote = applyTranspose(note);
    if (modeSelect?.value === 'listen') {
      if (app.midiIO.thru) sendNoteOff(tNote, ch);
      return;
    }
    if (isLikelyEcho('off', tNote, ch, now)) {
      return;
    }
    handleNoteOffVisual(tNote, ch, colorForIncoming(note));
    if (app.midiIO.thru) sendNoteOff(tNote, ch);
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
  const calibration = app.practice.inputOffsetSec || 0;
  const window = (app.practice.hitWindowSec || BASE_TOLERANCE);
  const tolerance = window; // already in seconds, applied around expected times

  const bucket = Math.round(timeSec * 10) / 10;
  const neighborBuckets = [bucket, Math.round((timeSec + 0.05) * 10) / 10, Math.round((timeSec - 0.05) * 10) / 10];

  let matched = false;
  for (const b of neighborBuckets) {
    const list = app.expectedNotesByTime.get(b);
    if (!list) continue;
    for (const exp of list) {
      // expected is stored in original MIDI space; compare in transposed space
      if (!exp.hit && midiMatchesWithOctave(applyTranspose(exp.midi), midi, app.practice.octaveTol || 0) && Math.abs(exp.time - timeSec) <= tolerance) {
        exp.hit = true;
        matched = true;
        app.score += 1;
        scoreEl.textContent = String(app.score);
        flashKey(midi, true);

        startKeyGlow(midi, true, '#22c55e');
        setTimeout(() => startKeyGlow(midi, false, '#22c55e'), 140);
        // Track matched id for per-note accuracy within current loop window
        try {
          const inLoop = app.practice.loop?.enabled ? (exp.time >= app.practice.loop.start && exp.time < app.practice.loop.end) : true;
          if (inLoop && exp.id) app.practice.matchedIds.add(exp.id);
        } catch {}
        return true;
      }
    }
  }
  if (!app.practice.waiting) {
    flashKey(midi, false);
    startKeyGlow(midi, true, '#ef4444');
    setTimeout(() => startKeyGlow(midi, false, '#ef4444'), 200);
  }
  return false;
}

// Accept if played matches expected within ±octaveTol octaves (same pitch class)
function midiMatchesWithOctave(expected, played, octaveTol) {
  if (expected === played) return true;
  const tol = Math.max(0, Math.min(2, Number(octaveTol) || 0));
  const diff = played - expected;
  if ((diff % 12 + 12) % 12 !== 0) return false;
  return Math.abs(diff) <= tol * 12;
}

// During waiting, mark the matching required note as hit using octave tolerance
function matchAndMarkRequired(playedMidi) {
  if (!app.practice.waiting) return false;
  const tol = app.practice.octaveTol || 0;
  // Try to match against requiredSet and also record matched id for partial-credit accounting
  for (const req of app.practice.requiredSet) {
    if (app.practice.hitSet.has(req)) continue;
    if (midiMatchesWithOctave(req, playedMidi, tol)) {
      app.practice.hitSet.add(req);
      // Also map this match to a concrete expected note id within the current group (if available)
      try {
        const gi = app.practice.currentIndex;
        const g = app.practice.groups?.[gi];
        if (g && Array.isArray(g.ids) && Array.isArray(g.notes) && g.ids.length === g.notes.length) {
          for (let k = 0; k < g.notes.length; k++) {
            const noteVal = g.notes[k];
            const id = g.ids[k];
            if (!app.practice.matchedIds.has(id) && midiMatchesWithOctave(noteVal, playedMidi, tol)) {
              app.practice.matchedIds.add(id);
              break;
            }
          }
        }
      } catch {}
      return true;
    }
  }
  return false;
}

function flashKey(midi, ok) {
  // Reduce UI spam to prevent jank in dense passages
  if (modeSelect?.value === 'practice') {
    // In practice, rely on visual key glow; avoid overlay per note
    return;
  }
  const now = performance.now();
  if (!flashKey._last || (now - flashKey._last) > 400) {
    flashKey._last = now;
    showOverlay(ok ? "Correct!" : "Oops", 400);
  }
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
          let midi;
          try {
            midi = new Midi(bytes.buffer);
          } catch (err) {
            console.warn('[KeyMistry] Auto-load previous MIDI parse failed, applying sanitize fallback…', err);
            const safe = sanitizeTimeSignatureMeta(bytes);
            midi = new Midi(safe.buffer);
          }
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
  clearEarlyLookaheadState();
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

// Warn users if a MIDI likely contains multiple instruments (more than 3 note-bearing tracks)
function countNoteTracks(midi) {
  try {
    return midi?.tracks?.filter(t => Array.isArray(t.notes) && t.notes.length > 0).length || 0;
  } catch { return 0; }
}
function openConfirmModal(message, title = 'Confirm') {
  return new Promise((resolve) => {
    if (multiTrackTitle) multiTrackTitle.textContent = title;
    if (multiTrackText) multiTrackText.textContent = message;
    multiTrackModal?.classList.remove('hidden');
    const cleanup = () => {
      multiTrackModal?.classList.add('hidden');
    };
    const onCancel = () => { cleanup(); resolve(false); };
    const onOk = () => { cleanup(); resolve(true); };
    multiTrackCancel?.addEventListener('click', onCancel, { once: true });
    multiTrackContinue?.addEventListener('click', onOk, { once: true });
  });
}
async function shouldProceedWithMultiTrack(midi) {
  const noteTracks = countNoteTracks(midi);
  if (noteTracks <= 3) return true;
  const msg = [
    `This MIDI appears to have ${noteTracks} instrument tracks.`,
    '',
    'For best results, use a solo piano MIDI. You can continue, but you may need to mute extra tracks so playback sounds correct.',
    '',
    'Continue loading this MIDI?'
  ].join('\n');
  const ok = await openConfirmModal(msg, 'Multiple Instruments Detected');
  if (ok) {
    // Gentle tip toast after continuing
    showOverlay('Tip: Use the Mute/Solo buttons in the Tracks panel to limit to piano parts.', 2000);
  }
  return ok;
}

// ===== Walkthrough (Driver.js) =====
function closeWalkthroughWelcome() { walkthroughWelcome?.classList.add('hidden'); }
function openWalkthroughWelcome() { walkthroughWelcome?.classList.remove('hidden'); }

function getDriverSteps() {
  // Build steps and filter out any missing elements to avoid "no steps" runtime error
  const defs = [
    { sel: '#uploadLabel', title: 'MIDI Upload', desc: 'Upload a MIDI file to start learning. Your file stays local and private.', side: 'bottom', align: 'start' },
    { sel: '#openMIDISettings', title: 'MIDI & Visual Settings', desc: 'Configure MIDI input/output, timing offsets, and visual preferences.', side: 'bottom', align: 'end' },
    { sel: '#openTransposeSettings', title: 'Transpose & Key', desc: 'Shift the song to a comfortable scale with transpose and key settings.', side: 'bottom', align: 'end' },
    { sel: '#modeSelect', title: 'Practice & Guided Modes', desc: 'Switch between Listen and Practice. Guided Mode teaches each section step-by-step.', side: 'bottom', align: 'start' },
    { sel: '#progress', title: 'Timeline', desc: 'Scrub through the song. Your accuracy and progress save automatically in your browser.', side: 'bottom', align: 'center' },
    { sel: '#speed', title: 'Tempo', desc: 'Adjust the playback tempo to slow down tricky parts.', side: 'bottom', align: 'start' },
    { sel: '#guidedToggle', title: 'Guided Learning', desc: 'Open the Guided panel when you’re ready for structured stages.', side: 'bottom', align: 'end' },
    { sel: '#loopToggle', title: 'Loop Practice', desc: 'Enable Loop and set Start/End to focus on a section while it repeats.', side: 'bottom', align: 'start' },
    { sel: '#tracksPanel', title: 'Track Colors', desc: 'Each instrument track is listed here. Use mute/solo. Left hand = electric blue, Right hand = soft orange.', side: 'right', align: 'start' },
    { sel: '#pianoRoll', title: 'Falling Notes', desc: 'These falling tiles represent notes. When they touch the keyboard line, press that key!', side: 'top', align: 'center' },
    { sel: '#dashboardLink', title: 'Progress Dashboard', desc: 'Open the Dashboard to review accuracy and completion over time.', side: 'top', align: 'center' }
  ];
  const steps = [];
  for (const d of defs) {
    if (document.querySelector(d.sel)) {
      steps.push({ element: d.sel, popover: { title: d.title, description: d.desc, side: d.side, align: d.align } });
    }
  }
  return steps;
}

async function startWalkthrough() {
  // Resolve driver factory from CDN IIFE build or fallback
  let driverFactory = null;
  if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') {
    driverFactory = window.driver.js.driver;
  } else if (typeof window.driver === 'function') {
    driverFactory = window.driver; // fallback if global exposes directly
  }
  if (!driverFactory) {
    // Wait for any async loader if present
    if (window._driverReady && typeof window._driverReady.then === 'function') {
      try { await window._driverReady; } catch {}
      if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') driverFactory = window.driver.js.driver;
      else if (typeof window.driver === 'function') driverFactory = window.driver;
    }
  }
  if (!driverFactory) {
    console.warn('Driver.js not loaded');
    return;
  }
  const steps = getDriverSteps();
  if (!steps.length) {
    console.warn('Walkthrough: no steps found (selectors missing?).');
    if (typeof showOverlay === 'function') showOverlay('Tutorial unavailable right now.', 1800);
    return;
  }
  const driverObj = driverFactory({
    showProgress: true,
    allowClose: true,
    steps,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    onDestroyed: () => {
      try { localStorage.setItem('km_walkthrough_done', 'true'); } catch {}
    }
  });
  try { driverObj.drive(); }
  catch (e) {
    // Fallback: try highlighting the first step directly if drive is unavailable
    try { driverObj.highlight(steps[0]); } catch {}
  }
}

function maybeAutoStartWalkthrough() {
  try {
    const done = localStorage.getItem('km_walkthrough_done') === 'true';
    if (!done) {
      openWalkthroughWelcome();
    }
  } catch { /* ignore */ }
}

// Wire welcome modal
walkthroughStart?.addEventListener('click', () => {
  closeWalkthroughWelcome();
  // slight delay to ensure layout is stable
  setTimeout(startWalkthrough, 200);
});
walkthroughSkip?.addEventListener('click', () => {
  closeWalkthroughWelcome();
  try { localStorage.setItem('km_walkthrough_done', 'true'); } catch {}
});

// Replay button
helpWalkthroughBtn?.addEventListener('click', async () => {
  const ok = await openConfirmModal('Replay the walkthrough?', 'Replay Walkthrough');
  if (ok) {
    try {
      localStorage.removeItem('km_walkthrough_done');
      localStorage.removeItem('km_walkthrough_last_step');
    } catch {}
    openWalkthroughWelcome();
  }
});

// Auto-start on first load once UI has initialized
window.addEventListener('load', () => setTimeout(maybeAutoStartWalkthrough, 400));

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
  const tol = app.practice.chordWindowSec || 0.06; 
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
  app.practice.groupTimeById = new Map();
  for (const g of groups) {
    for (const id of g.ids) app.practice.groupTimeById.set(id, g.time);
  }
  // Reset smart play-ahead caches when groups rebuild
  app.practice.earlyHits = new Map();
  app.practice.skipWaitFor = new Set();
  app.practice.satisfiedGroups = new Set();
}

// Find the next chord/group near a given (possibly calibrated) time
function findUpcomingGroupNearTime(tCal) {
  if (!Array.isArray(app.practice.groups) || !app.practice.groups.length) return null;
  const startIdx = Math.max(0, app.practice.currentIndex);
  const maxIdx = Math.min(app.practice.groups.length - 1, startIdx + 3);
  const win = (app.practice.hitWindowSec || BASE_TOLERANCE);
  for (let i = startIdx; i <= maxIdx; i++) {
    const g = app.practice.groups[i];
    if (!g) continue;
    if (Math.abs(g.time - tCal) <= win) return { ...g, index: i };
    if (g.time > tCal + win) break;
  }
  return null;
}

// Find all groups within lookahead window [tCal, tCal + lookahead]
function findGroupsInLookahead(tCal) {
  const out = [];
  const list = app.practice.groups || [];
  const look = Math.max(0, app.practice.lookaheadSec || 0);
  if (!list.length || look <= 0) return out;
  // Limit to current loop/section if enabled
  const loStart = app.practice.loop.enabled ? app.practice.loop.start : tCal;
  const loEnd = app.practice.loop.enabled ? app.practice.loop.end : (tCal + look);
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    if (g.time < loStart) continue;
    if (g.time > Math.min(loEnd, tCal + look)) break;
    if (g.time >= tCal) out.push({ ...g, index: i });
  }
  return out;
}

function clearEarlyLookaheadState() {
  app.practice.earlyHits.clear();
  app.practice.skipWaitFor.clear();
  if (maybePauseForGroup._credited) maybePauseForGroup._credited.clear();
  app.practice.satisfiedGroups.clear();
}

function maybePauseForGroup(index) {
  if (!app.practice.noteWait || modeSelect.value !== 'practice') return;
  const g = app.practice.groups[index];
  if (!g) return;
  const t = Tone.Transport.seconds;
  const tCal = t + (app.practice.inputOffsetSec || 0);

  if (t > g.time + 0.02) return;

  // Smart play-ahead: if this group is marked to skip waiting, don't pause
  if (app.practice.skipWaitFor.has(index)) {
    // If we were waiting for this index, mark satisfied and continue
    if (app.practice.waiting && app.practice.currentIndex === index) {
      app.practice.waiting = false;
      clearTimeout(app.practice._waitTimeout);
    }
    // Credit correctness for this group once when reached
    if (!maybePauseForGroup._credited) maybePauseForGroup._credited = new Set();
    if (!maybePauseForGroup._credited.has(index)) {
      maybePauseForGroup._credited.add(index);
      app.practice.stats.correct += (g.notes?.length || 0);
      const delta = t - (g.time ?? t);
      app.practice.stats.timings.push(delta);
      updateGuidedUI();
      app.practice.satisfiedGroups.add(index);
    }
    return;
  }

  // If already in waiting for this group, check if satisfied; avoid unnecessary pauses
  if (app.practice.waiting && app.practice.currentIndex === index) {
    if (isCurrentChordSatisfied()) {
      app.practice.waiting = false;
      return;
    }
  } else {
    app.practice.waiting = true;
    app.practice.currentIndex = index;
    app.practice.requiredSet = new Set(g.notes);
    app.practice.hitSet = new Set();
    app.practice.lastWaitTime = g.time;
  }

  // Pause only if group not yet satisfied at its time
  if (!isCurrentChordSatisfied()) {
    Tone.Transport.pause();
    // Safety: auto-continue after a short grace if not all notes were detected
    if (app.practice.autoContinue) {
      clearTimeout(app.practice._waitTimeout);
      app.practice._waitTimeout = setTimeout(() => {
        if (app.practice.waiting && app.practice.currentIndex === index && !isCurrentChordSatisfied()) {
          // Count remaining notes as misses, then continue
          for (const n of app.practice.requiredSet) {
            if (!app.practice.hitSet.has(n)) app.practice.stats.misses.push({ midi: n, time: g.time });
          }
          resumeFromGroupWait(Tone.Transport.seconds);
        }
      }, Math.max(600, (app.practice.hitWindowSec || BASE_TOLERANCE) * 2000)); // ~2x hit window, min 600ms
    }
  }
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
  clearTimeout(app.practice._waitTimeout);

  // Credit only the notes actually hit; full credit and satisfiedGroups only if the chord was fully matched
  try {
    const gi = app.practice.currentIndex;
    const required = app.practice.requiredSet || new Set();
    const hitCount = [...required].filter(n => app.practice.hitSet?.has(n)).length;
    app.practice.stats.correct += hitCount;
    const delta = now - (app.practice.lastWaitTime ?? now);
    app.practice.stats.timings.push(delta);
    if (Number.isFinite(gi) && hitCount >= required.size && required.size > 0) {
      app.practice.satisfiedGroups.add(gi);
    }
  } catch {
    // fall back: no extra credit
  }
  updateGuidedUI();

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

// ---- MIDI echo guard helpers ----
function _echoKey(type, midi, channel) {
  return `${channel & 0x0f}:${midi & 0x7f}:${type}`;
}
function markOutbound(type, midi, channel) {
  try {
    const key = _echoKey(type, midi, channel);
    app.midiIO._echo.set(key, Tone.Transport.seconds || 0);
  } catch {}
}
function isLikelyEcho(type, midi, channel, nowSec) {
  try {
    const key = _echoKey(type, midi, channel);
    const t = app.midiIO._echo.get(key);
    if (t == null) return false;
    return (nowSec - t) <= (app.midiIO.echoWindowSec || 0.3);
  } catch { return false; }
}

function _audioTimeToMidiTimestamp(audioTimeSec) {
  try {
    const ctx = Tone.getContext();
    const nowAudio = ctx.now(); // seconds
    const nowMs = performance.now();
    const deltaMs = Math.max(0, (audioTimeSec - nowAudio) * 1000);
    return nowMs + deltaMs;
  } catch { return undefined; }
}

function sendNoteOn(midi, velocity = 100, channel = 0, schedTimeSec = undefined) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0x90 | (channel & 0x0f);
  try {
    const ts = (schedTimeSec != null) ? _audioTimeToMidiTimestamp(schedTimeSec) : undefined;
    out.send([status, midi & 0x7f, clamp(velocity, 0, 127)], ts);
    markOutbound('on', midi, channel);
  } catch {}
}
function sendNoteOff(midi, channel = 0, schedTimeSec = undefined) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0x80 | (channel & 0x0f);
  try {
    const ts = (schedTimeSec != null) ? _audioTimeToMidiTimestamp(schedTimeSec) : undefined;
    out.send([status, midi & 0x7f, 0x00], ts);
    markOutbound('off', midi, channel);
  } catch {}
}
function sendCC(controller, value, channel = 0) {
  const out = app.midiIO.output;
  if (!out) return;
  const status = 0xB0 | (channel & 0x0f);
  try { out.send([status, controller & 0x7f, clamp(value, 0, 127)]); } catch {}
}

function panicAll() {
  // External MIDI: send sustain off, all notes off, and optionally all sound off/reset
  for (let ch = 0; ch < 16; ch++) {
    sendCC(64, 0, ch); // sustain off
    const out = app.midiIO.output;
    if (!out) continue;
    try { out.send([0xB0 | ch, 123, 0]); } catch {} // All Notes Off (CC123)
    try { out.send([0xB0 | ch, 120, 0]); } catch {} // All Sound Off (CC120)
    try { out.send([0xB0 | ch, 121, 0]); } catch {} // Reset All Controllers (CC121)
  }
  // Local audio: release all voices immediately
  try { app.synths.forEach(s => s?.releaseAll?.()); } catch {}
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

// Visual clock smoothing to avoid small jitters from Transport.seconds
const _smoothClock = { est: 0, lastRaf: 0, lastState: 'stopped', lastTone: 0 };
function getSmoothVisualTime() {
  const tone = getPlaybackTime();
  const now = performance.now();
  const state = Tone.Transport.state;
  if (state !== 'started') {
    _smoothClock.est = tone;
    _smoothClock.lastRaf = now;
    _smoothClock.lastState = state;
    _smoothClock.lastTone = tone;
    return tone;
  }
  if (_smoothClock.lastState !== 'started' || Math.abs(tone - _smoothClock.est) > 0.15) {
    _smoothClock.est = tone;
    _smoothClock.lastRaf = now;
    _smoothClock.lastState = state;
    _smoothClock.lastTone = tone;
    return tone;
  }
  const dt = Math.max(0, (now - _smoothClock.lastRaf) / 1000);
  _smoothClock.est += dt;
  _smoothClock.lastRaf = now;
  _smoothClock.lastState = state;
  _smoothClock.lastTone = tone;
  // Nudge towards the real transport time to correct drift gradually
  const err = clamp(tone - _smoothClock.est, -0.05, 0.05);
  _smoothClock.est += err * 0.2;
  return _smoothClock.est;
}

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
  persistSongConfig();
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
    // Reset guided/practice waiting state so required notes re-evaluate in new transpose
    app.practice.waiting = false;
    app.practice.requiredSet.clear();
    app.practice.hitSet.clear();
  } catch {}
  // Rebuild groups immediately with new transposed pitches
  clearEarlyLookaheadState();
  buildPracticeGroups();
  const t = getPlaybackTime();
  drawNotes(t); drawKeyboard();
  rescheduleTransport();
  updateEffectiveKeyLabel();
  persistSongConfig();
});

// Timing calibration controls
inputOffsetMsInput?.addEventListener('input', () => {
  const ms = parseInt(inputOffsetMsInput.value || '0', 10);
  if (inputOffsetLabel) inputOffsetLabel.textContent = `${ms} ms`;
  app.practice.inputOffsetSec = clamp(ms / 1000, -0.4, 0.4);
  savePref('inputOffsetMs', ms);
});

// Octave tolerance controls
octaveTolInput?.addEventListener('input', () => {
  const v = clamp(parseInt(octaveTolInput.value || '1', 10) || 0, 0, 2);
  app.practice.octaveTol = v;
  if (octaveTolLabel) octaveTolLabel.textContent = `±${v} oct`;
  savePref('octaveTol', v);
});
keyTonicSelect?.addEventListener('change', () => {
  app.pitch.keyTonic = parseInt(keyTonicSelect.value || '0', 10) || 0;
  savePref('keyTonic', app.pitch.keyTonic);
  persistSongConfig();
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
      app.practice.waiting = false;
      app.practice.requiredSet.clear();
      app.practice.hitSet.clear();
    } catch {}
    clearEarlyLookaheadState();
    buildPracticeGroups();
    const t = getPlaybackTime();
    drawNotes(t); drawKeyboard();
    rescheduleTransport();
  }
  updateEffectiveKeyLabel();
  persistSongConfig();
});
keyScaleSelect?.addEventListener('change', () => {
  app.pitch.keyScale = keyScaleSelect.value || 'major';
  savePref('keyScale', app.pitch.keyScale);
  updateEffectiveKeyLabel();
  persistSongConfig();
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
    persistSongConfig();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';
  }
});

updateEffectiveKeyLabel();