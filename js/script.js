import * as Tone from "https://esm.sh/tone@14.8.49";
import { Midi } from "https://esm.sh/@tonejs/midi@2.0.28";

if (window.__KM_BLOCKED) {

}

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
const openRolesBtn = document.getElementById('openRoles');
const rolesModal = document.getElementById('rolesModal');
const rolesList = document.getElementById('rolesList');
const rolesClose = document.getElementById('rolesClose');
const rolesSave = document.getElementById('rolesSave');
const rolesAuto = document.getElementById('rolesAuto');
const handSelectModal = document.getElementById('handSelectModal');
const handPickLeft = document.getElementById('handPickLeft');
const handPickRight = document.getElementById('handPickRight');
const handPickBoth = document.getElementById('handPickBoth');
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

const inputOffsetMsInput = document.getElementById('inputOffsetMs');
const inputOffsetLabel = document.getElementById('inputOffsetLabel');

const octaveTolInput = document.getElementById('octaveTol');
const octaveTolLabel = document.getElementById('octaveTolLabel');

const transposeInput = document.getElementById('transpose');
const transposeLabel = document.getElementById('transposeLabel');
const keyTonicSelect = document.getElementById('keyTonic');
const keyScaleSelect = document.getElementById('keyScale');
const autoDetectKeyBtn = document.getElementById('autoDetectKey');
const detectedKeyLabel = document.getElementById('detectedKeyLabel');

function sanitizeTimeSignatureMeta(u8) {
  const out = new Uint8Array(u8); 
  const n = out.length;
  for (let i = 0; i < n - 3; i++) {
    if (out[i] === 0xFF && out[i + 1] === 0x58) {

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

        out[i + 1] = 0x7F;
      }

      i = (j + len - 1);
    }
  }
  return out;
}

const guidedToggleBtn = document.getElementById('guidedToggle');
const guidedPanel = document.getElementById('guidedPanel');
const guidedPanelHeader = document.getElementById('guidedPanelHeader');
const guidedSectionLabel = document.getElementById('guidedSectionLabel'); 
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

const guidedDecision = document.getElementById('guidedDecision');
const guidedPracticeAgainBtn = document.getElementById('guidedPracticeAgainBtn');
const guidedPhaseContinueBtn = document.getElementById('guidedPhaseContinueBtn');
const guidedStepLeft = document.getElementById('guidedStepLeft');
const guidedStepRight = document.getElementById('guidedStepRight');
const guidedStepBoth = document.getElementById('guidedStepBoth');
const guidedScopeEl = document.getElementById('guidedScope');
const guidedOverallBar = document.getElementById('guidedOverallBar');
const guidedOverallLabel = document.getElementById('guidedOverallLabel');

const accuracyOverlay = document.getElementById('accuracyOverlay');
const accOvPercentEl = document.getElementById('accOvPercent');
const accOvTimingEl = document.getElementById('accOvTiming');
const accOvReplayBtn = document.getElementById('accReplayBtn');
const accOvContinueBtn = document.getElementById('accContinueBtn');
const accOvUnlockHint = document.getElementById('accOvUnlockHint');

const guidedSectionLenInput = null;

const guidedStrictToggle = null;
const guidedAccThresholdInput = null;
const guidedAccThresholdLabel = null;

const effectiveKeyLabel = document.getElementById('effectiveKeyLabel');

const visualLatencyInput = document.getElementById('visualLatencyOffset');
const visualLatencyLabel = document.getElementById('visualLatencyLabel');
let VISUAL_LATENCY = 0; 

const multiTrackModal = document.getElementById('multiTrackModal');
const multiTrackText = document.getElementById('multiTrackText');
const multiTrackTitle = document.getElementById('multiTrackTitle');
const multiTrackCancel = document.getElementById('multiTrackCancel');
const multiTrackContinue = document.getElementById('multiTrackContinue');

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

const LANDING_FLASH_ENABLED = false; 
const TRAILS_ENABLED = false;        
const SHADOWS_ENABLED = false;       

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
    sections: [], 
    stages: [],   
    currentIndex: 0,
    stage: 'left', 
    progressKey: null, 
    sectionLenSec: 20,

    inputLocked: false,
    overlayUnlockAt: 0,

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
  metronome: {
    enabled: true,
    countInBeats: 4,
    accentPeriod: 4,
    gain: null,
    synth: null,
    repeatId: null,
    countIn: { active: false, timers: [] },
  },
  renderToken: 0, 
  pitch: {
    transpose: 0,

    keyTonic: 0,
    keyScale: 'major',

    detectedTonic: null,
    detectedScale: null,

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
    inputOffsetSec: 0, 
  hitWindowSec: 0.30, 
    chordWindowSec: 0.06, 
    _waitTimeout: null,
    autoContinue: false, 
    octaveTol: 1, 

    lookaheadSec: 2.5,
    earlyHits: new Map(), 
    skipWaitFor: new Set(), 
    satisfiedGroups: new Set(), 
    lastLoopAccPercent: 0, 
    matchedIds: new Set(), 
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

    _echo: new Map(), 
    echoWindowSec: 0.3,
  },
  pedal: {
    sustainDown: new Map(), 
    sustained: new Map(),   
  },
  listen: {
    useAudioScheduler: true,
    playing: false,
    events: [], // flattened, tempo-aware absolute times (seconds)
    idx: 0, // next event index to schedule
    startAudioTime: 0, // audioContext.currentTime when current run started
    baseSongTimeSec: 0, // song position (seconds) corresponding to startAudioTime
    intervalId: null,
    intervalMs: 50, // scheduler tick
    aheadSec: 0.25 // schedule-ahead window
  },
  roles: [] // per-track: 'left' | 'right' | 'background'
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

  const inOff = loadPref('inputOffsetMs', 0);
  app.practice.inputOffsetSec = clamp((parseInt(inOff, 10) || 0) / 1000, -0.4, 0.4);
  if (inputOffsetMsInput) inputOffsetMsInput.value = String(parseInt(inOff, 10) || 0);
  if (inputOffsetLabel) inputOffsetLabel.textContent = `${parseInt(inOff, 10) || 0} ms`;

  const oTol = clamp(parseInt(loadPref('octaveTol', 1), 10) || 0, 0, 2);
  app.practice.octaveTol = oTol;
  if (octaveTolInput) octaveTolInput.value = String(oTol);
  if (octaveTolLabel) octaveTolLabel.textContent = `±${oTol} oct`;

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

    if (!(await shouldProceedWithMultiTrack(midi))) {
      showOverlay("Loading cancelled.");
      return;
    }

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

  // Load or initialize track roles and persist
  loadRoles();
  saveRoles();
  // Determine if separate hands are present based on roles
  try {
    const hasL = app.roles.includes('left');
    const hasR = app.roles.includes('right');
    app.guided.hasSeparateHands = hasL && hasR;
    app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
  } catch {}

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
  // Auto-open roles selector on new load so users can confirm
  try { renderRolesModal(); rolesModal?.classList.remove('hidden'); ensureRolesScrollable(); rolesList?.focus(); } catch {}
  rescheduleTransport();
  updateTimeUI(0);

  buildPracticeGroups();

  try {
    const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
    const base = String(name).replace(/\.[^/.]+$/, '').trim();
    const normalized = base.toLowerCase();
    app.guided.progressKey = `km_progress_${normalized}`;
    app.songCfgKey = `km_songcfg_${normalized}`;
  } catch { app.guided.progressKey = null; }

  const hasTwoOrMore = (app.tracks?.length || 0) > 1;
  app.guided.hasSeparateHands = hasTwoOrMore;
  const secLen = 20; 
  app.guided.sectionLenSec = secLen;
  const count = Math.max(1, Math.ceil(app.duration / secLen));
  app.guided.sections = Array.from({length: count}, (_, i) => {
    const start = i * secLen;
    const end = Math.min(app.duration, (i + 1) * secLen);
    return { label: `Section ${i+1}`, start, end };
  });

  app.guided.stages = Array.from({length: count}, (_, i) => ({
    index: i+1,
    mastery: { left: !hasTwoOrMore, right: !hasTwoOrMore, both: false },
    accByStage: { left: 0, right: 0, both: 0 },
    lastTempo: 1
  }));
  app.guided.currentIndex = 0; 
  app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
  restoreGuidedProgress();
  updateGuidedUI();

  if (app.practice.loop.enabled) {
    if (!(app.practice.loop.end > app.practice.loop.start)) {
      app.practice.loop.start = 0;
      app.practice.loop.end = app.duration;
      if (loopStartInput) loopStartInput.value = String(app.practice.loop.start);
      if (loopEndInput) loopEndInput.value = String(Math.round(app.practice.loop.end * 10) / 10);
    }
  }

  const r = detectKeyFromMidi();
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if (r) {
    app.pitch.detectedTonic = r.tonic;
    app.pitch.detectedScale = r.scale;
    if (detectedKeyLabel) detectedKeyLabel.textContent = `${names[r.tonic]} ${r.scale}`;

    app.pitch.keyTonic = r.tonic;
    app.pitch.keyScale = r.scale;
    if (keyTonicSelect) keyTonicSelect.value = String(r.tonic);
    if (keyScaleSelect) keyScaleSelect.value = r.scale;
    savePref('keyTonic', app.pitch.keyTonic);
    savePref('keyScale', app.pitch.keyScale);

    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);

    app.pitch.transpose = 0;
    savePref('transpose', 0);
    if (transposeInput) transposeInput.value = '0';
    if (transposeLabel) transposeLabel.textContent = '0';
    rescheduleTransport();
    updateEffectiveKeyLabel();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';

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

  restoreSongConfig();

  persistSongConfig();
}

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
  const rcol = roleColor(app.roles[idx] || 'background');
  swatch.style.background = rcol;

    const title = document.createElement("div");
    title.className = "flex-1 truncate text-sm";
    title.textContent = t.name;

    const role = document.createElement('span');
    role.className = 'text-[10px] px-1.5 py-0.5 rounded-full border border-gray-700 bg-gray-800';
    const r = (app.roles[idx] || 'background');
    role.textContent = r === 'left' ? 'L' : r === 'right' ? 'R' : 'B';
    role.style.color = r === 'left' ? '#14b8a6' : (r === 'right' ? '#fb923c' : '#9ca3af');

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
  row.appendChild(role);
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

function getSongKeyBase() {
  try {
    const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
    const base = String(name).replace(/\.[^/.]+$/, '').trim().toLowerCase();
    return base || 'unknown';
  } catch { return 'unknown'; }
}

function autoAssignRoles() {
  const roles = [];
  for (let i = 0; i < app.tracks.length; i++) {
    if (i === 0) roles[i] = 'left';
    else if (i === 1) roles[i] = 'right';
    else roles[i] = 'background';
  }
  app.roles = roles;
}

function loadRoles() {
  const key = `km_roles_${getSongKeyBase()}`;
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length === app.tracks.length) {
        app.roles = arr;
        return;
      }
    }
  } catch {}
  autoAssignRoles();
}

function saveRoles() {
  const key = `km_roles_${getSongKeyBase()}`;
  try { localStorage.setItem(key, JSON.stringify(app.roles)); } catch {}
}

function renderRolesModal() {
  if (!rolesList) return;
  rolesList.innerHTML = '';
  const opts = [
    { v: 'left', label: 'Left Hand' },
    { v: 'right', label: 'Right Hand' },
    { v: 'background', label: 'Background' },
  ];
  app.tracks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-4 bg-gray-900/60 rounded-xl border border-gray-700 px-4 py-3 mb-3 last:mb-0';
    const name = document.createElement('div');
    name.className = 'flex-1 truncate text-base font-medium';
    name.textContent = t.name || `Track ${i+1}`;
    const sel = document.createElement('select');
    sel.className = 'px-3 py-2.5 bg-gray-800 rounded-lg border border-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer';
    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.v; opt.textContent = o.label; sel.appendChild(opt);
    });
    sel.value = app.roles[i] || 'background';
    sel.onchange = () => { app.roles[i] = sel.value; };
    row.appendChild(name);
    row.appendChild(sel);
    rolesList.appendChild(row);
  });
}

// Keep the roles list scrollable in Firefox and focusable for keyboard scroll
function ensureRolesScrollable() {
  if (!rolesList) return;
  try { rolesList.setAttribute('tabindex', '0'); } catch {}
  
  // Clean up any old listeners if called multiple times
  if (rolesList.__scrollWheel) rolesList.removeEventListener('wheel', rolesList.__scrollWheel);
  if (rolesList.__scrollTouchStart) rolesList.removeEventListener('touchstart', rolesList.__scrollTouchStart);
  if (rolesList.__scrollTouchMove) rolesList.removeEventListener('touchmove', rolesList.__scrollTouchMove);

  const onWheel = (e) => {
    // Let the native browser handle vertical scrolling entirely
    e.stopPropagation();
  };
  
  const onTouchStart = (e) => { 
    // We let the browser handle native scrolling, just stop propagation
    e.stopPropagation();
  };
  
  const onTouchMove = (e) => {
    // Let browser handle native touch scrolling, stop propagation to parent
    e.stopPropagation();
  };

  rolesList.__scrollWheel = onWheel;
  rolesList.__scrollTouchStart = onTouchStart;
  rolesList.__scrollTouchMove = onTouchMove;

  // Change to passive: true so wheel and touch don't block scrolling
  try {
    rolesList.addEventListener('wheel', onWheel, { passive: true });
    rolesList.addEventListener('touchstart', onTouchStart, { passive: true });
    rolesList.addEventListener('touchmove', onTouchMove, { passive: true });
  } catch {}
}

openRolesBtn?.addEventListener('click', () => {
  renderRolesModal();
  rolesModal?.classList.remove('hidden');
  try { ensureRolesScrollable(); rolesList?.focus(); } catch {}
});
rolesClose?.addEventListener('click', () => rolesModal?.classList.add('hidden'));
rolesSave?.addEventListener('click', () => { saveRoles(); buildTrackUI(); rescheduleTransport(); rolesModal?.classList.add('hidden'); });
rolesAuto?.addEventListener('click', () => { autoAssignRoles(); renderRolesModal(); });

// While the roles modal is open: Enter/Return saves; Esc closes; Ctrl/Cmd+S also saves
document.addEventListener('keydown', (e) => {
  if (!rolesModal || rolesModal.classList.contains('hidden')) return;
  if (e.key === 'Enter') { e.preventDefault(); rolesSave?.click(); }
  if (e.key === 'Escape') { e.preventDefault(); rolesClose?.click(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); rolesSave?.click(); }
});

function restoreGuidedProgress() {
  if (!app.guided.progressKey) return;
  try {
    const raw = localStorage.getItem(app.guided.progressKey);
    if (!raw) return;
    const data = JSON.parse(raw);

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

      correct += sz;
    } else if (Array.isArray(g.ids) && g.ids.length) {

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

  const currentFactor = parseFloat(speed.value || '1') || 1;
  const thrPct = 90; 
  if (percent >= thrPct) {
    const next = clamp(currentFactor + 0.1, 1.0, 1.3);
    if (next > currentFactor + 1e-6) {
      speed.value = String(next);
      speed.dispatchEvent(new Event('input'));
      showOverlay(`Great job! Increasing pace slightly… (${Math.round(next*100)}%)`, 1200);
    }
    if (st) st.lastTempo = next;

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

  app.practice.satisfiedGroups.clear();
  updateGuidedUI();

  if (percent >= 98) showOverlay(`🔥 Accuracy: ${percent}% – Ready to continue?`, 1400);
  else showOverlay(`🎯 Accuracy: ${percent}%`, 1200);
  showGuidedDecision(percent);
}

function avgTimingMs() {
  const arr = app.practice?.stats?.timings || [];
  if (!arr.length) return 0;
  const mean = arr.reduce((a,b)=>a+b,0) / arr.length;
  return Math.round(mean * 1000); 
}

function setOverlayButtonsEnabled(en) {
  if (accOvReplayBtn) { accOvReplayBtn.disabled = !en; }
  if (accOvContinueBtn) { accOvContinueBtn.disabled = !en; }
  if (accOvUnlockHint) accOvUnlockHint.classList.toggle('hidden', en);
}

function showAccuracyOverlay() {
  if (!accuracyOverlay) return;

  const total = Number(app.practice?.stats?.total) || 0;
  const correct = Number(app.practice?.stats?.correct) || 0;
  const percent = total > 0 ? Math.round((correct/total)*100) : 0; 
  const avgMs = avgTimingMs();
  if (accOvPercentEl) accOvPercentEl.textContent = String(percent);
  if (accOvTimingEl) accOvTimingEl.textContent = `${avgMs > 0 ? '+' : ''}${avgMs} ms`;

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

    if (app.practice?.loop) app.practice.loop._pending = false;
  };

  accOvReplayBtn?.addEventListener('click', async () => {
    if (performance.now() < app.guided.overlayUnlockAt) return;
    cleanup();

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

    guidedPhaseContinueBtn?.click();
  }, { once: true });
}

function showGuidedDecision(percent) {
  if (!guidedDecision) return;
  guidedDecision.classList.remove('hidden');
  const text = (app.guided.stage==='left') ? '➡ Continue to Right Hand' : (app.guided.stage==='right') ? '➡ Continue to Both Hands' : '➡ Continue to Next Section';
  if (guidedPhaseContinueBtn) guidedPhaseContinueBtn.textContent = text;

  if (guidedPhaseContinueBtn) {
    guidedPhaseContinueBtn.disabled = false;
    guidedPhaseContinueBtn.classList.remove('opacity-60');
  }
}

guidedPracticeAgainBtn?.addEventListener('click', () => {
  guidedDecision?.classList.add('hidden');

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

  if (modeSelect) modeSelect.value = 'practice';
  app.practice.noteWait = true;
  if (noteWaitToggle) noteWaitToggle.checked = true;

  app.practice.autoContinue = false;

  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
  app.practice.matchedIds = new Set();
  app.practice.lastLoopAccPercent = 0;
  clearEarlyLookaheadState();
  updateGuidedUI();
  setGuidedLoopToCurrentStage();
  applyGuidedStageHand();

  const st = app.guided.stages[app.guided.currentIndex];
  const factor = clamp(Number(st?.lastTempo) || 1, 0.5, 1.5);
  if (speed) { speed.value = String(factor); speed.dispatchEvent(new Event('input')); }
  guidedDecision?.classList.add('hidden');
  rescheduleTransport();
}

guidedToggleBtn?.addEventListener('click', () => {
  app.guided.enabled = !app.guided.enabled;
  guidedPanel?.classList.toggle('hidden', !app.guided.enabled);

  if (app.guided.enabled) {
    // Immediately stop any current playback and reset for guided flow
    try { cancelCountIn(); } catch {}
    try { stopPracticeMetronome(); } catch {}
    try {
      if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
        stopListenScheduler(false);
        app.listen.baseSongTimeSec = 0;
        reindexListenEvents(0);
      } else {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
      }
    } catch {}
    try { stopAnimation({ clear: true }); } catch {}
    try { panicAll(); } catch {}
    try {
      app.liveKeys.clear();
      app.keyGlow.clear();
      app.upcomingKeys.clear();
      app._lastLandingFlash.clear();
      app.pedal.sustainDown.clear();
      app.pedal.sustained.forEach(set => set.clear());
      ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
      drawKeyboard();
      updateTimeUI(0);
    } catch {}
    try { applyGuidedPanelSavedPosition(); } catch {}
  }
  if (app.guided.enabled) {

    if (guidedPrompt && guidedPromptMsg) {
      if (app.guided.hasSeparateHands) {
        guidedPromptMsg.textContent = "Detected separate left and right hand tracks. You’ll learn this song step-by-step — left, right, and then both together!";
      } else {
        guidedPromptMsg.textContent = "This MIDI file doesn’t differentiate left and right hand parts. You’ll practice both together.";
      }
      guidedPrompt.classList.remove('hidden');
    }
    // If song has separate hands, ask which to start (unless stored)
    try {
      const key = `km_handpref_${getSongKeyBase()}`;
      const saved = localStorage.getItem(key);
      const hasTwoOrMore = (app.tracks?.length || 0) > 1;
      if (hasTwoOrMore) {
        if (!saved) {
          // open hand selection modal and defer start until pick
          handSelectModal?.classList.remove('hidden');
          const onPick = (hand) => {
            try { localStorage.setItem(key, hand); } catch {}
            app.guided.stage = (hand === 'both') ? 'both' : hand;
            setHand(app.guided.stage);
            handSelectModal?.classList.add('hidden');
            startGuidedPracticeCycle();
            persistGuidedProgress();
          };
          const once = { once: true };
          handPickLeft?.addEventListener('click', () => onPick('left'), once);
          handPickRight?.addEventListener('click', () => onPick('right'), once);
          handPickBoth?.addEventListener('click', () => onPick('both'), once);
          return; // wait for user choice
        } else {
          app.guided.stage = saved === 'both' ? 'both' : (saved === 'right' ? 'right' : 'left');
          setHand(app.guided.stage);
        }
      } else {
        app.guided.stage = 'both';
        setHand('both');
      }
    } catch {}

    startGuidedPracticeCycle();

    persistGuidedProgress();
  }
  else {
    // Guided turned off: stop metronome and any pending count-in
    try { cancelCountIn(); } catch {}
    try { stopPracticeMetronome(); } catch {}
  }
});

guidedPromptContinue?.addEventListener('click', () => {
  guidedPrompt?.classList.add('hidden');
});

function markStageIfThreshold() {

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

  markStageIfThreshold();
  updateGuidedUI();
  persistGuidedProgress();

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

function scheduleIfNeeded() {
  if (!app.midi || app.scheduled) return;
  Tone.Transport.cancel();
  const now = 0;
  const token = app.renderToken;

  const isSoloActive = app.tracks.some((t) => t.solo);

  // Listen mode: use custom audio scheduler and skip Transport-based scheduling
  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    // Build flattened event list once
    app.listen.events = buildListenEvents(isSoloActive);
    app.listen.idx = 0;
    app.scheduled = true;
    // No Transport.scheduleRepeat; the animation loop + audio scheduler manage UI/loop
    return;
  }

  // Listen mode: build a single merged timeline across all tracks for tight sync
  if (modeSelect?.value === 'listen') {
    const events = [];
    const enabledTrack = (ti) => (isSoloActive ? app.tracks[ti]?.solo : !app.tracks[ti]?.muted);
    // Notes and visuals
    app.tracks.forEach((t, ti) => {
      if (!enabledTrack(ti)) return;
      const synth = app.synths[ti];
      const channel = t.channel ?? 0;
      // In Listen mode, do not filter notes by hand/roles
      t.notes.forEach((n) => {
        const start = (n.time || 0) + now;
        const dur = Math.max(0.02, Number(n.duration) || 0);
        const end = start + dur;
        const midiOut = applyTranspose(n.midi);
        // note on (audio + external) + visual on
  events.push({ type: 'noteOn', time: start, midi: midiOut, velocity: n.velocity, channel, synth, dur, color: colorForNoteObj(n) });
        // visual off exactly at logical end (no tail)
        events.push({ type: 'visualOff', time: end, midi: midiOut, channel, color: colorForNoteObj(n) });
        // external MIDI note off uses optional tail
        const tailSec = (app.midiIO.tailMs || 0) / 1000;
        events.push({ type: 'midiOff', time: end + tailSec, midi: midiOut, channel });
      });
    });
    // Sustain CC64 for ALL tracks/channels (don’t gate by mute/solo to keep pedal state accurate)
    app.midi.tracks.forEach((mt, mi) => {
      const channel = (typeof mt.channel === 'number') ? mt.channel : (app.tracks[mi]?.channel ?? 0);
      const cc64Arr = mt.controlChanges && (mt.controlChanges[64] || mt.controlChanges["64"]) || [];
      cc64Arr.forEach(cc => {
        events.push({ type: 'cc64', time: (cc.time || 0) + now, value: Math.round((cc.value ?? 0) * 127), channel });
      });
    });

    // Sort by time then by priority to maintain deterministic ordering on same timestamp
    const prio = { cc64: 0, noteOn: 1, visualOff: 2, midiOff: 3 };
    events.sort((a,b)=> (a.time - b.time) || (prio[a.type]-prio[b.type]) );

    // Schedule everything on the transport timeline; use Tone.Draw inside callbacks for visuals
    events.forEach(ev => {
      Tone.Transport.schedule((schedTime) => {
        if (token !== app.renderToken) return;
        if (modeSelect?.value !== 'listen') return;
        switch (ev.type) {
          case 'noteOn': {
            // Local audio synth
            if (shouldUseLocalAudio() && ev.synth) {
              try {
                ev.synth.triggerAttackRelease(
                  Tone.Frequency(ev.midi, 'midi').toFrequency(),
                  Math.max(0.02, ev.dur || 0),
                  schedTime,
                  ev.velocity
                );
              } catch {}
            }
            // External MIDI
            sendNoteOn(ev.midi, Math.round((ev.velocity || 0) * 127), ev.channel, schedTime);
            // Visual
            Tone.Draw.schedule(() => {
              if (token !== app.renderToken) return;
              handleNoteOnVisual(ev.midi, ev.channel, ev.color || getKeyGlowColor(ev.midi));
            }, schedTime);
            break;
          }
          case 'visualOff': {
            Tone.Draw.schedule(() => {
              if (token !== app.renderToken) return;
              handleNoteOffVisual(ev.midi, ev.channel, ev.color || getKeyGlowColor(ev.midi));
            }, schedTime);
            break;
          }
          case 'midiOff': {
            sendNoteOff(ev.midi, ev.channel, schedTime);
            break;
          }
          case 'cc64': {
            updateSustainState(ev.channel, (ev.value|0) >= 64, getPlaybackTime());
            sendCC(64, ev.value|0, ev.channel);
            break;
          }
        }
      }, ev.time);
    });

    // Continue with scheduleRepeat (loop handling and UI updates)
  } else {
    // Practice mode and other flows: existing per-track scheduler (needed for note-wait)
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

    // Additionally, in Guided/Practice, play background tracks audibly as accompaniment
    if (app.guided?.enabled) {
      app.tracks.forEach((t, ti) => {
        const role = (app.roles && app.roles[ti]) || 'background';
        if (role !== 'background') return; // only background
        const enabled = isSoloActive ? t.solo : !t.muted;
        if (!enabled) return;
        const synth = app.synths[ti];
        t.notes.forEach((n) => {
          const time = n.time + now;
          const dur = Math.max(0.02, Number(n.duration) || 0);
          Tone.Transport.schedule((schedTime) => {
            if (token !== app.renderToken) return;
            const midiOut = applyTranspose(n.midi);
            if (shouldUseLocalAudio() && synth) {
              try {
                synth.triggerAttackRelease(
                  Tone.Frequency(midiOut, 'midi').toFrequency(),
                  dur,
                  schedTime,
                  n.velocity
                );
              } catch {}
            }
            sendNoteOn(midiOut, Math.round((n.velocity || 0) * 127), t.channel, schedTime);
          }, time);
          Tone.Transport.schedule((offTime) => {
            if (token !== app.renderToken) return;
            const midiOut = applyTranspose(n.midi);
            sendNoteOff(midiOut, t.channel, offTime);
          }, time + dur + (app.midiIO.tailMs / 1000));
        });
      });
    }

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
            if (token !== app.renderToken) return;
            if (modeSelect?.value !== 'listen') return;
            // In Listen mode, follow song sustain and forward CC
            updateSustainState(channel, val >= 64, getPlaybackTime());
            sendCC(64, val, channel);
          }, (cc.time ?? 0) + now);
        });
      });
    }
  }

  app.tracks.forEach((t, ti) => {
    const synth = app.synths[ti];
    const enabled = isSoloActive ? t.solo : !t.muted;
    if (!enabled) return;
    const filtered = t.notes.filter(n => handFilter(n));
    filtered.forEach((n) => {
      const time = n.time + now;
      Tone.Transport.schedule((schedTime) => {
        if (token !== app.renderToken) return; 
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

        if (modeSelect?.value === 'listen') {
          sendNoteOn(midiOut, Math.round(n.velocity * 127), t.channel, schedTime);

          Tone.Draw.schedule(() => {
            if (token !== app.renderToken) return;
            if (modeSelect?.value !== 'listen') return;
            handleNoteOnVisual(midiOut, t.channel, colorForNoteObj(n));
          }, schedTime);
        }
      }, time);

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

      Tone.Transport.schedule((offTime) => {
        if (token !== app.renderToken) return;
        if (modeSelect?.value === 'listen') {
          const midiOut = applyTranspose(n.midi);
          sendNoteOff(midiOut, t.channel, offTime);
        }
      }, time + Math.max(0.02, Number(n.duration) || 0) + (app.midiIO.tailMs / 1000));

    });
  });

  if (app.midi) {

    app.midi.tracks.forEach((mt, mi) => {
      const channel = (typeof mt.channel === 'number') ? mt.channel : (app.tracks[mi]?.channel ?? 0);
      const cc64Arr = mt.controlChanges && (mt.controlChanges[64] || mt.controlChanges["64"]) || [];
      cc64Arr.forEach(cc => {
        const val = Math.round((cc.value ?? 0) * 127);
        Tone.Transport.schedule(() => {
          if (token !== app.renderToken) return;
          if (modeSelect?.value !== 'listen') return;

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

    if (app.practice.loop.enabled) {
      const loop = app.practice.loop;
      const { start, end, pauseMs } = loop;
      if (end > start && !loop._pending && t >= end) {
        loop._pending = true;
        const wasRunning = (Tone.Transport.state === 'started');
        try { Tone.Transport.pause(); } catch {}
        if (loop._timer) { try { clearTimeout(loop._timer); } catch {} loop._timer = null; }

        if (app.guided.enabled && modeSelect.value === 'practice') {
          try { evaluateLoopPerformance(); } catch {}

          persistGuidedProgress?.();

          ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
          drawKeyboard();
          showAccuracyOverlay();

        } else {

          loop._timer = setTimeout(() => {
            loop._timer = null;
            try { evaluateLoopPerformance(); } catch {}
            app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
            app.practice.matchedIds = new Set();
            clearEarlyLookaheadState();
            try { Tone.Transport.seconds = start; } catch {}

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
  if (wasStarted && !(modeSelect?.value === 'listen' && app.listen?.useAudioScheduler)) {
    Tone.Transport.start();
  }
}

// --- Metronome & Guided Count-in ---
function ensureMetronome() {
  try {
    if (!app.metronome.gain) app.metronome.gain = new Tone.Gain(0.7).toDestination();
    if (!app.metronome.synth) {
      app.metronome.synth = new Tone.MembraneSynth({
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
      }).connect(app.metronome.gain);
    }
  } catch {}
}

function stopPracticeMetronome() {
  try {
    if (app.metronome.repeatId != null) {
      Tone.Transport.clear(app.metronome.repeatId);
      app.metronome.repeatId = null;
    }
  } catch {}
}

function startPracticeMetronome() {
  stopPracticeMetronome();
  if (!app.guided?.enabled) return; // only in Guided Mode
  ensureMetronome();
  let beat = 0;
  const cb = (time) => {
    const accent = (beat % app.metronome.accentPeriod) === 0;
    app.metronome.synth.triggerAttackRelease(accent ? 'C6' : 'C5', '8n', time);
    beat++;
  };
  try { app.metronome.repeatId = Tone.Transport.scheduleRepeat(cb, '4n'); } catch {}
}

function cancelCountIn() {
  const ci = app.metronome.countIn;
  if (!ci) return;
  ci.active = false;
  try { ci.timers.forEach(id => clearTimeout(id)); } catch {}
  ci.timers = [];
  if (countdownEl) countdownEl.classList.add('hidden');
}

function startGuidedCountInThen(startPlayback) {
  const beats = Math.max(1, Math.min(8, app.metronome.countInBeats || 4));
  const bpm = Tone.Transport.bpm.value || 120;
  const beatSec = 60 / bpm;
  const nowA = Tone.now();
  const anchor = nowA + 0.15; // slight lead-in
  cancelCountIn();
  ensureMetronome();
  const ci = app.metronome.countIn;
  ci.active = true;
  ci.timers = [];
  if (countdownEl) {
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = 'Get Ready';
  }
  for (let i = 0; i < beats; i++) {
    const when = anchor + i * beatSec;
    const remaining = (beats - i);
    const accent = (i % app.metronome.accentPeriod) === 0;
    try { app.metronome.synth.triggerAttackRelease(accent ? 'C6' : 'C5', '8n', when); } catch {}
    if (countdownEl) {
      const tid = setTimeout(() => {
        if (!ci.active) return;
        countdownEl.textContent = remaining > 1 ? String(remaining - 1) : 'Go!';
      }, Math.max(0, (when - Tone.now()) * 1000 - 20));
      ci.timers.push(tid);
    }
  }
  const startAt = anchor + beats * beatSec;
  const startTid = setTimeout(() => {
    if (!ci.active) return;
    if (countdownEl) countdownEl.classList.add('hidden');
    startPlayback();
    ci.active = false;
  }, Math.max(0, (startAt - Tone.now()) * 1000 - 10));
  ci.timers.push(startTid);
}

btnPlay.addEventListener("click", async () => {
  await Tone.start(); 
  try {
    Tone.getContext().latencyHint = 'interactive';
    Tone.getContext().lookAhead = Math.max(0.2, Tone.getContext().lookAhead || 0.2);
  } catch {}
  if (!app.midi) return showOverlay("Upload a MIDI file first");
  scheduleIfNeeded();

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
  if (app.guided?.enabled && modeSelect?.value !== 'listen') {
    // Guided mode: BPM-synced count-in, then start playback and metronome
    startGuidedCountInThen(() => {
      try {
        if (app.practice?.loop?.enabled) {
          const { start, end } = app.practice.loop;
          const t = Tone.Transport.seconds || 0;
          if (!(t >= start && t < end)) {
            Tone.Transport.seconds = start;
            updateTimeUI(start);
          }
        } else {
          Tone.Transport.seconds = 0;
          updateTimeUI(0);
        }
      } catch {}
      Tone.Transport.start(`+${START_DELAY}`);
      startPracticeMetronome();
      startAnimation();
      if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';
    });
    return;
  }

  await doCountdownIfNeeded(); // legacy countdown for non-guided practice

  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    startListenScheduler();
  } else {
    Tone.Transport.start(`+${START_DELAY}`);
  }
  startAnimation();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';

});

btnPause.addEventListener("click", () => {
  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    stopListenScheduler(true);
  } else {
    Tone.Transport.pause();
  }
  // Stop any active count-in or metronome when pausing
  try { cancelCountIn(); } catch {}
  try { stopPracticeMetronome(); } catch {}
  stopAnimation({ clear: false });

  panicAll();

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
  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    stopListenScheduler(false);
    app.listen.baseSongTimeSec = 0;
  } else {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
  }
  // Stop any active count-in or metronome on stop
  try { cancelCountIn(); } catch {}
  try { stopPracticeMetronome(); } catch {}
  updateTimeUI(0);
  stopAnimation({ clear: true });
  panicAll();
  clearLoopTimer();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Play';

  app.liveKeys.clear();
  app.keyGlow.clear();
  app.upcomingKeys.clear();
  app._lastLandingFlash.clear();
});

btnRestart.addEventListener("click", () => {
  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    stopListenScheduler(false);
    app.listen.baseSongTimeSec = 0;
  } else {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
  }
  clearLoopTimer();
  panicAll();

  app.liveKeys.clear();
  app.keyGlow.clear();
  app.upcomingKeys.clear();
  app._lastLandingFlash.clear();
  scheduleIfNeeded();

  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    startListenScheduler();
  } else {
    Tone.Transport.start(`+${START_DELAY}`);
  }
  startAnimation();
  if (fsPlayPauseIcon) fsPlayPauseIcon.textContent = 'Pause';
});

progress.addEventListener("input", () => {
  if (!app.midi) return;
  const pct = parseFloat(progress.value) / 100;
  const t = pct * app.duration;

  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    const wasPlaying = app.listen.playing;
    if (wasPlaying) stopListenScheduler(false);
    app.listen.baseSongTimeSec = clamp(t, 0, app.duration || 0);
    reindexListenEvents(app.listen.baseSongTimeSec);
    if (wasPlaying) startListenScheduler();
  } else {
    Tone.Transport.seconds = t;
  }
  updateTimeUI(t);

  panicAll();

  ctx.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  drawNotes(t);
  drawKeyboard();
  clearLoopTimer();
});

speed.addEventListener("input", () => {
  const v = parseFloat(speed.value);

  const newBpm = clamp(app._originalBpm * v, 20, 300);
  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    // Rebase audio scheduler so changes apply immediately without drift
    try {
      if (app.listen.playing) {
        const current = getPlaybackTime();
        const ctx = Tone.getContext();
        app.listen.baseSongTimeSec = current;
        app.listen.startAudioTime = ctx.now();
        reindexListenEvents(app.listen.baseSongTimeSec);
      }
    } catch {}
  } else {
    Tone.Transport.bpm.value = newBpm;
  }
  speedLabel.textContent = `${Math.round(v * 100)}%`;
});

modeSelect.addEventListener("change", () => {
  showOverlay(`${modeSelect.value === "practice" ? "Practice" : "Listen"} Mode`);
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
  // Stop whichever engine is running and rebuild schedule
  if (app.listen?.useAudioScheduler) stopListenScheduler(false);
  rescheduleTransport();
  savePref('mode', modeSelect.value);

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
    Tone.getContext().lookAhead = Math.max(0.2, Tone.getContext().lookAhead || 0.2);
  } catch {}
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause();
    panicAll();
    fsPlayPauseIcon.textContent = 'Play';
  } else {
    scheduleIfNeeded();

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
  const sec = clamp(ms / 1000, -0.25, 0.25); 
  VISUAL_LATENCY = sec;
  savePref('visualLatencyOffset', sec);
  if (visualLatencyLabel) visualLatencyLabel.textContent = `${ms} ms`;
});

const GUIDED_POS_KEY = 'km_guided_panel_pos_v1';

function clampPanelPos(x, y) {
  const pad = 8; 
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

    const rect = guidedPanel.getBoundingClientRect();
    if (guidedPanel.style.left) {
      origX = parseFloat(guidedPanel.style.left) || rect.left;
      origY = parseFloat(guidedPanel.style.top) || rect.top;
    } else {
      origX = rect.left;
      origY = rect.top;
    }

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

    const rect = guidedPanel.getBoundingClientRect();
    saveGuidedPanelPosition(rect.left, rect.top);
  };

  guidedPanelHeader.addEventListener('mousedown', onMouseDown);

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

  const FALL_DURATION = NOTE_FALL_DURATION; 
  const SPAWN_EARLY = 0.03; 

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

    const groupedTime = app.practice.groupTimeById?.get(n.id);
    const start = (groupedTime != null ? groupedTime : n.time); 
    const end = n.time + n.duration;
    if (currentTime >= end) return;

    const startTime = start - FALL_DURATION; 
    if (currentTime < startTime - SPAWN_EARLY) return; 

  const visMidi = applyTranspose(n.midi);
  let x = midiToX(visMidi);
  const baseW = keyWidthFor(visMidi) * 0.9;
  let w = baseW;
      const baseH = Math.max(6, n.duration * (HEIGHT - KEYBOARD_HEIGHT) / FALL_DURATION);
      const r = getRadius();
      const targetY = hitLineY();
      const startY = -40; 

      const tNorm = clamp((currentTime - startTime + VISUAL_LATENCY) / FALL_DURATION, 0, 1);
      const eased = easeInQuad(tNorm); 
      const y = startY + (targetY - startY) * eased;
      let h;
      if (currentTime < start) {
        h = baseH; 
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

      let baseOpacity = parseFloat(noteOpacity?.value || '0.95');
      // Dim inactive hand in Guided/Practice
      if (modeSelect?.value !== 'listen' && app.guided?.enabled && Array.isArray(app.roles) && app.roles.length === app.tracks.length) {
        const role = app.roles[n.trackIndex] || 'background';
        const hand = app.practice?.hand || 'both';
        const active = (hand === 'both') ? (role === 'left' || role === 'right') : (role === hand);
        if (!active && role !== 'background') baseOpacity *= 0.55;
        if (role === 'background') baseOpacity *= 0.45; // always dim background when shown (Listen mode shows normally)
      }
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

function keyLandingFlash(midi, col) {
  const now = performance.now();

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

    if (modeSelect?.value === 'listen') {
      if (app.midiIO.thru) sendNoteOn(tNote, Math.round(velocity * 127), ch);
      return;
    }

    if (isLikelyEcho('on', tNote, ch, now)) {
      return;
    }
    handleNoteOnVisual(tNote, ch, colorForIncoming(note));
    if (app.midiIO.thru) sendNoteOn(tNote, Math.round(velocity * 127), ch);
    checkNoteHit(tNote, nowCal);

    if (modeSelect.value === 'practice' && app.practice.noteWait) {
      const ahead = findGroupsInLookahead(nowCal);
      const tol = app.practice.octaveTol || 0;
      for (const g of ahead) {
        let set = app.practice.earlyHits.get(g.index);
        if (!set) { set = new Set(); app.practice.earlyHits.set(g.index, set); }

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

  ensureSustainSet(channel);
}

function handleNoteOffVisual(midi, channel, color) {
  const sustain = !!app.pedal.sustainDown.get(channel);
  const set = ensureSustainSet(channel);
  if (sustain) {

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
  const tolerance = window; 

  const bucket = Math.round(timeSec * 10) / 10;
  const neighborBuckets = [bucket, Math.round((timeSec + 0.05) * 10) / 10, Math.round((timeSec - 0.05) * 10) / 10];

  let matched = false;
  for (const b of neighborBuckets) {
    const list = app.expectedNotesByTime.get(b);
    if (!list) continue;
    for (const exp of list) {
      // Skip background tracks in accuracy checks unless no L/R roles exist
      try {
        if (Array.isArray(app.roles) && app.roles.length === app.tracks.length) {
          const hasLR = app.roles.some(r => r === 'left' || r === 'right');
          if (hasLR) {
            const role = (app.roles && app.roles[exp.trackIndex]) || 'background';
            if (role === 'background') continue;
            const hand = app.practice?.hand || 'both';
            if (hand !== 'both' && role !== hand) continue;
          }
        }
      } catch {}

      if (!exp.hit && midiMatchesWithOctave(applyTranspose(exp.midi), midi, app.practice.octaveTol || 0) && Math.abs(exp.time - timeSec) <= tolerance) {
        exp.hit = true;
        matched = true;
        app.score += 1;
        scoreEl.textContent = String(app.score);
        flashKey(midi, true);

        startKeyGlow(midi, true, '#22c55e');
        setTimeout(() => startKeyGlow(midi, false, '#22c55e'), 140);

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

function midiMatchesWithOctave(expected, played, octaveTol) {
  if (expected === played) return true;
  const tol = Math.max(0, Math.min(2, Number(octaveTol) || 0));
  const diff = played - expected;
  if ((diff % 12 + 12) % 12 !== 0) return false;
  return Math.abs(diff) <= tol * 12;
}

function matchAndMarkRequired(playedMidi) {
  if (!app.practice.waiting) return false;
  const tol = app.practice.octaveTol || 0;

  for (const req of app.practice.requiredSet) {
    if (app.practice.hitSet.has(req)) continue;
    if (midiMatchesWithOctave(req, playedMidi, tol)) {
      app.practice.hitSet.add(req);

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

  if (modeSelect?.value === 'practice') {

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
  // In Listen mode, do not filter by hand/roles
  if (modeSelect?.value === 'listen') return true;
  // Role-aware filtering for Practice/Guided visuals & accuracy
  if (Array.isArray(app.roles) && app.roles.length === app.tracks.length) {
    const hasLR = app.roles.some(r => r === 'left' || r === 'right');
    if (!hasLR) return true; // if user set no explicit L/R, show all to avoid hiding everything
    const role = app.roles[n.trackIndex] || 'background';
    if (role === 'background') return false; // no visuals/accuracy for background
    const hand = app.practice?.hand || 'both';
    if (hand === 'both') return role === 'left' || role === 'right';
    return role === hand;
  }
  // Fallback by pitch split if roles not available
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

    showOverlay('Tip: Use the Mute/Solo buttons in the Tracks panel to limit to piano parts.', 2000);
  }
  return ok;
}

function closeWalkthroughWelcome() { walkthroughWelcome?.classList.add('hidden'); }
function openWalkthroughWelcome() { walkthroughWelcome?.classList.remove('hidden'); }

function getDriverSteps() {

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

  let driverFactory = null;
  if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') {
    driverFactory = window.driver.js.driver;
  } else if (typeof window.driver === 'function') {
    driverFactory = window.driver; 
  }
  if (!driverFactory) {

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

    try { driverObj.highlight(steps[0]); } catch {}
  }
}

function maybeAutoStartWalkthrough() {
  try {
    const done = localStorage.getItem('km_walkthrough_done') === 'true';
    if (!done) {
      openWalkthroughWelcome();
    }
  } catch {  }
}

walkthroughStart?.addEventListener('click', () => {
  closeWalkthroughWelcome();

  setTimeout(startWalkthrough, 200);
});
walkthroughSkip?.addEventListener('click', () => {
  closeWalkthroughWelcome();
  try { localStorage.setItem('km_walkthrough_done', 'true'); } catch {}
});

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

  app.practice.earlyHits = new Map();
  app.practice.skipWaitFor = new Set();
  app.practice.satisfiedGroups = new Set();
}

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

function findGroupsInLookahead(tCal) {
  const out = [];
  const list = app.practice.groups || [];
  const look = Math.max(0, app.practice.lookaheadSec || 0);
  if (!list.length || look <= 0) return out;

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

  if (app.practice.skipWaitFor.has(index)) {

    if (app.practice.waiting && app.practice.currentIndex === index) {
      app.practice.waiting = false;
      clearTimeout(app.practice._waitTimeout);
    }

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

  if (!isCurrentChordSatisfied()) {
    Tone.Transport.pause();

    if (app.practice.autoContinue) {
      clearTimeout(app.practice._waitTimeout);
      app.practice._waitTimeout = setTimeout(() => {
        if (app.practice.waiting && app.practice.currentIndex === index && !isCurrentChordSatisfied()) {

          for (const n of app.practice.requiredSet) {
            if (!app.practice.hitSet.has(n)) app.practice.stats.misses.push({ midi: n, time: g.time });
          }
          resumeFromGroupWait(Tone.Transport.seconds);
        }
      }, Math.max(600, (app.practice.hitWindowSec || BASE_TOLERANCE) * 2000)); 
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
    const nowAudio = ctx.now(); 
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

  for (let ch = 0; ch < 16; ch++) {
    sendCC(64, 0, ch); 
    const out = app.midiIO.output;
    if (!out) continue;
    try { out.send([0xB0 | ch, 123, 0]); } catch {} 
    try { out.send([0xB0 | ch, 120, 0]); } catch {} 
    try { out.send([0xB0 | ch, 121, 0]); } catch {} 
  }

  try { app.synths.forEach(s => s?.releaseAll?.()); } catch {}
}

function handColorForMidi(midi) {

  return midi < 60 ? '#60a5fa' : '#fb923c';
}

function roleColor(role) {
  if (role === 'left') return '#14b8a6';
  if (role === 'right') return '#fb923c';
  return '#9ca3af';
}

function colorForNoteObj(n) {
  // Role-based consistent colors
  const role = (app.roles && app.roles[n.trackIndex]) || 'background';
  if (role === 'left') return '#14b8a6'; // teal
  if (role === 'right') return '#fb923c'; // orange
  // background
  return '#9ca3af'; // gray
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

// Playback time helper: use AudioContext clock in Listen mode when audio scheduler is active
function _audioPlaybackTime() {
  try {
    const ctx = Tone.getContext();
    const nowA = ctx.now();
    const f = clamp(parseFloat(speed?.value || '1') || 1, 0.5, 1.5);
    return app.listen.baseSongTimeSec + (nowA - app.listen.startAudioTime) * f;
  } catch { return 0; }
}
function getPlaybackTime() {
  try {
    if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler && app.listen.playing) {
      return _audioPlaybackTime();
    }
  } catch {}
  try { return Tone.Transport.seconds || 0; } catch { return 0; }
}

const _smoothClock = { est: 0, lastRaf: 0, lastState: 'stopped', lastTone: 0 };
function getSmoothVisualTime() {
  const tone = getPlaybackTime();
  const now = performance.now();
  const state = Tone.Transport.state;
  // Treat Listen-mode audio scheduler as 'started' for smoothing purposes
  const started = (state === 'started') || (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler && app.listen.playing);
  if (!started) {
    _smoothClock.est = tone;
    _smoothClock.lastRaf = now;
    _smoothClock.lastState = started ? 'started' : state;
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

  const err = clamp(tone - _smoothClock.est, -0.05, 0.05);
  _smoothClock.est += err * 0.2;
  return _smoothClock.est;
}

// ===== Listen-mode audio scheduler (beat-locked) =====
function buildListenEvents(isSoloActive) {
  const events = [];
  const enabledTrack = (ti) => (isSoloActive ? app.tracks[ti]?.solo : !app.tracks[ti]?.muted);
  // Notes and visuals
  app.tracks.forEach((t, ti) => {
    if (!enabledTrack(ti)) return;
    const synth = app.synths[ti];
    const channel = t.channel ?? 0;
    // In Listen mode, do not filter out by hand/roles
    t.notes.forEach((n) => {
      const start = n.time || 0;
      const dur = Math.max(0.02, Number(n.duration) || 0);
      const end = start + dur;
      const midiOut = applyTranspose(n.midi);
      const color = colorForNoteObj(n);
      events.push({ type: 'noteOn', time: start, midi: midiOut, velocity: n.velocity, channel, synth, dur, color });
      events.push({ type: 'visualOff', time: end, midi: midiOut, channel, color });
      const tailSec = (app.midiIO.tailMs || 0) / 1000;
      events.push({ type: 'midiOff', time: end + tailSec, midi: midiOut, channel });
    });
  });
  // Sustain CC64 for ALL tracks/channels
  app.midi.tracks.forEach((mt, mi) => {
    const channel = (typeof mt.channel === 'number') ? mt.channel : (app.tracks[mi]?.channel ?? 0);
    const cc64Arr = mt.controlChanges && (mt.controlChanges[64] || mt.controlChanges["64"]) || [];
    cc64Arr.forEach(cc => {
      events.push({ type: 'cc64', time: (cc.time || 0), value: Math.round((cc.value ?? 0) * 127), channel });
    });
  });
  const prio = { cc64: 0, noteOn: 1, visualOff: 2, midiOff: 3 };
  events.sort((a,b)=> (a.time - b.time) || (prio[a.type]-prio[b.type]) );
  return events;
}

function reindexListenEvents(songTimeSec) {
  const ev = app.listen.events;
  let lo = 0, hi = ev.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ev[mid].time < songTimeSec) lo = mid + 1; else hi = mid;
  }
  app.listen.idx = lo;
}

function startListenScheduler() {
  const ctx = Tone.getContext();
  // Initialize base if needed
  if (!Number.isFinite(app.listen.baseSongTimeSec)) app.listen.baseSongTimeSec = 0;
  app.listen.startAudioTime = ctx.now();
  reindexListenEvents(app.listen.baseSongTimeSec);
  app.listen.playing = true;
  // Ensure we have events
  if (!Array.isArray(app.listen.events) || !app.listen.events.length) {
    app.listen.events = buildListenEvents(app.tracks.some(t=>t.solo));
    reindexListenEvents(app.listen.baseSongTimeSec);
  }
  // Start scheduler loop
  if (app.listen.intervalId) { try { clearInterval(app.listen.intervalId); } catch {} }
  app.listen.intervalId = setInterval(scheduleListenWindow, app.listen.intervalMs);
  // Kick once immediately
  scheduleListenWindow();
}

function stopListenScheduler(pause) {
  if (app.listen.intervalId) { try { clearInterval(app.listen.intervalId); } catch {} app.listen.intervalId = null; }
  if (app.listen.playing) {
    // On pause, rebase song time to current
    if (pause) {
      try { app.listen.baseSongTimeSec = _audioPlaybackTime(); } catch {}
    }
  }
  app.listen.playing = false;
}

function scheduleListenWindow() {
  if (!app.listen.playing) return;
  const ctx = Tone.getContext();
  const nowA = ctx.now();
  const f = clamp(parseFloat(speed?.value || '1') || 1, 0.5, 1.5);
  const windowStartSong = app.listen.baseSongTimeSec + (nowA - app.listen.startAudioTime) * f;
  const windowEndSong = windowStartSong + app.listen.aheadSec * f;

  const loop = app.practice?.loop || { enabled: false };
  const loopStart = loop.enabled ? Math.max(0, loop.start || 0) : 0;
  const loopEnd = loop.enabled ? Math.max(loopStart, loop.end || (app.duration || 0)) : (app.duration || Infinity);

  // If we passed loop end, restart loop immediately
  if (loop.enabled && windowStartSong >= loopEnd) {
    // Flush states, reset base, reindex
    try { panicAll(); } catch {}
    try {
      app.liveKeys.clear();
      app.keyGlow.clear();
      app.upcomingKeys.clear();
      app._lastLandingFlash.clear();
      app.pedal.sustainDown.clear();
      app.pedal.sustained.forEach(set => set.clear());
    } catch {}
    app.listen.baseSongTimeSec = loopStart;
    app.listen.startAudioTime = nowA;
    reindexListenEvents(loopStart);
    return;
  }

  // Schedule events in [windowStartSong, min(windowEndSong, loopEnd))
  const limitSong = Math.min(windowEndSong, loopEnd);
  const events = app.listen.events;
  while (app.listen.idx < events.length) {
    const ev = events[app.listen.idx];
    if (ev.time < windowStartSong - 0.001) { app.listen.idx++; continue; }
    if (ev.time >= limitSong) break;

    const whenSong = ev.time;
    const whenAudio = app.listen.startAudioTime + (whenSong - app.listen.baseSongTimeSec) / f;
    Tone.getContext(); // ensure context
    // Schedule per type
    switch (ev.type) {
      case 'noteOn': {
        if (shouldUseLocalAudio() && ev.synth) {
          try {
            ev.synth.triggerAttackRelease(
              Tone.Frequency(ev.midi, 'midi').toFrequency(),
              Math.max(0.02, ev.dur || 0),
              whenAudio,
              ev.velocity
            );
          } catch {}
        }
        sendNoteOn(ev.midi, Math.round((ev.velocity || 0) * 127), ev.channel, whenAudio);
        Tone.Draw.schedule(() => {
          handleNoteOnVisual(ev.midi, ev.channel, ev.color || getKeyGlowColor(ev.midi));
        }, whenAudio);
        break;
      }
      case 'visualOff': {
        Tone.Draw.schedule(() => {
          handleNoteOffVisual(ev.midi, ev.channel, ev.color || getKeyGlowColor(ev.midi));
        }, whenAudio);
        break;
      }
      case 'midiOff': {
        sendNoteOff(ev.midi, ev.channel, whenAudio);
        break;
      }
      case 'cc64': {
        updateSustainState(ev.channel, (ev.value|0) >= 64, windowStartSong);
        sendCC(64, ev.value|0, ev.channel);
        break;
      }
    }
    app.listen.idx++;
  }
}

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

  if (app.pitch.originalTonicPref != null) return app.pitch.originalTonicPref;
  if (app.pitch.detectedTonic != null) return app.pitch.detectedTonic;
  return 0;
}

function computeTransposeForTarget(targetTonic) {

  const orig = getOriginalTonic();
  let t = ((targetTonic - orig) % 12 + 12) % 12; 

  if (t > 6) t = t - 12; 
  return clamp(t, -12, 12);
}

function syncTransposeUI() {
  if (transposeInput) transposeInput.value = String(app.pitch.transpose);
  if (transposeLabel) transposeLabel.textContent = `${app.pitch.transpose}`;
}

transposeInput?.addEventListener('input', () => {
  const v = parseInt(transposeInput.value || '0', 10) || 0;
  app.pitch.transpose = clamp(v, -12, 12);
  if (transposeLabel) transposeLabel.textContent = `${app.pitch.transpose}`;
  savePref('transpose', app.pitch.transpose);
  persistSongConfig();

  const newKey = ((getOriginalTonic() + app.pitch.transpose) % 12 + 12) % 12;
  app.pitch.keyTonic = newKey;
  if (keyTonicSelect) keyTonicSelect.value = String(newKey);
  savePref('keyTonic', newKey);

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
  updateEffectiveKeyLabel();
  persistSongConfig();
});

inputOffsetMsInput?.addEventListener('input', () => {
  const ms = parseInt(inputOffsetMsInput.value || '0', 10);
  if (inputOffsetLabel) inputOffsetLabel.textContent = `${ms} ms`;
  app.practice.inputOffsetSec = clamp(ms / 1000, -0.4, 0.4);
  savePref('inputOffsetMs', ms);
});

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

  const newT = computeTransposeForTarget(app.pitch.keyTonic);
  if (app.pitch.transpose !== newT) {
    app.pitch.transpose = newT;
    savePref('transpose', app.pitch.transpose);
    syncTransposeUI();

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

    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);
    updateEffectiveKeyLabel();
    persistSongConfig();
  } else if (detectedKeyLabel) {
    detectedKeyLabel.textContent = '—';
  }
});

updateEffectiveKeyLabel();