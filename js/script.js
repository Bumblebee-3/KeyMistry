import * as Tone from "https://esm.sh/tone@14.8.49";
import { Midi } from "https://esm.sh/@tonejs/midi@2.0.28";

if (window.__KM_BLOCKED) { /* blocked */ }

// ─────────────────────────────────────────────
// SOUNDFONT AUDIO ENGINE
// ─────────────────────────────────────────────
const SF = {
  playerLib: null,
  instruments: new Map(),
  _loading: new Map(),
  _libPromise: null,
  _namesCache: new Map(),     // bank -> string[]
  _namesLoading: new Map(),   // bank -> Promise<string[]>
};

const DEFAULT_SF_SOUND_FONT = 'MusyngKite';
const DEFAULT_SF_FORMAT = 'mp3';
const DEFAULT_SF_URL_TEMPLATE = 'https://gleitz.github.io/midi-js-soundfonts/{sf}/{name}-{fmt}.js';
const DEFAULT_SF_NAMES_URL_TEMPLATE = 'https://gleitz.github.io/midi-js-soundfonts/{sf}/names.json';

const KNOWN_SF_BANKS = {
  musyngkite: 'MusyngKite',
  fluidr3_gm: 'FluidR3_GM',
  fatboy: 'FatBoy',
};

function normalizeSoundfontBankName(bank) {
  const raw = String(bank || '').trim();
  if (!raw) return DEFAULT_SF_SOUND_FONT;
  const k = raw.toLowerCase();
  return KNOWN_SF_BANKS[k] || raw;
}

// Full General MIDI program names (0..127) matching the midi-js-soundfonts naming.
// Used for defaults and as a fallback if fetching names.json fails.
const GM_NAMES = [
  'acoustic_grand_piano','bright_acoustic_piano','electric_grand_piano','honkytonk_piano','electric_piano_1','electric_piano_2','harpsichord','clavinet',
  'celesta','glockenspiel','music_box','vibraphone','marimba','xylophone','tubular_bells','dulcimer',
  'drawbar_organ','percussive_organ','rock_organ','church_organ','reed_organ','accordion','harmonica','tango_accordion',
  'acoustic_guitar_nylon','acoustic_guitar_steel','electric_guitar_jazz','electric_guitar_clean','electric_guitar_muted','overdriven_guitar','distortion_guitar','guitar_harmonics',
  'acoustic_bass','electric_bass_finger','electric_bass_pick','fretless_bass','slap_bass_1','slap_bass_2','synth_bass_1','synth_bass_2',
  'violin','viola','cello','contrabass','tremolo_strings','pizzicato_strings','orchestral_harp','timpani',
  'string_ensemble_1','string_ensemble_2','synth_strings_1','synth_strings_2','choir_aahs','voice_oohs','synth_choir','orchestra_hit',
  'trumpet','trombone','tuba','muted_trumpet','french_horn','brass_section','synth_brass_1','synth_brass_2',
  'soprano_sax','alto_sax','tenor_sax','baritone_sax','oboe','english_horn','bassoon','clarinet',
  'piccolo','flute','recorder','pan_flute','blown_bottle','shakuhachi','whistle','ocarina',
  'lead_1_square','lead_2_sawtooth','lead_3_calliope','lead_4_chiff','lead_5_charang','lead_6_voice','lead_7_fifths','lead_8_bass__lead',
  'pad_1_new_age','pad_2_warm','pad_3_polysynth','pad_4_choir','pad_5_bowed','pad_6_metallic','pad_7_halo','pad_8_sweep',
  'fx_1_rain','fx_2_soundtrack','fx_3_crystal','fx_4_atmosphere','fx_5_brightness','fx_6_goblins','fx_7_echoes','fx_8_scifi',
  'sitar','banjo','shamisen','koto','kalimba','bagpipe','fiddle','shanai',
  'tinkle_bell','agogo','steel_drums','woodblock','taiko_drum','melodic_tom','synth_drum','reverse_cymbal',
  'guitar_fret_noise','breath_noise','seashore','bird_tweet','telephone_ring','helicopter','applause','gunshot',
];

function gmInstrumentName(program) {
  if (program == null || !Number.isFinite(+program)) return 'acoustic_grand_piano';
  const p = Math.max(0, Math.min(127, Math.round(+program)));
  return GM_NAMES[p] || 'acoustic_grand_piano';
}

function buildSFNamesUrl(sfBank, template = DEFAULT_SF_NAMES_URL_TEMPLATE) {
  const bank = normalizeSoundfontBankName(sfBank);
  const tpl = String(template || DEFAULT_SF_NAMES_URL_TEMPLATE);
  if (!tpl.includes('{sf}')) return `https://gleitz.github.io/midi-js-soundfonts/${encodeURIComponent(bank)}/names.json`;
  return tpl.replaceAll('{sf}', bank);
}

async function getSoundfontNamesForBank(sfBank) {
  const bank = normalizeSoundfontBankName(sfBank);
  if (SF._namesCache.has(bank)) return SF._namesCache.get(bank);
  if (SF._namesLoading.has(bank)) return SF._namesLoading.get(bank);

  const p = (async () => {
    const url = buildSFNamesUrl(bank);
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`names.json fetch failed: ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : [];
      const names = arr
        .map((n) => String(n || '').trim())
        .filter(Boolean)
        .map((n) => normalizeSFInstrumentName(n, ''))
        .filter(Boolean);
      const unique = [...new Set(names)];
      if (unique.length) {
        SF._namesCache.set(bank, unique);
        return unique;
      }
    } catch (e) {
      // fall through to GM_NAMES
      if (console.debug) console.debug('[SF] names.json load failed', bank, e);
    } finally {
      SF._namesLoading.delete(bank);
    }
    // Fallback: show full GM list so the UI still exposes all instruments.
    const fallback = GM_NAMES.slice();
    SF._namesCache.set(bank, fallback);
    return fallback;
  })();

  SF._namesLoading.set(bank, p);
  return p;
}

function normalizeSFInstrumentName(name, fallback = 'acoustic_grand_piano') {
  const raw = String(name || '').trim().toLowerCase();
  if (!raw) return fallback;
  return raw.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function getSFConfig() {
  const cfg = app?.sfConfig || {};
  const soundfont = normalizeSoundfontBankName(String(cfg.soundfont || DEFAULT_SF_SOUND_FONT));
  const format = (String(cfg.format || DEFAULT_SF_FORMAT).trim().toLowerCase() === 'ogg') ? 'ogg' : 'mp3';
  const urlTemplate = String(cfg.urlTemplate || DEFAULT_SF_URL_TEMPLATE).trim() || DEFAULT_SF_URL_TEMPLATE;
  return { soundfont, format, urlTemplate };
}

function buildSFUrl(name, sf, fmt, template) {
  const tpl = String(template || DEFAULT_SF_URL_TEMPLATE);
  if (!tpl.includes('{name}')) return `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-${fmt}.js`;
  return tpl.replaceAll('{name}', name).replaceAll('{sf}', sf).replaceAll('{fmt}', fmt);
}

function clearSFTrackCache(trackIndex) {
  SF.instruments.delete(trackIndex);
  for (const key of SF._loading.keys()) {
    if (key.startsWith(`${trackIndex}:`)) SF._loading.delete(key);
  }
}

function loadSFLib() {
  if (SF._libPromise) return SF._libPromise;
  SF._libPromise = new Promise((resolve, reject) => {
    if (window.Soundfont) { SF.playerLib = window.Soundfont; resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js';
    s.onload = () => { SF.playerLib = window.Soundfont; resolve(); };
    s.onerror = () => reject(new Error('soundfont-player failed to load'));
    document.head.appendChild(s);
  });
  return SF._libPromise;
}

async function getSFAudioCtx() {
  const rawCtx = Tone.getContext().rawContext;
  if (rawCtx.state === 'suspended') { try { await rawCtx.resume(); } catch {} }
  return rawCtx;
}

async function getSFInstrument(trackIndex, instrumentName) {
  const cfg = getSFConfig();
  const resolvedName = normalizeSFInstrumentName(instrumentName);
  const cacheKey = `${trackIndex}:${resolvedName}:${cfg.soundfont}:${cfg.format}`;
  const cached = SF.instruments.get(trackIndex);
  if (cached && cached._sfCacheKey === cacheKey) return cached;
  if (SF._loading.has(cacheKey)) return SF._loading.get(cacheKey);
  const p = (async () => {
    await loadSFLib();
    const ctx = await getSFAudioCtx();
    const inst = await SF.playerLib.instrument(ctx, resolvedName, {
      soundfont: cfg.soundfont,
      format: cfg.format,
      nameToUrl: (name, sf, fmt) => buildSFUrl(name, sf, fmt, cfg.urlTemplate),
    });
    inst._sfName = resolvedName;
    inst._sfCacheKey = cacheKey;
    SF.instruments.set(trackIndex, inst);
    SF._loading.delete(cacheKey);
    return inst;
  })();
  SF._loading.set(cacheKey, p);
  return p;
}

async function sfPlay(trackIndex, instrumentName, midiNote, velocity, whenSec, duration) {
  try {
    const inst = await getSFInstrument(trackIndex, instrumentName);
    return inst.play(midiNote, whenSec, { gain: Math.max(0, Math.min(1, velocity)), duration });
  } catch (e) { return null; }
}

function disposeSFInstruments() { SF.instruments.clear(); SF._loading.clear(); }
function warmSFLib() { loadSFLib().catch(() => {}); }

// ─────────────────────────────────────────────
// CONSTANTS & DOM REFS
// ─────────────────────────────────────────────
const LOG_MIDI = false;
savePref('grid', false);

const fileInput = document.getElementById("fileInput");
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingHeadline = document.getElementById('loadingHeadline');
const loadingStatus = document.getElementById('loadingStatus');
const btnLoadPrevious = document.getElementById("btnLoadPrevious");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const btnStop = document.getElementById("btnStop");
const openRolesBtn = document.getElementById('openRoles');
const openInstrumentsBtn = document.getElementById('openInstruments');
const instrumentsModal = document.getElementById('instrumentsModal');
const instrumentsList = document.getElementById('instrumentsList');
const instrumentsClose = document.getElementById('instrumentsClose');
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
const sfBankInput = document.getElementById('sfBankInput');
const sfFormatSelect = document.getElementById('sfFormatSelect');
const sfUrlTemplateInput = document.getElementById('sfUrlTemplateInput');
const sfApplyBtn = document.getElementById('sfApplyBtn');
const instrumentSelectorModal = document.getElementById('instrumentSelectorModal');
const instrumentSearch = document.getElementById('instrumentSearch');
const instrumentList = document.getElementById('instrumentList');
const instrumentModalClose = document.getElementById('instrumentModalClose');
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
const effectiveKeyLabel = document.getElementById('effectiveKeyLabel');
const visualLatencyInput = document.getElementById('visualLatencyOffset');
const visualLatencyLabel = document.getElementById('visualLatencyLabel');
const multiTrackModal = document.getElementById('multiTrackModal');
const multiTrackText = document.getElementById('multiTrackText');
const multiTrackTitle = document.getElementById('multiTrackTitle');
const multiTrackCancel = document.getElementById('multiTrackCancel');
const multiTrackContinue = document.getElementById('multiTrackContinue');
const walkthroughWelcome = document.getElementById('walkthroughWelcome');
const walkthroughStart = document.getElementById('walkthroughStart');
const walkthroughSkip = document.getElementById('walkthroughSkip');
const helpWalkthroughBtn = document.getElementById('helpWalkthroughBtn');
const btnPianoMode = document.getElementById('btnPianoMode');
const pianoFs = document.getElementById('pianoFs');
const fsExit = document.getElementById('fsExit');
const fsPlayPause = document.getElementById('fsPlayPause');
const fsPlayPauseIcon = document.getElementById('fsPlayPauseIcon');
const pianoFsCanvasWrap = document.getElementById('pianoFsCanvasWrap');

let VISUAL_LATENCY = 0;
let canvasOriginalParent = null;

// ─────────────────────────────────────────────
// CANVAS — lazy-init, offscreen keyboard cache
// ─────────────────────────────────────────────
let canvas = null;
let ctx = null;
// Offscreen canvas for the static keyboard — re-drawn only when dimensions or key state changes
let kbOffscreen = null;
let kbOffCtx = null;
let kbDirty = true;           // set true whenever key state / size changes
let kbLastWidth = 0;
let kbLastHeight = 0;

function getCanvasContext() {
  if (!canvas) canvas = document.getElementById("pianoRoll");
  if (!ctx && canvas) ctx = canvas.getContext("2d");
  return ctx;
}

const START_DELAY = 0.07;
const FIRST_MIDI = 21;
const LAST_MIDI  = 108;
let WIDTH  = 0;
let HEIGHT = 0;
const KEYBOARD_HEIGHT = 90;
let NOTE_FALL_DURATION = 4;

const LANDING_FLASH_ENABLED = false;
const TRAILS_ENABLED        = false;
const SHADOWS_ENABLED       = false;

const TRACK_COLORS = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#fb7185","#4ade80","#22d3ee"];

// ─────────────────────────────────────────────
// PRE-COMPUTED KEYBOARD GEOMETRY
// Built once per resize; eliminates per-frame loops in midiToX / keyWidthFor
// ─────────────────────────────────────────────
const GEO = {
  whiteKeys: [],       // ordered array of white midi numbers
  whiteW: 0,           // pixel width of one white key
  midiToXArr: new Float32Array(128),  // x position for each midi note
  midiToWArr: new Float32Array(128),  // width for each midi note
  isBlack: new Uint8Array(128),       // 1 if black key
};

const BLACK_PCS = new Set([1,3,6,8,10]);
function isBlackKey(midi) { return BLACK_PCS.has(midi % 12); }

function rebuildGeometry() {
  GEO.whiteKeys = [];
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!BLACK_PCS.has(m % 12)) GEO.whiteKeys.push(m);
    GEO.isBlack[m] = BLACK_PCS.has(m % 12) ? 1 : 0;
  }
  const whiteW = WIDTH / GEO.whiteKeys.length;
  GEO.whiteW = whiteW;

  // Compute white key x positions
  const whiteX = new Float32Array(128);
  let wi = 0;
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!GEO.isBlack[m]) { whiteX[m] = wi * whiteW; wi++; }
  }
  // Compute all x/w
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (GEO.isBlack[m]) {
      // Black key: centered between the two adjacent white keys
      GEO.midiToXArr[m] = whiteX[m - 1] + whiteW - whiteW * 0.3;
      GEO.midiToWArr[m] = whiteW * 0.6;
    } else {
      GEO.midiToXArr[m] = whiteX[m];
      GEO.midiToWArr[m] = whiteW;
    }
  }
  kbDirty = true;
}

// Inline accessors — no function-call overhead in hot draw loop
function midiX(midi)  { return GEO.midiToXArr[midi]; }
function midiW(midi)  { return GEO.midiToWArr[midi]; }

// ─────────────────────────────────────────────
// COLOR CACHE — pre-build rgba strings once
// ─────────────────────────────────────────────
// Map: "RRGGBB_alpha100" -> "rgba(r,g,b,a)"
const _rgbaCache = new Map();
function hexToRgba(hex, a) {
  // Round alpha to 2 decimal places to limit cache size
  const aR = Math.round(a * 100);
  const key = hex + aR;
  let v = _rgbaCache.get(key);
  if (v) return v;
  const c = hex.replace('#','');
  const n = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
  v = `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${(aR/100).toFixed(2)})`;
  _rgbaCache.set(key, v);
  return v;
}

const _shadeCache = new Map();
function shadeColor(hex, pct) {
  const key = hex + pct;
  let v = _shadeCache.get(key);
  if (v) return v;
  const c = hex.replace('#','');
  const n = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
  const f = (100 + pct) / 100;
  const r = Math.min(255, Math.max(0, Math.round(((n>>16)&255)*f)));
  const g = Math.min(255, Math.max(0, Math.round(((n>>8)&255)*f)));
  const b = Math.min(255, Math.max(0, Math.round((n&255)*f)));
  v = '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  _shadeCache.set(key, v);
  return v;
}

// Pre-bake note colors per role (used in the draw loop, avoid Map lookups per note)
const ROLE_COLOR = { left: '#14b8a6', right: '#fb923c', background: '#9ca3af' };
// Pre-bake rgba strings at common opacities used in drawNotes
// These are computed lazily on first use and then frozen into typed look-up arrays
const _prebakedFill = new Map(); // "color_opacity100" -> rgba string

// ─────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────
const app = {
  guided: {
    enabled: false, hasSeparateHands: false, sections: [], stages: [],
    currentIndex: 0, stage: 'left', progressKey: null, sectionLenSec: 20,
    inputLocked: false, overlayUnlockAt: 0,
  },
  midi: undefined, duration: 0, tracks: [], scheduled: false, synths: [],
  sfInstrumentNames: [],
  sfConfig: { soundfont: DEFAULT_SF_SOUND_FONT, format: DEFAULT_SF_FORMAT, urlTemplate: DEFAULT_SF_URL_TEMPLATE },
  score: 0, isLoading: true,
  expectedNotesByTime: new Map(),
  liveKeys: new Set(), keyGlow: new Map(), upcomingKeys: new Set(), _lastLandingFlash: new Map(),
  midiTrackToAppTrackIndex: new Map(),
  metronome: {
    enabled: true, countInBeats: 4, accentPeriod: 4,
    gain: null, synth: null, repeatId: null,
    countIn: { active: false, timers: [] },
  },
  renderToken: 0,
  pitch: { transpose: 0, keyTonic: 0, keyScale: 'major', detectedTonic: null, detectedScale: null, originalTonicPref: null, originalScalePref: null },
  practice: {
    noteWait: false, hand: 'both',
    loop: { enabled: false, start: 0, end: 0, pauseMs: 300, _pending: false, _timer: null },
    waiting: false, nextExpected: null, groups: [], currentIndex: 0,
    requiredSet: new Set(), hitSet: new Set(), lastWaitTime: -1,
    stats: { total: 0, correct: 0, misses: [], timings: [] },
    groupTimeById: new Map(), inputOffsetSec: 0, hitWindowSec: 0.30, chordWindowSec: 0.06,
    _waitTimeout: null, autoContinue: false, octaveTol: 1, lookaheadSec: 2.5,
    earlyHits: new Map(), skipWaitFor: new Set(), satisfiedGroups: new Set(),
    lastLoopAccPercent: 0, matchedIds: new Set(),
  },
  midiIO: {
    access: null, inputs: new Map(), outputs: new Map(),
    inId: null, outId: null, input: null, output: null, thru: false, tailMs: 60,
    _echo: new Map(), echoWindowSec: 0.3,
  },
  pedal: { sustainDown: new Map(), sustained: new Map() },
  listen: {
    useAudioScheduler: true, playing: false, events: [], idx: 0,
    startAudioTime: 0, baseSongTimeSec: 0, intervalId: null, intervalMs: 50, aheadSec: 0.25,
  },
  roles: [],
};
app._originalBpm = 120;

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const formatTime = (sec) => {
  if (!isFinite(sec)) return "00:00";
  return `${Math.floor(sec/60).toString().padStart(2,'0')}:${Math.floor(sec%60).toString().padStart(2,'0')}`;
};

// ─────────────────────────────────────────────
// PREF HELPERS
// ─────────────────────────────────────────────
const PREF_PREFIX = 'km_pref_';
function savePref(key, value) { try { localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value)); } catch {} }
let __LP_LOAD_ERRORS = 0;
function loadPref(key, def) {
  try { const s = localStorage.getItem(PREF_PREFIX + key); return s == null ? def : JSON.parse(s); }
  catch { __LP_LOAD_ERRORS++; return def; }
}

// ─────────────────────────────────────────────
// RESIZE & GEOMETRY
// ─────────────────────────────────────────────
function resizeCanvas() {
  if (!canvas) canvas = document.getElementById("pianoRoll");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  WIDTH  = Math.floor(rect.width);
  HEIGHT = Math.floor(rect.height);
  canvas.width  = WIDTH;
  canvas.height = HEIGHT;
  rebuildGeometry();   // recompute key positions
  kbDirty = true;
  const t = getPlaybackTime() || 0;
  drawNotes(t);
  drawKeyboard();
}

function hitLineY() { return HEIGHT - KEYBOARD_HEIGHT - 6; }
window.addEventListener("resize", resizeCanvas);

// ─────────────────────────────────────────────
// OVERLAY
// ─────────────────────────────────────────────
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
    if (name) { btnLoadPrevious.textContent = name; btnLoadPrevious.title = `Load previous: ${name}`; }
  } catch {}
}

// ─────────────────────────────────────────────
// SANITIZE TIME-SIG META
// ─────────────────────────────────────────────
function sanitizeTimeSignatureMeta(u8) {
  const out = new Uint8Array(u8);
  const n = out.length;
  for (let i = 0; i < n - 3; i++) {
    if (out[i] === 0xFF && out[i+1] === 0x58) {
      let j = i+2, len = 0;
      while (j < n) { const b = out[j++]; len = (len<<7)|(b&0x7F); if (!(b&0x80)) break; }
      if (len !== 4) out[i+1] = 0x7F;
      i = j + len - 1;
    }
  }
  return out;
}

// ─────────────────────────────────────────────
// GUIDED PANEL DOM REFS
// ─────────────────────────────────────────────
const guidedToggleBtn    = document.getElementById('guidedToggle');
const guidedPanel        = document.getElementById('guidedPanel');
const guidedPanelHeader  = document.getElementById('guidedPanelHeader');
const guidedSectionLabel = document.getElementById('guidedSectionLabel');
const guidedStageLabel   = document.getElementById('guidedStageLabel');
const guidedAccBar       = document.getElementById('guidedAccBar');
const guidedAccLabel     = document.getElementById('guidedAccLabel');
const guidedPrevSecBtn   = document.getElementById('guidedPrevSec');
const guidedNextSecBtn   = document.getElementById('guidedNextSec');
const guidedUnderstoodBtn  = document.getElementById('guidedUnderstoodBtn');
const guidedNextStageBtn   = document.getElementById('guidedNextStageBtn');
const guidedHint           = document.getElementById('guidedHint');
const guidedPrompt         = document.getElementById('guidedPrompt');
const guidedPromptMsg      = document.getElementById('guidedPromptMsg');
const guidedPromptContinue = document.getElementById('guidedPromptContinue');
const guidedDecision       = document.getElementById('guidedDecision');
const guidedPracticeAgainBtn  = document.getElementById('guidedPracticeAgainBtn');
const guidedPhaseContinueBtn  = document.getElementById('guidedPhaseContinueBtn');
const guidedStepLeft   = document.getElementById('guidedStepLeft');
const guidedStepRight  = document.getElementById('guidedStepRight');
const guidedStepBoth   = document.getElementById('guidedStepBoth');
const guidedScopeEl    = document.getElementById('guidedScope');
const guidedOverallBar = document.getElementById('guidedOverallBar');
const guidedOverallLabel = document.getElementById('guidedOverallLabel');
const accuracyOverlay  = document.getElementById('accuracyOverlay');
const accOvPercentEl   = document.getElementById('accOvPercent');
const accOvTimingEl    = document.getElementById('accOvTiming');
const accOvReplayBtn   = document.getElementById('accReplayBtn');
const accOvContinueBtn = document.getElementById('accContinueBtn');
const accOvUnlockHint  = document.getElementById('accOvUnlockHint');

// ─────────────────────────────────────────────
// APPLY PREFS
// ─────────────────────────────────────────────
function applyPrefsToUI() {
  const mode = loadPref('mode', null);
  if (mode && modeSelect) modeSelect.value = mode;
  const noteWait = loadPref('noteWait', null);
  if (noteWait != null && noteWaitToggle) noteWaitToggle.checked = !!noteWait;
  const tempo = loadPref('tempoFactor', null);
  if (tempo != null && speed) { speed.value = String(tempo); speedLabel.textContent = `${Math.round(tempo*100)}%`; }
  const radius = loadPref('radius', null);
  if (radius && radiusSelect) radiusSelect.value = radius;
  const fall = loadPref('fallTime', null);
  if (fall != null && fallTime) {
    fallTime.value = String(fall); NOTE_FALL_DURATION = parseFloat(fall);
    if (fallTimeLabel) fallTimeLabel.textContent = `${NOTE_FALL_DURATION.toFixed(1)}s`;
  }
  const trails = loadPref('trails', null); if (trails != null && trailToggle) trailToggle.checked = !!trails;
  const bounce = loadPref('bounce', null); if (bounce != null && bounceToggle) bounceToggle.checked = !!bounce;
  const enh = loadPref('enhanced', null); if (enh != null && enhancedToggle) enhancedToggle.checked = !!enh;
  const hitLine = loadPref('hitLine', null);
  if (hitLine != null && hitLineToggle) hitLineToggle.checked = !!hitLine;
  else if (hitLineToggle) hitLineToggle.checked = true;
  const op = loadPref('noteOpacity', null);
  if (op != null && noteOpacity) { noteOpacity.value = String(op); if (noteOpacityLabel) noteOpacityLabel.textContent = `${Math.round(op*100)}%`; }
  const glow = loadPref('glowIntensity', null);
  if (glow != null && glowIntensity) { glowIntensity.value = String(glow); if (glowIntensityLabel) glowIntensityLabel.textContent = `${parseFloat(glow).toFixed(1)}x`; }
  const inOff = loadPref('inputOffsetMs', 0);
  app.practice.inputOffsetSec = clamp((parseInt(inOff,10)||0)/1000, -0.4, 0.4);
  if (inputOffsetMsInput) inputOffsetMsInput.value = String(parseInt(inOff,10)||0);
  if (inputOffsetLabel) inputOffsetLabel.textContent = `${parseInt(inOff,10)||0} ms`;
  const oTol = clamp(parseInt(loadPref('octaveTol',1),10)||0, 0, 2);
  app.practice.octaveTol = oTol;
  if (octaveTolInput) octaveTolInput.value = String(oTol);
  if (octaveTolLabel) octaveTolLabel.textContent = `±${oTol} oct`;
  const tr = loadPref('transpose', null);
  if (tr != null && transposeInput) { transposeInput.value = String(tr); if (transposeLabel) transposeLabel.textContent = `${tr}`; app.pitch.transpose = parseInt(tr,10)||0; }
  const kt = loadPref('keyTonic', null);
  if (kt != null && keyTonicSelect) { keyTonicSelect.value = String(kt); app.pitch.keyTonic = parseInt(kt,10)||0; }
  const ks = loadPref('keyScale', null);
  if (ks && keyScaleSelect) { keyScaleSelect.value = ks; app.pitch.keyScale = ks; }
  const ok = loadPref('originalTonic', null); if (ok != null) app.pitch.originalTonicPref = parseInt(ok,10)||0;
  const os = loadPref('originalScale', null); if (os) app.pitch.originalScalePref = os;
  const vlat = loadPref('visualLatencyOffset', null);
  if (vlat != null) VISUAL_LATENCY = Number(vlat)||0;
  if (visualLatencyInput) { visualLatencyInput.value = String((VISUAL_LATENCY*1000)|0); if (visualLatencyLabel) visualLatencyLabel.textContent = `${(VISUAL_LATENCY*1000)|0} ms`; }
  const hand = loadPref('hand', null); if (hand) setHand(hand);
  const loopEn = loadPref('loopEnabled', null); if (loopEn != null && loopToggle) loopToggle.checked = !!loopEn;
  const loopStart = loadPref('loopStart', null); if (loopStart != null && loopStartInput) loopStartInput.value = String(loopStart);
  const loopEnd   = loadPref('loopEnd',   null); if (loopEnd   != null && loopEndInput)   loopEndInput.value   = String(loopEnd);
  if (loopToggle) app.practice.loop.enabled = !!loopToggle.checked;
  if (loopStartInput) app.practice.loop.start = Math.max(0, parseFloat(loopStartInput.value||'0')||0);
  if (loopEndInput)   app.practice.loop.end   = Math.max(0, parseFloat(loopEndInput.value||'0')||0);
  const thru = loadPref('midiThru', null); if (thru != null && midiThruToggle) midiThruToggle.checked = !!thru;
  const tail = loadPref('tailMs', null);
  if (tail != null && tailMsInput) { tailMsInput.value = String(tail); if (tailMsLabel) tailMsLabel.textContent = `${tail}ms`; app.midiIO.tailMs = parseInt(tail,10); }
  app.midiIO.inId  = loadPref('midiInId',  app.midiIO.inId);
  app.midiIO.outId = loadPref('midiOutId', app.midiIO.outId);
  const sfBank = loadPref('sfSoundfont', DEFAULT_SF_SOUND_FONT);
  const sfFmt  = loadPref('sfFormat',    DEFAULT_SF_FORMAT);
  const sfTpl  = loadPref('sfUrlTemplate', DEFAULT_SF_URL_TEMPLATE);
  app.sfConfig.soundfont   = normalizeSoundfontBankName(sfBank);
  app.sfConfig.format      = String(sfFmt||DEFAULT_SF_FORMAT).trim().toLowerCase()==='ogg'?'ogg':'mp3';
  app.sfConfig.urlTemplate = String(sfTpl||DEFAULT_SF_URL_TEMPLATE).trim()||DEFAULT_SF_URL_TEMPLATE;
  if (sfBankInput)       sfBankInput.value       = app.sfConfig.soundfont;
  if (sfFormatSelect)    sfFormatSelect.value     = app.sfConfig.format;
  if (sfUrlTemplateInput) sfUrlTemplateInput.value = app.sfConfig.urlTemplate;
  app.guided.sectionLenSec = 20;
}

// ─────────────────────────────────────────────
// FILE LOAD
// ─────────────────────────────────────────────
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    let midi;
    try { midi = new Midi(arrayBuffer); }
    catch { const safe = sanitizeTimeSignatureMeta(new Uint8Array(arrayBuffer)); midi = new Midi(safe.buffer); }
    if (!(await shouldProceedWithMultiTrack(midi))) { showOverlay("Loading cancelled."); return; }
    try { localStorage.setItem('km_last_midi_name', file.name); updatePreviousButtonLabel(); } catch {}
    initFromMidi(midi);
    showOverlay(`Loaded: ${file.name}`);
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const b64 = btoa(String.fromCharCode(...bytes));
      localStorage.setItem('km_last_midi_b64', b64);
    } catch {}
  } catch (err) { console.error(err); showOverlay("Failed to load MIDI"); }
});

btnLoadPrevious?.addEventListener('click', async () => {
  try {
    const b64 = localStorage.getItem('km_last_midi_b64') || localStorage.getItem('lp_last_midi_b64');
    if (!b64) return showOverlay('No previous MIDI saved');
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    let midi;
    try { midi = new Midi(bytes.buffer); }
    catch { const safe = sanitizeTimeSignatureMeta(bytes); midi = new Midi(safe.buffer); }
    if (!(await shouldProceedWithMultiTrack(midi))) { showOverlay("Loading cancelled."); return; }
    initFromMidi(midi);
    const name = localStorage.getItem('km_last_midi_name') || localStorage.getItem('lp_last_midi_name') || 'Previous MIDI';
    showOverlay(`Loaded: ${name}`);
    updatePreviousButtonLabel();
  } catch (e) { console.error(e); showOverlay('Failed to load previous MIDI'); }
});

// ─────────────────────────────────────────────
// INIT FROM MIDI
// ─────────────────────────────────────────────
function initFromMidi(midi) {
  try { Tone.Transport.stop(); Tone.Transport.cancel(); } catch {}
  try { stopAnimation({ clear: true }); } catch {}
  panicAll();
  clearLoopTimer();
  disposeSFInstruments();
  try {
    app.liveKeys.clear(); app.keyGlow.clear(); app.upcomingKeys.clear();
    app._lastLandingFlash.clear(); app.pedal.sustainDown.clear();
    app.pedal.sustained.forEach(s => s.clear());
  } catch {}
  kbDirty = true;
  try { const c = getCanvasContext(); if (c) c.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT); drawKeyboard(); } catch {}

  app.renderToken = (app.renderToken || 0) + 1;
  app.midi = midi; app.tracks = []; app.synths = []; app.sfInstrumentNames = [];
  app.midiTrackToAppTrackIndex = new Map();
  app.scheduled = false; app.expectedNotesByTime.clear();
  app.score = 0; app.liveKeys.clear(); app.keyGlow.clear();
  scoreEl.textContent = '0';
  app.practice.stats = { total: 0, correct: 0, misses: [], timings: [] };
  app.pitch.transpose = 0; savePref('transpose', 0);
  if (transposeInput) transposeInput.value = '0';
  if (transposeLabel) transposeLabel.textContent = '0';

  let duration = 0;
  midi.tracks.forEach(t => t.notes.forEach(n => { duration = Math.max(duration, n.time + n.duration); }));
  app.duration = duration;

  try {
    const bpm = midi?.header?.tempos?.[0]?.bpm;
    app._originalBpm = (bpm && isFinite(bpm)) ? bpm : 120;
    Tone.Transport.bpm.value = app._originalBpm;
  } catch {}
  if (speed) { speed.value = '1'; speedLabel.textContent = '100%'; }

  let appIdx = 0;
  app.tracks = midi.tracks.reduce((acc, t, midiIdx) => {
    if (!Array.isArray(t.notes) || !t.notes.length) return acc;
    app.midiTrackToAppTrackIndex.set(midiIdx, appIdx);
    const channel = typeof t.channel === 'number' ? t.channel : 0;
    acc.push({
      name: t.name || `Track ${appIdx+1}`,
      color: TRACK_COLORS[appIdx % TRACK_COLORS.length],
      muted: false, solo: false, channel,
      notes: t.notes.map((n, i) => ({
        midi: n.midi, time: n.time, duration: n.duration, velocity: n.velocity,
        trackIndex: appIdx, channel, id: `t${appIdx}n${i}`,
      })),
      program: typeof t.instrument?.number === 'number' ? t.instrument.number : 0,
    });
    appIdx++;
    return acc;
  }, []);

  app.sfInstrumentNames = app.tracks.map(t => gmInstrumentName(t.program));
  app.sfInstrumentNames.forEach((_, i) => getOrLoadSFInstrumentForTrack(i).catch(() => {}));

  // Build note time index
  app.expectedNotesByTime.clear();
  for (const track of app.tracks) {
    for (const n of track.notes) {
      const bucket = Math.round(n.time * 10) / 10;
      const list = app.expectedNotesByTime.get(bucket);
      const entry = { midi: n.midi, time: n.time, id: n.id, hit: false, trackIndex: n.trackIndex };
      if (list) list.push(entry);
      else app.expectedNotesByTime.set(bucket, [entry]);
    }
  }

  loadRoles(); saveRoles();
  try {
    app.guided.hasSeparateHands = app.roles.includes('left') && app.roles.includes('right');
    app.guided.stage = app.guided.hasSeparateHands ? 'left' : 'both';
  } catch {}

  buildTrackUI();
  try { renderRolesModal(); rolesModal?.classList.remove('hidden'); ensureRolesScrollable(); rolesList?.focus(); } catch {}
  rescheduleTransport(); updateTimeUI(0); buildPracticeGroups();

  try {
    const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
    const base = String(name).replace(/\.[^/.]+$/, '').trim().toLowerCase();
    app.guided.progressKey = `km_progress_${base}`;
    app.songCfgKey = `km_songcfg_${base}`;
  } catch { app.guided.progressKey = null; }

  const hasTwoOrMore = app.tracks.length > 1;
  app.guided.hasSeparateHands = hasTwoOrMore;
  const secLen = 20;
  app.guided.sectionLenSec = secLen;
  const count = Math.max(1, Math.ceil(app.duration / secLen));
  app.guided.sections = Array.from({length: count}, (_, i) => ({
    label: `Section ${i+1}`,
    start: i * secLen,
    end: Math.min(app.duration, (i+1) * secLen),
  }));
  app.guided.stages = Array.from({length: count}, (_, i) => ({
    index: i+1,
    mastery: { left: !hasTwoOrMore, right: !hasTwoOrMore, both: false },
    accByStage: { left: 0, right: 0, both: 0 },
    lastTempo: 1,
  }));
  app.guided.currentIndex = 0;
  app.guided.stage = hasTwoOrMore ? 'left' : 'both';
  restoreGuidedProgress(); updateGuidedUI();

  if (app.practice.loop.enabled && !(app.practice.loop.end > app.practice.loop.start)) {
    app.practice.loop.start = 0; app.practice.loop.end = app.duration;
    if (loopStartInput) loopStartInput.value = '0';
    if (loopEndInput)   loopEndInput.value = String(Math.round(app.duration * 10) / 10);
  }

  const r = detectKeyFromMidi();
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if (r) {
    app.pitch.detectedTonic = r.tonic; app.pitch.detectedScale = r.scale;
    if (detectedKeyLabel) detectedKeyLabel.textContent = `${NOTE_NAMES[r.tonic]} ${r.scale}`;
    app.pitch.keyTonic = r.tonic; app.pitch.keyScale = r.scale;
    if (keyTonicSelect) keyTonicSelect.value = String(r.tonic);
    if (keyScaleSelect) keyScaleSelect.value = r.scale;
    savePref('keyTonic', r.tonic); savePref('keyScale', r.scale);
    app.pitch.originalTonicPref = r.tonic; savePref('originalTonic', r.tonic);
    app.pitch.originalScalePref = r.scale; savePref('originalScale', r.scale);
    app.pitch.transpose = 0; savePref('transpose', 0);
    if (transposeInput) transposeInput.value = '0';
    if (transposeLabel) transposeLabel.textContent = '0';
    rescheduleTransport(); updateEffectiveKeyLabel();
  } else {
    if (detectedKeyLabel) detectedKeyLabel.textContent = '—';
    app.pitch.keyTonic = 0; app.pitch.keyScale = 'major';
    savePref('keyTonic', 0); savePref('keyScale', 'major');
    if (keyTonicSelect) keyTonicSelect.value = '0';
    if (keyScaleSelect) keyScaleSelect.value = 'major';
    app.pitch.originalTonicPref = 0; savePref('originalTonic', 0);
    app.pitch.originalScalePref = 'major'; savePref('originalScale', 'major');
    app.pitch.transpose = 0; savePref('transpose', 0);
    if (transposeInput) transposeInput.value = '0';
    if (transposeLabel) transposeLabel.textContent = '0';
    updateEffectiveKeyLabel();
  }
  restoreSongConfig(); persistSongConfig();
}

function getOrLoadSFInstrumentForTrack(idx) {
  return getSFInstrument(idx, app.sfInstrumentNames[idx] || 'acoustic_grand_piano');
}
function setTrackSFInstrument(idx, name) {
  const fallback = gmInstrumentName(app.tracks?.[idx]?.program);
  app.sfInstrumentNames[idx] = normalizeSFInstrumentName(name, fallback);
  clearSFTrackCache(idx); persistSongConfig();
  getOrLoadSFInstrumentForTrack(idx).catch(() => {});
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
      savePref('transpose', app.pitch.transpose); changed = true;
    }
    if (typeof cfg.keyTonic === 'number') {
      app.pitch.keyTonic = ((cfg.keyTonic % 12) + 12) % 12;
      if (keyTonicSelect) keyTonicSelect.value = String(app.pitch.keyTonic);
      savePref('keyTonic', app.pitch.keyTonic); changed = true;
    }
    if (typeof cfg.keyScale === 'string' && cfg.keyScale) {
      app.pitch.keyScale = cfg.keyScale;
      if (keyScaleSelect) keyScaleSelect.value = cfg.keyScale;
      savePref('keyScale', app.pitch.keyScale); changed = true;
    }
    if (Array.isArray(cfg.sfInstrumentNames) && cfg.sfInstrumentNames.length === app.tracks.length) {
      app.sfInstrumentNames = cfg.sfInstrumentNames.map((n,i) => normalizeSFInstrumentName(n, gmInstrumentName(app.tracks[i]?.program)));
      disposeSFInstruments();
      app.sfInstrumentNames.forEach((_,i) => getOrLoadSFInstrumentForTrack(i).catch(() => {}));
      changed = true;
    }
    if (changed) { clearEarlyLookaheadState(); buildPracticeGroups(); rescheduleTransport(); updateEffectiveKeyLabel(); buildTrackUI(); }
  } catch {}
}

function persistSongConfig() {
  try {
    if (!app.songCfgKey) return;
    localStorage.setItem(app.songCfgKey, JSON.stringify({
      transpose: app.pitch.transpose || 0,
      keyTonic: app.pitch.keyTonic ?? 0,
      keyScale: app.pitch.keyScale || 'major',
      originalTonic: app.pitch.originalTonicPref ?? null,
      originalScale: app.pitch.originalScalePref ?? null,
      sfInstrumentNames: (app.sfInstrumentNames||[]).map((n,i) => normalizeSFInstrumentName(n, gmInstrumentName(app.tracks[i]?.program))),
    }));
  } catch {}
}

// ─────────────────────────────────────────────
// TRACK UI (debounced)
// ─────────────────────────────────────────────
let _buildTrackUITimer = null;
function buildTrackUI() {
  clearTimeout(_buildTrackUITimer);
  _buildTrackUITimer = setTimeout(buildTrackUI_immediate, 10);
}
function buildTrackUI_immediate() {
  tracksPanel.innerHTML = "";
  app.synths.forEach(s => { try { s?.dispose?.(); } catch {} });
  app.synths = [];
  const frag = document.createDocumentFragment();
  app.tracks.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-700";
    const swatch = document.createElement("span");
    swatch.className = "inline-block w-3 h-3 rounded-full";
    swatch.style.background = roleColor(app.roles[idx] || 'background');
    const title = document.createElement("div");
    title.className = "flex-1 truncate text-sm";
    title.textContent = t.name || `Track ${idx+1}`;
    title.title = (app.sfInstrumentNames[idx] || 'acoustic_grand_piano').replace(/_/g, ' ');
    const role = document.createElement('span');
    role.className = 'text-[10px] px-1.5 py-0.5 rounded-full border border-gray-700 bg-gray-800';
    const r = app.roles[idx] || 'background';
    role.textContent = r === 'left' ? 'L' : r === 'right' ? 'R' : 'B';
    role.style.color = r === 'left' ? '#14b8a6' : r === 'right' ? '#fb923c' : '#9ca3af';
    const mute = document.createElement("button");
    mute.className = `text-xs px-2 py-1 rounded-lg ${t.muted ? "bg-rose-600" : "bg-gray-700 hover:bg-gray-600"}`;
    mute.textContent = t.muted ? "Muted" : "Mute";
    mute.onclick = () => { t.muted = !t.muted; if (t.muted) t.solo = false; buildTrackUI(); rescheduleTransport(); };
    const solo = document.createElement("button");
    solo.className = `text-xs px-2 py-1 rounded-lg ${t.solo ? "bg-emerald-600" : "bg-gray-700 hover:bg-gray-600"}`;
    solo.textContent = t.solo ? "Soloed" : "Solo";
    solo.onclick = () => { t.solo = !t.solo; if (t.solo) t.muted = false; buildTrackUI(); rescheduleTransport(); };
    row.append(swatch, title, role, mute, solo);
    frag.appendChild(row);
    app.synths[idx] = null;
  });
  tracksPanel.appendChild(frag);
}

function getSongKeyBase() {
  try { return (String(localStorage.getItem('km_last_midi_name')||'Unknown MIDI').replace(/\.[^/.]+$/,'').trim().toLowerCase())||'unknown'; }
  catch { return 'unknown'; }
}
function autoAssignRoles() {
  app.roles = app.tracks.map((_, i) => i === 0 ? 'left' : i === 1 ? 'right' : 'background');
}
function loadRoles() {
  try {
    const s = localStorage.getItem(`km_roles_${getSongKeyBase()}`);
    if (s) { const arr = JSON.parse(s); if (Array.isArray(arr) && arr.length === app.tracks.length) { app.roles = arr; return; } }
  } catch {}
  autoAssignRoles();
}
function saveRoles() { try { localStorage.setItem(`km_roles_${getSongKeyBase()}`, JSON.stringify(app.roles)); } catch {} }

// Instruments modal
function renderInstrumentsModal() {
  if (!instrumentsList) return;
  instrumentsList.innerHTML = '';
  const frag = document.createDocumentFragment();
  app.tracks.forEach((t, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between bg-gray-900/50 p-2 rounded-lg border border-gray-800';
    const left = document.createElement('div'); left.className = 'flex items-center gap-2 overflow-hidden';
    const sw = document.createElement('span'); sw.className = 'inline-block w-3 h-3 rounded-full shrink-0';
    sw.style.background = TRACK_COLORS[idx % TRACK_COLORS.length];
    const nm = document.createElement('span'); nm.className = 'text-sm font-medium truncate';
    nm.textContent = t.name || `Track ${idx+1}`;
    left.append(sw, nm);
    const right = document.createElement('div'); right.className = 'flex items-center gap-2 shrink-0';
    const cl = document.createElement('span'); cl.className = 'text-xs text-emerald-400 truncate w-32 text-right';
    cl.textContent = (app.sfInstrumentNames[idx]||'acoustic_grand_piano').replace(/_/g,' ');
    cl.title = `Default: ${gmInstrumentName(t.program).replace(/_/g,' ')}`;
    const cb = document.createElement('button'); cb.className = 'px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs';
    cb.textContent = 'Change Voice'; cb.onclick = () => openInstrumentSelector(idx);
    right.append(cl, cb); row.append(left, right); frag.appendChild(row);
  });
  instrumentsList.appendChild(frag);
}
openInstrumentsBtn?.addEventListener('click', () => { renderInstrumentsModal(); instrumentsModal?.classList.remove('hidden'); });
instrumentsClose?.addEventListener('click', () => instrumentsModal?.classList.add('hidden'));

function renderRolesModal() {
  if (!rolesList) return;
  rolesList.innerHTML = '';
  const opts = [{v:'left',label:'Left Hand'},{v:'right',label:'Right Hand'},{v:'background',label:'Background'}];
  const frag = document.createDocumentFragment();
  app.tracks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-4 bg-gray-900/60 rounded-xl border border-gray-700 px-4 py-3 mb-3 last:mb-0';
    const name = document.createElement('div'); name.className = 'flex-1 truncate text-base font-medium';
    name.textContent = t.name || `Track ${i+1}`;
    const sel = document.createElement('select');
    sel.className = 'px-3 py-2.5 bg-gray-800 rounded-lg border border-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer';
    opts.forEach(o => { const opt = document.createElement('option'); opt.value = o.v; opt.textContent = o.label; sel.appendChild(opt); });
    sel.value = app.roles[i] || 'background';
    sel.onchange = () => { app.roles[i] = sel.value; };
    row.append(name, sel); frag.appendChild(row);
  });
  rolesList.appendChild(frag);
}
function ensureRolesScrollable() {
  if (!rolesList) return;
  try { rolesList.setAttribute('tabindex', '0'); } catch {}
  if (rolesList.__scrollWheel) rolesList.removeEventListener('wheel', rolesList.__scrollWheel);
  const onWheel = e => e.stopPropagation();
  const onTouch = e => e.stopPropagation();
  rolesList.__scrollWheel = onWheel;
  try { rolesList.addEventListener('wheel', onWheel, { passive: true }); rolesList.addEventListener('touchstart', onTouch, { passive: true }); rolesList.addEventListener('touchmove', onTouch, { passive: true }); } catch {}
}
openRolesBtn?.addEventListener('click', () => { renderRolesModal(); rolesModal?.classList.remove('hidden'); try { ensureRolesScrollable(); rolesList?.focus(); } catch {} });
rolesClose?.addEventListener('click', () => rolesModal?.classList.add('hidden'));
rolesSave?.addEventListener('click', () => { saveRoles(); buildTrackUI(); rescheduleTransport(); rolesModal?.classList.add('hidden'); });
rolesAuto?.addEventListener('click', () => { autoAssignRoles(); renderRolesModal(); });
document.addEventListener('keydown', e => {
  if (!rolesModal || rolesModal.classList.contains('hidden')) return;
  if (e.key === 'Enter') { e.preventDefault(); rolesSave?.click(); }
  if (e.key === 'Escape') { e.preventDefault(); rolesClose?.click(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); rolesSave?.click(); }
});

// ─────────────────────────────────────────────
// GUIDED PROGRESS
// ─────────────────────────────────────────────
function restoreGuidedProgress() {
  if (!app.guided.progressKey) return;
  try {
    const raw = localStorage.getItem(app.guided.progressKey);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.stages) && data.stages.length) {
      const n = Math.min(app.guided.sections.length, data.stages.length);
      app.guided.stages = Array.from({length: app.guided.sections.length}, (_, i) => {
        const sv = i < n ? data.stages[i] : null;
        return {
          index: i+1,
          mastery: sv ? {left:!!sv.left,right:!!sv.right,both:!!sv.both} : {left:!app.guided.hasSeparateHands,right:!app.guided.hasSeparateHands,both:false},
          accByStage: sv?.accByStage ? {left:sv.accByStage.left||0,right:sv.accByStage.right||0,both:sv.accByStage.both||0} : {left:0,right:0,both:0},
          lastTempo: (sv && typeof sv.lastTempo === 'number') ? clamp(sv.lastTempo,0.5,1.5) : 1,
        };
      });
      return;
    }
    if (data?.sections) {
      app.guided.stages = app.guided.sections.map((_, i) => {
        const sv = data.sections[String(i+1)] || {};
        return { index:i+1, mastery:{left:!!sv.left,right:!!sv.right,both:!!sv.both}, accByStage:sv.accByStage||{left:0,right:0,both:0}, lastTempo:typeof sv.lastTempo==='number'?clamp(sv.lastTempo,0.5,1.5):1 };
      });
    }
  } catch {}
}
function persistGuidedProgress() {
  if (!app.guided.progressKey) return;
  const name = localStorage.getItem('km_last_midi_name') || 'Unknown MIDI';
  const separate = !!app.guided.hasSeparateHands;
  const totalPhases = app.guided.stages.length * (separate ? 3 : 1);
  const completedPhases = app.guided.stages.reduce((a, st) => {
    return a + (separate ? ((st.mastery.left?1:0)+(st.mastery.right?1:0)+(st.mastery.both?1:0)) : (st.mastery.both?1:0));
  }, 0);
  try {
    localStorage.setItem(app.guided.progressKey, JSON.stringify({
      title: name.replace(/\.[^/.]+$/,''),
      separateHands: separate,
      stages: app.guided.stages.map(st => ({stage:st.index,left:!!st.mastery.left,right:!!st.mastery.right,both:!!st.mastery.both,accByStage:{...st.accByStage},lastTempo:st.lastTempo||1})),
      sections: Object.fromEntries(app.guided.stages.map((st,i) => [String(i+1), {left:!!st.mastery.left,right:!!st.mastery.right,both:!!st.mastery.both,accByStage:{...st.accByStage},lastTempo:st.lastTempo||1}])),
      completion: totalPhases ? Math.round((completedPhases/totalPhases)*100) : 0,
      lastPlayed: new Date().toISOString(),
    }));
  } catch {}
}
function updateGuidedUI() {
  if (!guidedPanel) return;
  const si = app.guided.currentIndex;
  const stage = app.guided.stages[si];
  if (!stage) return;
  if (guidedSectionLabel) guidedSectionLabel.textContent = `Stage ${si+1} of ${app.guided.sections.length}`;
  if (guidedStageLabel) guidedStageLabel.textContent = app.guided.stage==='left'?'Left Hand':app.guided.stage==='right'?'Right Hand':'Both Hands';
  if (guidedHint) guidedHint.textContent = app.guided.stage==='left'?'Now practice your left hand.':app.guided.stage==='right'?'Now practice your right hand.':'Try combining both hands!';
  if (guidedScopeEl) guidedScopeEl.textContent = `Scope: ${si===0?'Section 1':`Sections 1–${si+1}`}`;
  const { total, correct } = app.practice.stats;
  const savedAcc = stage.accByStage?.[app.guided.stage];
  const percent = total ? Math.round((correct/total)*100) : (savedAcc!=null ? Math.round(savedAcc) : (app.practice.lastLoopAccPercent||0));
  if (guidedAccBar) guidedAccBar.style.width = `${percent}%`;
  if (guidedAccLabel) {
    const mk = ok => ok ? '✅' : '🔄';
    guidedAccLabel.textContent = `${percent}% accuracy — ${app.guided.hasSeparateHands ? `Left: ${mk(!!stage.mastery.left)} | Right: ${mk(!!stage.mastery.right)} | Both: ${mk(!!stage.mastery.both)}` : `Both: ${mk(!!stage.mastery.both)}`}`;
  }
  if (guidedNextStageBtn) guidedNextStageBtn.classList.toggle('hidden', !isStageMastered(si, app.guided.stage));
  if (guidedStepLeft && guidedStepRight && guidedStepBoth) {
    const setPill = (el, active, done) => {
      el.classList.remove('bg-gray-800','border-gray-700','bg-blue-600','bg-emerald-600');
      el.classList.add('border');
      el.classList.add(done ? 'bg-emerald-600' : active ? 'bg-blue-600' : 'bg-gray-800');
      if (!done && !active) el.classList.add('border-gray-700');
    };
    setPill(guidedStepLeft, app.guided.stage==='left', !!stage.mastery.left);
    setPill(guidedStepRight, app.guided.stage==='right', !!stage.mastery.right);
    setPill(guidedStepBoth, app.guided.stage==='both', !!stage.mastery.both);
  }
  const sep = !!app.guided.hasSeparateHands;
  const tot = app.guided.stages.length * (sep?3:1);
  const done = app.guided.stages.reduce((a,st)=>a+(sep?((st.mastery.left?1:0)+(st.mastery.right?1:0)+(st.mastery.both?1:0)):(st.mastery.both?1:0)),0);
  const ov = tot ? Math.round((done/tot)*100) : 0;
  if (guidedOverallBar) guidedOverallBar.style.width = `${ov}%`;
  if (guidedOverallLabel) guidedOverallLabel.textContent = `${ov}% overall`;
}
function isStageMastered(index, stage) { const st = app.guided.stages[index]; return !!st?.mastery?.[stage]; }
function markStageOnContinue() {
  const { total, correct } = app.practice.stats;
  const percent = total ? Math.round((correct/total)*100) : (app.practice.lastLoopAccPercent||0);
  const st = app.guided.stages[app.guided.currentIndex];
  if (st) { if (st.accByStage) st.accByStage[app.guided.stage] = percent; st.mastery[app.guided.stage] = true; persistGuidedProgress(); updateGuidedUI(); }
}
function evaluateLoopPerformance() {
  const ls = app.practice.loop?.start ?? 0;
  const le = app.practice.loop?.end ?? app.duration;
  const groups = app.practice.groups;
  const matched = app.practice.matchedIds;
  let expected = 0, correct = 0;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (!g || g.time < ls) continue;
    if (g.time >= le) break;
    const sz = g.notes?.length || 0;
    expected += sz;
    if (app.practice.satisfiedGroups.has(i)) correct += sz;
    else if (Array.isArray(g.ids)) for (const id of g.ids) if (matched.has(id)) correct++;
  }
  correct = Math.min(correct, expected);
  app.practice.stats.total = expected; app.practice.stats.correct = correct;
  const percent = expected ? Math.round((correct/expected)*100) : 0;
  app.practice.lastLoopAccPercent = percent;
  const st = app.guided.stages[app.guided.currentIndex];
  if (st?.accByStage) st.accByStage[app.guided.stage] = percent;
  const cf = parseFloat(speed.value||'1')||1;
  const thr = 90;
  if (percent >= thr) {
    const next = clamp(cf+0.1, 1.0, 1.3);
    if (next > cf + 1e-6) { speed.value = String(next); speed.dispatchEvent(new Event('input')); showOverlay(`Great job! Increasing pace… (${Math.round(next*100)}%)`, 1200); }
    if (st) { st.lastTempo = next; st.mastery[app.guided.stage] = true; persistGuidedProgress(); }
  } else if (percent < Math.max(80,thr-10) && cf > 1.0) {
    speed.value = '1'; speed.dispatchEvent(new Event('input'));
    if (st) st.lastTempo = 1; showOverlay('Tempo back to normal', 900); persistGuidedProgress();
  } else if (st) { st.lastTempo = cf; persistGuidedProgress(); }
  app.practice.satisfiedGroups.clear(); updateGuidedUI();
  showOverlay(percent >= 98 ? `🔥 Accuracy: ${percent}% – Ready to continue?` : `🎯 Accuracy: ${percent}%`, 1200);
  showGuidedDecision(percent);
}
function avgTimingMs() {
  const arr = app.practice?.stats?.timings||[];
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*1000);
}
function setOverlayButtonsEnabled(en) {
  if (accOvReplayBtn) accOvReplayBtn.disabled = !en;
  if (accOvContinueBtn) accOvContinueBtn.disabled = !en;
  if (accOvUnlockHint) accOvUnlockHint.classList.toggle('hidden', en);
}
function showAccuracyOverlay() {
  if (!accuracyOverlay) return;
  const total = Number(app.practice?.stats?.total)||0, correct = Number(app.practice?.stats?.correct)||0;
  const percent = total > 0 ? Math.round((correct/total)*100) : 0;
  if (accOvPercentEl) accOvPercentEl.textContent = String(percent);
  if (accOvTimingEl) { const ms = avgTimingMs(); accOvTimingEl.textContent = `${ms>0?'+':''}${ms} ms`; }
  app.guided.inputLocked = true; app.guided.overlayUnlockAt = performance.now()+5000;
  setOverlayButtonsEnabled(false); accuracyOverlay.classList.remove('hidden');
  let interval = accOvUnlockHint ? setInterval(() => {
    const rem = Math.ceil((app.guided.overlayUnlockAt - performance.now())/1000);
    if (rem > 0) accOvUnlockHint.textContent = `You can continue in ${rem}s…`;
    if (performance.now() >= app.guided.overlayUnlockAt) { clearInterval(interval); interval = null; setOverlayButtonsEnabled(true); accOvUnlockHint.textContent = ''; }
  }, 250) : null;
  const cleanup = () => {
    if (interval) { try { clearInterval(interval); } catch {} interval = null; }
    accuracyOverlay.classList.add('hidden'); app.guided.inputLocked = false;
    if (app.practice?.loop) app.practice.loop._pending = false;
  };
  accOvReplayBtn?.addEventListener('click', async () => {
    if (performance.now() < app.guided.overlayUnlockAt) return; cleanup();
    app.practice.stats = {total:0,correct:0,misses:[],timings:[]}; app.practice.matchedIds = new Set(); clearEarlyLookaheadState();
    try { const { start } = app.practice.loop||{start:0}; Tone.Transport.seconds = start||0; updateTimeUI(start||0); Tone.Transport.start(`+${START_DELAY}`); startAnimation(); } catch {}
  }, {once:true});
  accOvContinueBtn?.addEventListener('click', async () => { if (performance.now() < app.guided.overlayUnlockAt) return; cleanup(); guidedPhaseContinueBtn?.click(); }, {once:true});
}
function showGuidedDecision(percent) {
  if (!guidedDecision) return;
  guidedDecision.classList.remove('hidden');
  const text = app.guided.stage==='left'?'➡ Continue to Right Hand':app.guided.stage==='right'?'➡ Continue to Both Hands':'➡ Continue to Next Section';
  if (guidedPhaseContinueBtn) { guidedPhaseContinueBtn.textContent = text; guidedPhaseContinueBtn.disabled = false; guidedPhaseContinueBtn.classList.remove('opacity-60'); }
}
guidedPracticeAgainBtn?.addEventListener('click', () => guidedDecision?.classList.add('hidden'));
guidedPhaseContinueBtn?.addEventListener('click', () => {
  guidedDecision?.classList.add('hidden'); markStageOnContinue();
  if (!app.guided.hasSeparateHands) { guidedNextSecBtn?.click(); return; }
  if (app.guided.stage==='left') app.guided.stage='right';
  else if (app.guided.stage==='right') app.guided.stage='both';
  else { guidedNextSecBtn?.click(); return; }
  startGuidedPracticeCycle(); persistGuidedProgress();
});
function getStageEndTime(index) { const s = app.guided.sections[Math.max(0,Math.min(index,app.guided.sections.length-1))]; return s?s.end:0; }
function setGuidedLoopToCurrentStage() {
  const end = getStageEndTime(app.guided.currentIndex);
  app.practice.loop.enabled = true; app.practice.loop.start = 0; app.practice.loop.end = end;
  if (loopToggle) loopToggle.checked = true;
  if (loopStartInput) loopStartInput.value = '0';
  if (loopEndInput) loopEndInput.value = String(Math.round(end*10)/10);
  savePref('loopEnabled',true); savePref('loopStart',0); savePref('loopEnd',end);
  try { Tone.Transport.seconds = 0; updateTimeUI(0); clearLoopTimer(); } catch {}
}
function applyGuidedStageHand() {
  if (!app.guided.enabled) return;
  if (!app.guided.hasSeparateHands) { setHand('both'); return; }
  setHand(app.guided.stage==='left'?'left':app.guided.stage==='right'?'right':'both');
}
function startGuidedPracticeCycle() {
  if (!app.guided.enabled) return;
  if (modeSelect) modeSelect.value='practice';
  app.practice.noteWait = true; if (noteWaitToggle) noteWaitToggle.checked = true;
  app.practice.autoContinue = false;
  app.practice.stats = {total:0,correct:0,misses:[],timings:[]}; app.practice.matchedIds = new Set();
  app.practice.lastLoopAccPercent = 0; clearEarlyLookaheadState(); updateGuidedUI();
  setGuidedLoopToCurrentStage(); applyGuidedStageHand();
  const st = app.guided.stages[app.guided.currentIndex];
  const factor = clamp(Number(st?.lastTempo)||1, 0.5, 1.5);
  if (speed) { speed.value = String(factor); speed.dispatchEvent(new Event('input')); }
  guidedDecision?.classList.add('hidden'); rescheduleTransport();
}
guidedToggleBtn?.addEventListener('click', () => {
  app.guided.enabled = !app.guided.enabled;
  guidedPanel?.classList.toggle('hidden', !app.guided.enabled);
  if (app.guided.enabled) {
    try { cancelCountIn(); } catch {} try { stopPracticeMetronome(); } catch {}
    try { if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) { stopListenScheduler(false); app.listen.baseSongTimeSec=0; reindexListenEvents(0); } else { Tone.Transport.stop(); Tone.Transport.seconds=0; } } catch {}
    try { stopAnimation({clear:true}); } catch {} try { panicAll(); } catch {}
    try { app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();app.pedal.sustainDown.clear();app.pedal.sustained.forEach(s=>s.clear()); kbDirty=true; const c=getCanvasContext();if(c)c.clearRect(0,0,WIDTH,HEIGHT-KEYBOARD_HEIGHT); drawKeyboard(); updateTimeUI(0); } catch {}
    try { applyGuidedPanelSavedPosition(); } catch {}
    if (guidedPrompt&&guidedPromptMsg) { guidedPromptMsg.textContent=app.guided.hasSeparateHands?"Detected separate left and right hand tracks. You'll learn this song step-by-step — left, right, and then both together!":"This MIDI file doesn't differentiate left and right hand parts. You'll practice both together."; guidedPrompt.classList.remove('hidden'); }
    try {
      const key = `km_handpref_${getSongKeyBase()}`;
      const saved = localStorage.getItem(key);
      if (app.tracks.length > 1) {
        if (!saved) {
          handSelectModal?.classList.remove('hidden');
          const onPick = hand => {
            try { localStorage.setItem(key,hand); } catch {}
            app.guided.stage = hand==='both'?'both':hand; setHand(app.guided.stage);
            handSelectModal?.classList.add('hidden'); startGuidedPracticeCycle(); persistGuidedProgress();
          };
          handPickLeft?.addEventListener('click',()=>onPick('left'),{once:true});
          handPickRight?.addEventListener('click',()=>onPick('right'),{once:true});
          handPickBoth?.addEventListener('click',()=>onPick('both'),{once:true});
          return;
        } else { app.guided.stage=saved==='both'?'both':saved==='right'?'right':'left'; setHand(app.guided.stage); }
      } else { app.guided.stage='both'; setHand('both'); }
    } catch {}
    startGuidedPracticeCycle(); persistGuidedProgress();
  } else { try{cancelCountIn();}catch{} try{stopPracticeMetronome();}catch{} }
});
guidedPromptContinue?.addEventListener('click', () => guidedPrompt?.classList.add('hidden'));
function markStageIfThreshold() {}
guidedPrevSecBtn?.addEventListener('click', () => { if (app.guided.currentIndex>0) { app.guided.currentIndex--; app.guided.stage=app.guided.hasSeparateHands?'left':'both'; guidedDecision?.classList.add('hidden'); startGuidedPracticeCycle(); persistGuidedProgress(); } });
guidedNextSecBtn?.addEventListener('click', () => { if (app.guided.currentIndex<app.guided.sections.length-1) { app.guided.currentIndex++; app.guided.stage=app.guided.hasSeparateHands?'left':'both'; guidedDecision?.classList.add('hidden'); startGuidedPracticeCycle(); persistGuidedProgress(); } });
guidedUnderstoodBtn?.addEventListener('click', () => {
  const st = app.guided.stages[app.guided.currentIndex];
  if (st) { if (!st.understoodByStage) st.understoodByStage={left:false,right:false,both:false}; st.understoodByStage[app.guided.stage]=true; }
  markStageIfThreshold(); updateGuidedUI(); persistGuidedProgress();
  if (!app.guided.hasSeparateHands) { guidedNextSecBtn?.click(); return; }
  if (app.guided.stage==='left') app.guided.stage='right';
  else if (app.guided.stage==='right') app.guided.stage='both';
  else { guidedNextSecBtn?.click(); return; }
  startGuidedPracticeCycle();
});
guidedNextStageBtn?.addEventListener('click', () => {
  if (!app.guided.hasSeparateHands) { guidedNextSecBtn?.click(); return; }
  if (app.guided.stage==='left') app.guided.stage='right';
  else if (app.guided.stage==='right') app.guided.stage='both';
  else { guidedNextSecBtn?.click(); return; }
  startGuidedPracticeCycle(); persistGuidedProgress();
});

// ─────────────────────────────────────────────
// SCHEDULER — deduplicated, soundfont-aware
// The original code had two near-identical passes over app.tracks; removed second pass.
// ─────────────────────────────────────────────
function scheduleIfNeeded() {
  if (!app.midi || app.scheduled) return;
  Tone.Transport.cancel();
  const token = app.renderToken;
  const isSoloActive = app.tracks.some(t => t.solo);

  if (modeSelect?.value === 'listen' && app.listen?.useAudioScheduler) {
    app.listen.events = buildListenEvents(isSoloActive);
    app.listen.idx = 0; app.scheduled = true; return;
  }

  if (modeSelect?.value === 'listen') {
    // Build merged timeline once
    const events = [];
    const enabled = ti => isSoloActive ? app.tracks[ti]?.solo : !app.tracks[ti]?.muted;
    app.tracks.forEach((t, ti) => {
      if (!enabled(ti)) return;
      t.notes.forEach(n => {
        const start = n.time, dur = Math.max(0.02, n.duration), end = start + dur;
        const mOut = applyTranspose(n.midi), tail = app.midiIO.tailMs/1000;
        const col = colorForNoteObj(n);
        events.push({type:'noteOn',time:start,midi:mOut,velocity:n.velocity,channel:t.channel,dur,color:col,trackIndex:ti});
        events.push({type:'visualOff',time:end,midi:mOut,channel:t.channel,color:col});
        events.push({type:'midiOff',time:end+tail,midi:mOut,channel:t.channel});
      });
    });
    app.midi.tracks.forEach((mt,mi) => {
      const ai = app.midiTrackToAppTrackIndex?.get(mi); if (ai===undefined) return;
      const ch = typeof mt.channel==='number' ? mt.channel : (app.tracks[ai]?.channel??0);
      const cc64 = mt.controlChanges?.[64] || mt.controlChanges?.["64"] || [];
      cc64.forEach(cc => events.push({type:'cc64',time:cc.time||0,value:Math.round((cc.value??0)*127),channel:ch}));
    });
    const prio = {cc64:0,noteOn:1,visualOff:2,midiOff:3};
    events.sort((a,b) => (a.time-b.time)||(prio[a.type]-prio[b.type]));
    events.forEach(ev => {
      Tone.Transport.schedule(schedTime => {
        if (token !== app.renderToken || modeSelect?.value !== 'listen') return;
        if (ev.type === 'noteOn') {
          if (shouldUseLocalAudio()) sfPlay(ev.trackIndex, app.sfInstrumentNames[ev.trackIndex]||'acoustic_grand_piano', ev.midi, ev.velocity, schedTime, ev.dur).catch(()=>{});
          sendNoteOn(ev.midi, Math.round((ev.velocity||0)*127), ev.channel, schedTime);
          Tone.Draw.schedule(() => { if (token===app.renderToken) handleNoteOnVisual(ev.midi,ev.channel,ev.color||getKeyGlowColor(ev.midi)); }, schedTime);
        } else if (ev.type === 'visualOff') {
          Tone.Draw.schedule(() => { if (token===app.renderToken) handleNoteOffVisual(ev.midi,ev.channel,ev.color||getKeyGlowColor(ev.midi)); }, schedTime);
        } else if (ev.type === 'midiOff') {
          sendNoteOff(ev.midi, ev.channel, schedTime);
        } else if (ev.type === 'cc64') {
          updateSustainState(ev.channel,(ev.value|0)>=64,getPlaybackTime()); sendCC(64,ev.value|0,ev.channel);
        }
      }, ev.time);
    });

  } else {
    // Practice mode
    app.tracks.forEach((t, ti) => {
      if (isSoloActive ? !t.solo : t.muted) return;
      t.notes.filter(n => handFilter(n)).forEach(n => {
        const time = n.time;
        Tone.Transport.schedule(schedTime => {
          if (token !== app.renderToken) return;
          const mOut = applyTranspose(n.midi);
          if (shouldUseLocalAudio() && modeSelect?.value === 'listen') {
            sfPlay(ti, app.sfInstrumentNames[ti]||'acoustic_grand_piano', mOut, n.velocity, schedTime, Math.max(0.02,n.duration)).catch(()=>{});
          }
          if (modeSelect?.value === 'listen') {
            sendNoteOn(mOut, Math.round(n.velocity*127), t.channel, schedTime);
            Tone.Draw.schedule(() => { if (token===app.renderToken && modeSelect?.value==='listen') handleNoteOnVisual(mOut,t.channel,colorForNoteObj(n)); }, schedTime);
          }
        }, time);
        const offAt = time + Math.max(0.02, n.duration);
        Tone.Transport.schedule(offSched => {
          if (token !== app.renderToken || modeSelect?.value !== 'listen') return;
          const mOut = applyTranspose(n.midi);
          Tone.Draw.schedule(() => { if (token===app.renderToken && modeSelect?.value==='listen') handleNoteOffVisual(mOut,t.channel,colorForNoteObj(n)); }, offSched);
        }, offAt);
        Tone.Transport.schedule(offTime => {
          if (token !== app.renderToken || modeSelect?.value !== 'listen') return;
          sendNoteOff(applyTranspose(n.midi), t.channel, offTime);
        }, time + Math.max(0.02,n.duration) + app.midiIO.tailMs/1000);
      });
    });

    // Background in Guided mode
    if (app.guided?.enabled) {
      app.tracks.forEach((t, ti) => {
        if ((app.roles[ti]||'background') !== 'background') return;
        if (isSoloActive ? !t.solo : t.muted) return;
        t.notes.forEach(n => {
          const time = n.time, dur = Math.max(0.02,n.duration);
          Tone.Transport.schedule(schedTime => {
            if (token !== app.renderToken) return;
            const mOut = applyTranspose(n.midi);
            if (shouldUseLocalAudio()) sfPlay(ti, app.sfInstrumentNames[ti]||'acoustic_grand_piano', mOut, n.velocity, schedTime, dur).catch(()=>{});
            sendNoteOn(mOut, Math.round((n.velocity||0)*127), t.channel, schedTime);
          }, time);
          Tone.Transport.schedule(offTime => { if (token===app.renderToken) sendNoteOff(applyTranspose(n.midi), t.channel, offTime); }, time+dur+app.midiIO.tailMs/1000);
        });
      });
    }

    // CC64
    app.midi.tracks.forEach((mt, mi) => {
      const ai = app.midiTrackToAppTrackIndex?.get(mi); if (ai===undefined) return;
      if (isSoloActive ? !app.tracks[ai]?.solo : app.tracks[ai]?.muted) return;
      const ch = typeof mt.channel==='number' ? mt.channel : (app.tracks[ai]?.channel??0);
      const cc64 = mt.controlChanges?.[64] || mt.controlChanges?.["64"] || [];
      cc64.forEach(cc => {
        const val = Math.round((cc.value??0)*127);
        Tone.Transport.schedule(() => { if (token!==app.renderToken||modeSelect?.value!=='listen') return; updateSustainState(ch,val>=64,getPlaybackTime()); sendCC(64,val,ch); }, cc.time??0);
      });
    });
  }

  if (modeSelect.value === 'practice') {
    buildPracticeGroups();
    app.practice.groups.forEach((g, idx) => {
      Tone.Transport.schedule(() => maybePauseForGroup(idx), Math.max(0, g.time-0.02));
    });
  }

  Tone.Transport.scheduleRepeat(() => {
    const t = getPlaybackTime();
    updateTimeUI(t);
    if (!app.practice.loop.enabled) return;
    const { start, end, pauseMs, _pending } = app.practice.loop;
    if (end > start && !_pending && t >= end) {
      app.practice.loop._pending = true;
      const wasRunning = Tone.Transport.state === 'started';
      try { Tone.Transport.pause(); } catch {}
      if (app.practice.loop._timer) { try{clearTimeout(app.practice.loop._timer);}catch{} app.practice.loop._timer = null; }
      if (app.guided.enabled && modeSelect.value === 'practice') {
        try { evaluateLoopPerformance(); } catch {}
        persistGuidedProgress?.(); kbDirty=true;
        const c=getCanvasContext(); if(c)c.clearRect(0,0,WIDTH,HEIGHT-KEYBOARD_HEIGHT); drawKeyboard(); showAccuracyOverlay();
      } else {
        app.practice.loop._timer = setTimeout(() => {
          app.practice.loop._timer = null;
          try { evaluateLoopPerformance(); } catch {}
          app.practice.stats = {total:0,correct:0,misses:[],timings:[]}; app.practice.matchedIds = new Set();
          clearEarlyLookaheadState();
          try { Tone.Transport.seconds = start; } catch {}
          try { panicAll(); } catch {}
          try { app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();app.pedal.sustainDown.clear();app.pedal.sustained.forEach(s=>s.clear()); } catch {}
          kbDirty=true; const c=getCanvasContext(); if(c)c.clearRect(0,0,WIDTH,HEIGHT-KEYBOARD_HEIGHT);
          if (wasRunning) { try { Tone.Transport.start(); } catch {} }
          app.practice.loop._pending = false;
        }, Math.max(0, pauseMs||300));
      }
    }
  }, 0.05);

  app.scheduled = true;
}

function rescheduleTransport() {
  if (!app.midi) return;
  const wasStarted = Tone.Transport.state === "started";
  const current = Tone.Transport.seconds;
  Tone.Transport.stop(); Tone.Transport.seconds = current;
  app.scheduled = false; scheduleIfNeeded();
  if (wasStarted && !(modeSelect?.value==='listen' && app.listen?.useAudioScheduler)) Tone.Transport.start();
}

// ─────────────────────────────────────────────
// METRONOME
// ─────────────────────────────────────────────
function ensureMetronome() {
  try {
    if (!app.metronome.gain) app.metronome.gain = new Tone.Gain(0.7).toDestination();
    if (!app.metronome.synth) app.metronome.synth = new Tone.MembraneSynth({envelope:{attack:0.001,decay:0.05,sustain:0,release:0.02}}).connect(app.metronome.gain);
  } catch {}
}
function stopPracticeMetronome() { try { if (app.metronome.repeatId!=null) { Tone.Transport.clear(app.metronome.repeatId); app.metronome.repeatId=null; } } catch {} }
function startPracticeMetronome() {
  stopPracticeMetronome(); if (!app.guided?.enabled) return;
  ensureMetronome(); let beat=0;
  try { app.metronome.repeatId = Tone.Transport.scheduleRepeat(time => { app.metronome.synth.triggerAttackRelease((beat++%app.metronome.accentPeriod)===0?'C6':'C5','8n',time); }, '4n'); } catch {}
}
function cancelCountIn() {
  const ci = app.metronome.countIn; if (!ci) return;
  ci.active=false; try{ci.timers.forEach(id=>clearTimeout(id));}catch{} ci.timers=[];
  if (countdownEl) countdownEl.classList.add('hidden');
}
function startGuidedCountInThen(startPlayback) {
  const beats = clamp(app.metronome.countInBeats||4, 1, 8);
  const beatSec = 60 / (Tone.Transport.bpm.value||120);
  const anchor = Tone.now() + 0.15;
  cancelCountIn(); ensureMetronome();
  const ci = app.metronome.countIn; ci.active=true; ci.timers=[];
  if (countdownEl) { countdownEl.classList.remove('hidden'); countdownEl.textContent='Get Ready'; }
  for (let i=0;i<beats;i++) {
    const when = anchor + i*beatSec;
    const remaining = beats - i;
    try { app.metronome.synth.triggerAttackRelease((i%app.metronome.accentPeriod)===0?'C6':'C5','8n',when); } catch {}
    if (countdownEl) ci.timers.push(setTimeout(() => { if(ci.active) countdownEl.textContent=remaining>1?String(remaining-1):'Go!'; }, Math.max(0,(when-Tone.now())*1000-20)));
  }
  ci.timers.push(setTimeout(() => {
    if (!ci.active) return;
    if (countdownEl) countdownEl.classList.add('hidden');
    startPlayback(); ci.active=false;
  }, Math.max(0,(anchor+beats*beatSec-Tone.now())*1000-10)));
}

// ─────────────────────────────────────────────
// TRANSPORT CONTROLS
// ─────────────────────────────────────────────
btnPlay.addEventListener("click", async () => {
  await Tone.start(); warmSFLib();
  try { Tone.getContext().latencyHint='interactive'; Tone.getContext().lookAhead=Math.max(0.2,Tone.getContext().lookAhead||0.2); } catch {}
  if (!app.midi) return showOverlay("Upload a MIDI file first");
  scheduleIfNeeded();
  try { if (app.practice?.loop?.enabled) { const {start,end}=app.practice.loop; const t=Tone.Transport.seconds||0; if(!(t>=start&&t<end)){Tone.Transport.seconds=start;updateTimeUI(start);} } } catch {}
  if (app.guided?.enabled && modeSelect?.value !== 'listen') {
    startGuidedCountInThen(() => {
      try { if(app.practice?.loop?.enabled){const{start,end}=app.practice.loop;const t=Tone.Transport.seconds||0;if(!(t>=start&&t<end)){Tone.Transport.seconds=start;updateTimeUI(start);}}else{Tone.Transport.seconds=0;updateTimeUI(0);} } catch {}
      Tone.Transport.start(`+${START_DELAY}`); startPracticeMetronome(); startAnimation();
      if (fsPlayPauseIcon) fsPlayPauseIcon.textContent='Pause';
    });
    return;
  }
  await doCountdownIfNeeded();
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) startListenScheduler();
  else Tone.Transport.start(`+${START_DELAY}`);
  startAnimation(); if (fsPlayPauseIcon) fsPlayPauseIcon.textContent='Pause';
});
btnPause.addEventListener("click", () => {
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) stopListenScheduler(true); else Tone.Transport.pause();
  try{cancelCountIn();}catch{} try{stopPracticeMetronome();}catch{}
  stopAnimation({clear:false}); panicAll();
  try{app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();app.pedal.sustainDown.clear();app.pedal.sustained.forEach(s=>s.clear());}catch{}
  kbDirty=true; if(fsPlayPauseIcon)fsPlayPauseIcon.textContent='Play';
});
btnStop.addEventListener("click", () => {
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler){stopListenScheduler(false);app.listen.baseSongTimeSec=0;}else{Tone.Transport.stop();Tone.Transport.seconds=0;}
  try{cancelCountIn();}catch{} try{stopPracticeMetronome();}catch{}
  updateTimeUI(0); stopAnimation({clear:true}); panicAll(); clearLoopTimer();
  if(fsPlayPauseIcon)fsPlayPauseIcon.textContent='Play';
  app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();kbDirty=true;
});
btnRestart.addEventListener("click", () => {
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler){stopListenScheduler(false);app.listen.baseSongTimeSec=0;}else{Tone.Transport.stop();Tone.Transport.seconds=0;}
  clearLoopTimer(); panicAll();
  app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();kbDirty=true;
  scheduleIfNeeded();
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) startListenScheduler(); else Tone.Transport.start(`+${START_DELAY}`);
  startAnimation(); if(fsPlayPauseIcon)fsPlayPauseIcon.textContent='Pause';
});
progress.addEventListener("input", () => {
  if (!app.midi) return;
  const t = (parseFloat(progress.value)/100) * app.duration;
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) {
    const was=app.listen.playing; if(was)stopListenScheduler(false);
    app.listen.baseSongTimeSec=clamp(t,0,app.duration||0); reindexListenEvents(app.listen.baseSongTimeSec);
    if(was)startListenScheduler();
  } else { Tone.Transport.seconds = t; }
  updateTimeUI(t); panicAll();
  kbDirty=true; const c=getCanvasContext(); if(c)c.clearRect(0,0,WIDTH,HEIGHT-KEYBOARD_HEIGHT);
  drawNotes(t); drawKeyboard(); clearLoopTimer();
});
speed.addEventListener("input", () => {
  const v = parseFloat(speed.value);
  if (modeSelect?.value==='listen'&&app.listen?.useAudioScheduler) {
    try { if(app.listen.playing){const cur=getPlaybackTime();app.listen.baseSongTimeSec=cur;app.listen.startAudioTime=Tone.getContext().now();reindexListenEvents(cur);} } catch {}
  } else { Tone.Transport.bpm.value = clamp(app._originalBpm*v, 20, 300); }
  speedLabel.textContent = `${Math.round(v*100)}%`;
});
modeSelect.addEventListener("change", () => {
  showOverlay(modeSelect.value==="practice"?"Practice Mode":"Listen Mode");
  app.practice.stats={total:0,correct:0,misses:[],timings:[]};
  if(app.listen?.useAudioScheduler)stopListenScheduler(false);
  rescheduleTransport(); savePref('mode',modeSelect.value);
});
noteWaitToggle?.addEventListener('change', () => { app.practice.noteWait=noteWaitToggle.checked; rescheduleTransport(); savePref('noteWait',noteWaitToggle.checked); });
handLeftBtn?.addEventListener('click', () => setHand('left'));
handRightBtn?.addEventListener('click', () => setHand('right'));
handBothBtn?.addEventListener('click', () => setHand('both'));
loopToggle?.addEventListener('change', () => { app.practice.loop.enabled=loopToggle.checked; savePref('loopEnabled',loopToggle.checked); if(!app.practice.loop.enabled)clearLoopTimer(); });
loopStartInput?.addEventListener('input', () => { app.practice.loop.start=Math.max(0,parseFloat(loopStartInput.value)||0); savePref('loopStart',app.practice.loop.start); clearLoopTimer(); });
loopEndInput?.addEventListener('input', () => { app.practice.loop.end=Math.max(0,parseFloat(loopEndInput.value)||0); savePref('loopEnd',app.practice.loop.end); clearLoopTimer(); });
feedbackClose?.addEventListener('click', () => feedbackModal.classList.add('hidden'));

// Settings modal
openMIDISettingsBtn?.addEventListener('click', () => { midiModal?.classList.remove('hidden'); showMidiTab(); if(sfBankInput)sfBankInput.value=app.sfConfig.soundfont; if(sfFormatSelect)sfFormatSelect.value=app.sfConfig.format; if(sfUrlTemplateInput)sfUrlTemplateInput.value=app.sfConfig.urlTemplate; });
midiClose?.addEventListener('click', () => midiModal?.classList.add('hidden'));
openTransposeSettingsBtn?.addEventListener('click', () => transposeModal?.classList.remove('hidden'));
transposeClose?.addEventListener('click', () => transposeModal?.classList.add('hidden'));
refreshMIDI?.addEventListener('click', () => initMIDI(true));
testNoteBtn?.addEventListener('click', () => {
  if (shouldUseLocalAudio()) { const ctx = Tone.getContext().rawContext; sfPlay(0,app.sfInstrumentNames[0]||'acoustic_grand_piano',60,0.8,ctx.currentTime+0.05,0.3).catch(()=>{}); }
  sendNoteOn(60,100); setTimeout(()=>sendNoteOff(60),250+(app.midiIO.tailMs||0));
});
midiThruToggle?.addEventListener('change', () => { app.midiIO.thru=!!midiThruToggle.checked; savePref('midiThru',app.midiIO.thru); });
tailMsInput?.addEventListener('input', () => { const v=parseInt(tailMsInput.value||'0',10); app.midiIO.tailMs=v; if(tailMsLabel)tailMsLabel.textContent=`${v}ms`; });

function applySoundfontSettingsFromUI() {
  const sf = normalizeSoundfontBankName(sfBankInput?.value||DEFAULT_SF_SOUND_FONT);
  const fmt = String(sfFormatSelect?.value||DEFAULT_SF_FORMAT).trim().toLowerCase()==='ogg'?'ogg':'mp3';
  const tpl = String(sfUrlTemplateInput?.value||DEFAULT_SF_URL_TEMPLATE).trim()||DEFAULT_SF_URL_TEMPLATE;
  app.sfConfig.soundfont=sf; app.sfConfig.format=fmt; app.sfConfig.urlTemplate=tpl;
  if (sfBankInput) sfBankInput.value = sf;
  savePref('sfSoundfont',sf); savePref('sfFormat',fmt); savePref('sfUrlTemplate',tpl);
  disposeSFInstruments();
  if(Array.isArray(app.tracks)&&app.tracks.length) app.sfInstrumentNames.forEach((_,i)=>getOrLoadSFInstrumentForTrack(i).catch(()=>{}));
  // Warm the names list so instrument selection matches the selected bank.
  getSoundfontNamesForBank(sf).catch(()=>{});
  showOverlay('Applied custom soundfont settings',1400);
}
sfApplyBtn?.addEventListener('click', applySoundfontSettingsFromUI);

let _curInstTrackIdx = -1;

let _uiSfNamesBank = null;
let _uiSfNames = GM_NAMES;
let _uiSfNamesToken = 0;

async function ensureUISoundfontNamesLoaded() {
  const bank = getSFConfig().soundfont;
  const token = ++_uiSfNamesToken;
  if (instrumentList) instrumentList.innerHTML = '<div class="text-sm opacity-70 px-2">Loading instruments…</div>';
  const names = await getSoundfontNamesForBank(bank);
  if (token !== _uiSfNamesToken) return;
  _uiSfNamesBank = bank;
  _uiSfNames = names && names.length ? names : GM_NAMES;
}

async function openInstrumentSelector(idx) {
  _curInstTrackIdx = idx;
  if (instrumentSearch) instrumentSearch.value = '';
  instrumentSelectorModal?.classList.remove('hidden');
  instrumentSearch?.focus();
  await ensureUISoundfontNamesLoaded();
  renderInstrumentList('');
}

function renderInstrumentList(query) {
  if (!instrumentList) return;
  const q = String(query || '').toLowerCase().trim();
  const names = Array.isArray(_uiSfNames) && _uiSfNames.length ? _uiSfNames : GM_NAMES;
  const filtered = q ? names.filter(n => n.includes(q)) : names;

  const frag = document.createDocumentFragment();
  filtered.forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full text-left px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-sm border border-gray-700 transition';
    btn.textContent = name.replace(/_/g, ' ');
    btn.onclick = () => {
      setTrackSFInstrument(_curInstTrackIdx, name);
      buildTrackUI();
      instrumentSelectorModal?.classList.add('hidden');
      renderInstrumentsModal();
    };
    frag.appendChild(btn);
  });
  instrumentList.innerHTML = '';
  instrumentList.appendChild(frag);
}

instrumentSearch?.addEventListener('input', e => renderInstrumentList(e.target.value));
instrumentModalClose?.addEventListener('click', () => instrumentSelectorModal?.classList.add('hidden'));
instrumentSelectorModal?.addEventListener('keydown', e => { if(e.key==='Escape')instrumentSelectorModal?.classList.add('hidden'); });

function showMidiTab() {
  if (!midiSettingsTab||!visualSettingsTab||!settingsTabMidi||!settingsTabVisuals) return;
  midiSettingsTab.classList.remove('hidden'); visualSettingsTab.classList.add('hidden');
  settingsTabMidi.classList.add('text-blue-400','border-blue-500'); settingsTabMidi.classList.remove('border-transparent');
  settingsTabVisuals.classList.remove('text-blue-400','border-blue-500'); settingsTabVisuals.classList.add('border-transparent');
}
function showVisualsTab() {
  if (!midiSettingsTab||!visualSettingsTab||!settingsTabMidi||!settingsTabVisuals) return;
  midiSettingsTab.classList.add('hidden'); visualSettingsTab.classList.remove('hidden');
  settingsTabVisuals.classList.add('text-blue-400','border-blue-500'); settingsTabVisuals.classList.remove('border-transparent');
  settingsTabMidi.classList.remove('text-blue-400','border-blue-500'); settingsTabMidi.classList.add('border-transparent');
}
settingsTabMidi?.addEventListener('click', showMidiTab);
settingsTabVisuals?.addEventListener('click', showVisualsTab);
radiusSelect?.addEventListener('change', () => savePref('radius',radiusSelect.value));
trailToggle?.addEventListener('change', () => savePref('trails',trailToggle.checked));
bounceToggle?.addEventListener('change', () => savePref('bounce',bounceToggle.checked));

// Piano mode
btnPianoMode?.addEventListener('click', () => {
  if (!canvas) canvas = document.getElementById("pianoRoll");
  if (!pianoFs||!pianoFsCanvasWrap||!canvas) return;
  canvasOriginalParent = canvas.parentElement;
  pianoFs.classList.remove('hidden'); pianoFsCanvasWrap.appendChild(canvas);
  if(fsPlayPauseIcon) fsPlayPauseIcon.textContent=(Tone.Transport.state==='started')?'Pause':'Play';
  requestAnimationFrame(()=>resizeCanvas());
});
fsExit?.addEventListener('click', () => {
  if (!canvas) canvas = document.getElementById("pianoRoll");
  if (!pianoFs||!canvasOriginalParent||!canvas) return;
  canvasOriginalParent.appendChild(canvas); pianoFs.classList.add('hidden');
  requestAnimationFrame(()=>resizeCanvas());
});
fsPlayPause?.addEventListener('click', async () => {
  await Tone.start(); warmSFLib();
  try{Tone.getContext().latencyHint='interactive';Tone.getContext().lookAhead=Math.max(0.2,Tone.getContext().lookAhead||0.2);}catch{}
  if (Tone.Transport.state==='started') { Tone.Transport.pause(); panicAll(); if(fsPlayPauseIcon)fsPlayPauseIcon.textContent='Play'; }
  else {
    scheduleIfNeeded();
    try{if(app.practice?.loop?.enabled){const{start,end}=app.practice.loop;const t=Tone.Transport.seconds||0;if(!(t>=start&&t<end)){Tone.Transport.seconds=start;updateTimeUI(start);}}}catch{}
    Tone.Transport.start((Tone.Transport.seconds||0)<0.02?`+${START_DELAY}`:undefined);
    startAnimation(); if(fsPlayPauseIcon)fsPlayPauseIcon.textContent='Pause';
  }
});
enhancedToggle?.addEventListener('change', () => savePref('enhanced',enhancedToggle.checked));
hitLineToggle?.addEventListener('change', () => savePref('hitLine',hitLineToggle.checked));
noteOpacity?.addEventListener('input', () => { const v=parseFloat(noteOpacity.value||'0.95'); savePref('noteOpacity',v); if(noteOpacityLabel)noteOpacityLabel.textContent=`${Math.round(v*100)}%`; });
glowIntensity?.addEventListener('input', () => { const v=parseFloat(glowIntensity.value||'1'); savePref('glowIntensity',v); if(glowIntensityLabel)glowIntensityLabel.textContent=`${v.toFixed(1)}x`; });
visualLatencyInput?.addEventListener('input', () => { const ms=parseInt(visualLatencyInput.value||'0',10); VISUAL_LATENCY=clamp(ms/1000,-0.25,0.25); savePref('visualLatencyOffset',VISUAL_LATENCY); if(visualLatencyLabel)visualLatencyLabel.textContent=`${ms} ms`; });

// ─────────────────────────────────────────────
// GUIDED PANEL DRAG
// ─────────────────────────────────────────────
const GUIDED_POS_KEY = 'km_guided_panel_pos_v1';
function clampPanelPos(x, y) {
  const pad=8, w=guidedPanel?.offsetWidth||320, h=guidedPanel?.offsetHeight||200;
  return { x:clamp(x,pad,Math.max(pad,window.innerWidth-w-pad)), y:clamp(y,pad,Math.max(pad,window.innerHeight-h-pad)) };
}
function applyGuidedPanelSavedPosition() {
  if (!guidedPanel) return;
  try { const {x,y}=JSON.parse(localStorage.getItem(GUIDED_POS_KEY)||'{}'); if(!x&&!y)return; const clamped=clampPanelPos(Number(x)||0,Number(y)||0); guidedPanel.classList.remove('right-3','bottom-3'); guidedPanel.style.cssText+=`;right:auto;bottom:auto;left:${Math.round(clamped.x)}px;top:${Math.round(clamped.y)}px`; } catch {}
}
function makeGuidedPanelDraggable() {
  if (!guidedPanel||!guidedPanelHeader) return;
  let dragging=false, sx=0, sy=0, ox=0, oy=0;
  guidedPanelHeader.addEventListener('mousedown', e => {
    dragging=true; sx=e.clientX; sy=e.clientY;
    const rect=guidedPanel.getBoundingClientRect();
    ox=guidedPanel.style.left?parseFloat(guidedPanel.style.left)||rect.left:rect.left;
    oy=guidedPanel.style.top?parseFloat(guidedPanel.style.top)||rect.top:rect.top;
    guidedPanel.classList.remove('right-3','bottom-3'); guidedPanel.style.right='auto'; guidedPanel.style.bottom='auto';
    document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); e.preventDefault();
  });
  const onMove = e => { if(!dragging||!guidedPanel)return; const {x,y}=clampPanelPos(ox+e.clientX-sx,oy+e.clientY-sy); guidedPanel.style.left=`${Math.round(x)}px`; guidedPanel.style.top=`${Math.round(y)}px`; };
  const onUp = () => { if(!dragging)return; dragging=false; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); const r=guidedPanel.getBoundingClientRect(); try{localStorage.setItem(GUIDED_POS_KEY,JSON.stringify({x:r.left,y:r.top}));}catch{}; };
  window.addEventListener('resize', () => { if(!guidedPanel||!guidedPanel.style.left)return; const r=guidedPanel.getBoundingClientRect(); const {x,y}=clampPanelPos(r.left,r.top); guidedPanel.style.left=`${Math.round(x)}px`; guidedPanel.style.top=`${Math.round(y)}px`; });
}
try { makeGuidedPanelDraggable(); applyGuidedPanelSavedPosition(); } catch {}

// ─────────────────────────────────────────────
// DRAW — OPTIMIZED
// Uses pre-computed geometry arrays; offscreen keyboard cache;
// skips canvas state changes when nothing changed.
// ─────────────────────────────────────────────

function getRadius() {
  switch (radiusSelect?.value) { case 'square':return 2; case 'pill':return 24; default:return 10; }
}

// Draw the keyboard to an offscreen canvas, then blit it — avoids re-drawing 88 keys every frame
function ensureKbOffscreen() {
  if (!kbOffscreen || kbLastWidth !== WIDTH || kbLastHeight !== HEIGHT) {
    kbOffscreen = document.createElement('canvas');
    kbOffscreen.width = WIDTH; kbOffscreen.height = KEYBOARD_HEIGHT;
    kbOffCtx = kbOffscreen.getContext('2d');
    kbLastWidth = WIDTH; kbLastHeight = HEIGHT;
    kbDirty = true;
  }
}

function renderKbToOffscreen() {
  if (!kbOffCtx) return;
  const c = kbOffCtx;
  const whiteW = GEO.whiteW;
  const kbH = KEYBOARD_HEIGHT;
  const enhance = enhancedToggle?.checked;

  c.fillStyle = "#0b1220";
  c.fillRect(0, 0, WIDTH, kbH);

  // White keys
  let wi = 0;
  for (const m of GEO.whiteKeys) {
    const x = GEO.midiToXArr[m];
    const pressed = app.liveKeys.has(m);
    const glow = getKeyGlowLevel(m);
    c.fillStyle = "#ffffff";
    c.fillRect(x, 0, whiteW - 1, kbH);
    c.fillStyle = "#111827";
    c.fillRect(x + whiteW - 1, 0, 1, kbH);
    if (pressed || glow > 0.01) {
      const color = getKeyGlowColor(m, "#60a5fa");
      const alpha = 0.55 * glow + (pressed ? 0.35 : 0);
      if (enhance) {
        const grad = c.createLinearGradient(x, 0, x, kbH);
        grad.addColorStop(0, hexToRgba(color, alpha));
        grad.addColorStop(1, hexToRgba(color, 0.15 * glow + (pressed ? 0.15 : 0)));
        c.fillStyle = grad;
      } else {
        c.fillStyle = hexToRgba(color, alpha);
      }
      c.fillRect(x, 0, whiteW - 1, kbH);
    }
    c.strokeStyle = pressed ? "rgba(239,68,68,0.95)" : "rgba(239,68,68,0.6)";
    c.lineWidth = pressed ? 2 : 1;
    c.strokeRect(x + 0.5, 0.5, whiteW - 2, kbH - 1);
    wi++;
  }

  // Black keys
  const bkH = kbH * 0.6;
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!GEO.isBlack[m]) continue;
    const x = GEO.midiToXArr[m], w = GEO.midiToWArr[m];
    const pressed = app.liveKeys.has(m);
    const glow = getKeyGlowLevel(m);
    c.fillStyle = "#1f2937";
    c.fillRect(x, 0, w, bkH);
    if (pressed || glow > 0.01) {
      const color = getKeyGlowColor(m, "#60a5fa");
      const alpha = 0.6 * glow + (pressed ? 0.4 : 0);
      if (enhance) {
        const grad = c.createLinearGradient(x, 0, x, bkH);
        grad.addColorStop(0, hexToRgba(color, alpha));
        grad.addColorStop(1, hexToRgba(color, 0.2 * glow + (pressed ? 0.2 : 0)));
        c.fillStyle = grad;
      } else {
        c.fillStyle = hexToRgba(color, alpha);
      }
      c.fillRect(x, 0, w, bkH);
    }
    c.strokeStyle = pressed ? "rgba(239,68,68,0.95)" : "rgba(239,68,68,0.6)";
    c.lineWidth = pressed ? 2 : 1;
    c.strokeRect(x + 0.5, 0.5, w - 1, bkH - 1);
  }
  kbDirty = false;
}

function drawKeyboard() {
  const c = getCanvasContext();
  if (!c || !WIDTH || !HEIGHT) return;
  ensureKbOffscreen();
  // Always redraw offscreen if keys pressed/released or size changed
  if (kbDirty) renderKbToOffscreen();
  const kbY = HEIGHT - KEYBOARD_HEIGHT;
  c.drawImage(kbOffscreen, 0, kbY);

  if (!hitLineToggle || hitLineToggle.checked) {
    c.strokeStyle = "#38bdf8"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, hitLineY()); c.lineTo(WIDTH, hitLineY()); c.stroke();
  }
}

// Mark keyboard dirty whenever live key state changes
function markKbDirty() { kbDirty = true; }

// ─────────────────────────────────────────────
// DRAW NOTES — highly optimized inner loop
// ─────────────────────────────────────────────
let lastTimeDrawn = -1;

function drawNotes(currentTime) {
  if (!app.midi) return;
  const c = getCanvasContext(); if (!c) return;
  const timeAdvanced = lastTimeDrawn < 0 || Math.abs(currentTime - lastTimeDrawn) > 1e-3;

  if (TRAILS_ENABLED && trailToggle?.checked && Tone.Transport.state === "started" && timeAdvanced) {
    c.fillStyle = "rgba(9,12,22,0.25)"; c.fillRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  } else {
    c.clearRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT);
  }

  const enhance = enhancedToggle?.checked;
  if (enhance) { c.fillStyle = "rgba(2,6,14,0.5)"; c.fillRect(0, 0, WIDTH, HEIGHT - KEYBOARD_HEIGHT); }

  const FALL = NOTE_FALL_DURATION;
  const SPAWN_EARLY = 0.03;
  const isSoloActive = app.tracks.some(t => t.solo);
  const nowMs = performance.now();
  const pulse = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(nowMs / 250));
  const waitingReq = app.practice.waiting ? new Set(app.practice.requiredSet) : null;
  const hitY = hitLineY();
  const isListen = modeSelect?.value === 'listen';
  const isGuided = app.guided?.enabled && !isListen;
  const practHand = app.practice?.hand || 'both';
  const hasRoles = Array.isArray(app.roles) && app.roles.length === app.tracks.length;
  const radius = getRadius();
  const baseNoteOpac = parseFloat(noteOpacity?.value || '0.95');

  app.upcomingKeys.clear();
  // Integer-keyed overlap map to avoid string allocation
  const overlapMap = new Map();

  for (let ti = 0; ti < app.tracks.length; ti++) {
    const t = app.tracks[ti];
    if (isSoloActive ? !t.solo : t.muted) continue;

    // Compute per-track opacity modifier once
    let trackOpac = baseNoteOpac;
    if (isGuided && hasRoles) {
      const role = app.roles[ti] || 'background';
      const active = practHand === 'both' ? (role === 'left' || role === 'right') : (role === practHand);
      if (!active && role !== 'background') trackOpac *= 0.55;
      if (role === 'background') trackOpac *= 0.45;
    }

    // Pre-resolve note color for this track (all notes same color per role)
    const trackRole = hasRoles ? (app.roles[ti] || 'background') : 'background';
    const trackColor = ROLE_COLOR[trackRole] || ROLE_COLOR.background;

    const notes = t.notes;
    for (let ni = 0; ni < notes.length; ni++) {
      const n = notes[ni];
      if (!handFilter(n)) continue;

      const groupedTime = app.practice.groupTimeById.get(n.id);
      const start = groupedTime != null ? groupedTime : n.time;
      const end = n.time + n.duration;
      if (currentTime >= end) continue;
      if (currentTime < start - FALL - SPAWN_EARLY) continue;

      const visMidi = applyTranspose(n.midi);
      const baseW = GEO.midiToWArr[visMidi] * 0.9;
      const baseH = Math.max(6, n.duration * (HEIGHT - KEYBOARD_HEIGHT) / FALL);
      const tNorm = clamp((currentTime - (start - FALL) + VISUAL_LATENCY) / FALL, 0, 1);
      const eased = tNorm * tNorm;
      const y = -40 + (hitY + 40) * eased;
      let h;
      if (currentTime < start) {
        h = baseH;
      } else {
        h = Math.max(0, baseH * clamp((end - currentTime) / n.duration, 0, 1));
        if (h < 1.5) continue;
      }

      // Overlap detection using integer hash
      const hashKey = (Math.round(start * 100) * 200) + visMidi;
      const overlapIdx = overlapMap.get(hashKey) || 0;
      overlapMap.set(hashKey, overlapIdx + 1);
      let x = GEO.midiToXArr[visMidi] + (overlapIdx % 2 === 0 ? 1 : -1) * Math.min(2, overlapIdx);
      let w = baseW;

      const isWaiting = waitingReq?.has(n.midi) && Math.abs(start - currentTime) < 2;
      if (isWaiting) w = baseW * (0.95 + 0.06 * pulse);

      // Draw fill
      c.globalAlpha = trackOpac;
      if (enhance) {
        const grad = c.createLinearGradient(x, y - h, x, y);
        grad.addColorStop(0, hexToRgba(trackColor, 0.8));
        grad.addColorStop(1, hexToRgba(shadeColor(trackColor, -10), 1.0));
        c.fillStyle = grad;
      } else {
        c.fillStyle = trackColor;
      }
      if (c.roundRect) { c.beginPath(); c.roundRect(x, y - h, w, h, radius); c.fill(); }
      else { c.fillRect(x, y - h, w, h); }
      c.globalAlpha = 1.0;

      // Outline for landing / waiting
      const nearStart = Math.abs(start - currentTime) < 0.02 || Math.abs(1 - tNorm) < 0.02;
      const pressed = app.liveKeys.has(n.midi);
      const isWaitingTarget = app.practice.waiting && waitingReq?.has(n.midi);
      if (nearStart || isWaitingTarget) {
        c.strokeStyle = pressed ? "#22c55e" : isWaitingTarget ? "#ef4444" : "#f43f5e";
        c.lineWidth = 2;
        if (c.roundRect) { c.beginPath(); c.roundRect(x, y-h, w, h, radius); c.stroke(); }
        else { c.strokeRect(x, y-h, w, h); }
      }

      // Upcoming key hint for listen mode
      if (start - currentTime <= 0.4 && start - currentTime > 0) {
        app.upcomingKeys.add(visMidi);
        if (isListen && Tone.Transport.state === 'started') startKeyGlow(visMidi, true, trackColor);
      }
    }
  }
}

// ─────────────────────────────────────────────
// ANIMATION LOOP
// ─────────────────────────────────────────────
let rafId = null, animRunning = false;
function startAnimation() {
  if (animRunning) return;
  animRunning = true; cancelAnimationFrame(rafId);
  const loop = () => {
    if (!animRunning) return;
    const t = getSmoothVisualTime();
    drawNotes(t);
    drawKeyboard();      // blits offscreen (cheap if kbDirty=false)
    updateTimeUI(t);
    lastTimeDrawn = t;
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}
function stopAnimation({ clear = false } = {}) {
  animRunning = false; cancelAnimationFrame(rafId);
  if (clear) { const c=getCanvasContext(); if(c)c.clearRect(0,0,WIDTH,HEIGHT-KEYBOARD_HEIGHT); kbDirty=true; drawKeyboard(); }
}

function updateTimeUI(t) {
  const d = app.duration || 0;
  timeLabel.textContent = `${formatTime(t)} / ${formatTime(d)}`;
  const clamped = d ? clamp((t/d)*100, 0, 100) : 0;
  if (!isNaN(clamped)) { try{ progress.value=String(clamped); progress.style.setProperty('--progress',`${clamped}%`); }catch{} }
  if (d && t >= d && !app.practice.loop.enabled) {
    Tone.Transport.stop(); stopAnimation({clear:true});
    if (modeSelect.value==='practice') showFeedback();
  }
}

function clearLoopTimer() {
  const loop = app.practice?.loop; if (!loop) return;
  if (loop._timer) { try{clearTimeout(loop._timer);}catch{} loop._timer=null; } loop._pending=false;
}

// ─────────────────────────────────────────────
// KEY GLOW (marks keyboard dirty on change)
// ─────────────────────────────────────────────
function startKeyGlow(midi, pressed, color) {
  const now = performance.now();
  const item = app.keyGlow.get(midi) || { state:'idle', start:now, color };
  if (pressed) app.keyGlow.set(midi, {state:'fade-in',start:now,end:now+100,color});
  else app.keyGlow.set(midi, {state:'fade-out',start:now,end:now+200,color:item.color||color});
  kbDirty = true;
}
function getKeyGlowLevel(midi) {
  const now = performance.now();
  const item = app.keyGlow.get(midi); if (!item) return 0;
  if (item.state === 'fade-in') { const t=clamp((now-item.start)/(item.end-item.start),0,1); if(t>=1)app.keyGlow.set(midi,{state:'hold',start:now,color:item.color}); return t; }
  if (item.state === 'hold') return 1;
  if (item.state === 'fade-out') { const t=clamp((now-item.start)/(item.end-item.start),0,1); if(t>=1){app.keyGlow.delete(midi);kbDirty=true;} return 1-t; }
  return 0;
}
function getKeyGlowColor(midi, fallback="#60a5fa") { const item=app.keyGlow.get(midi); return item?.color||handColorForMidi(midi)||fallback; }

function handleNoteOnVisual(midi, channel, color)  { app.liveKeys.add(midi); startKeyGlow(midi,true,color); ensureSustainSet(channel); }
function handleNoteOffVisual(midi, channel, color) {
  const sustain = !!app.pedal.sustainDown.get(channel);
  const set = ensureSustainSet(channel);
  if (sustain) { set.add(midi); }
  else { app.liveKeys.delete(midi); startKeyGlow(midi,false,color); set.delete(midi); }
}

// ─────────────────────────────────────────────
// MIDI I/O
// ─────────────────────────────────────────────
const BASE_TOLERANCE = 0.30;

async function initMIDI(forceRefresh=false) {
  if (!navigator.requestMIDIAccess) { midiStatus.textContent="Web MIDI not supported."; if(midiConnDot)midiConnDot.style.backgroundColor='#ef4444'; return; }
  try {
    if (!app.midiIO.access||forceRefresh) { app.midiIO.access=await navigator.requestMIDIAccess({sysex:false}); app.midiIO.access.onstatechange=()=>populateMIDIDevices(); }
    populateMIDIDevices();
  } catch { midiStatus.textContent="MIDI access denied."; if(midiConnDot)midiConnDot.style.backgroundColor='#ef4444'; }
}
function populateMIDIDevices() {
  const access=app.midiIO.access; if (!access) return;
  app.midiIO.inputs=new Map(access.inputs); app.midiIO.outputs=new Map(access.outputs);
  if (midiInSelect) {
    midiInSelect.innerHTML='';
    for (const [id,inp] of app.midiIO.inputs) { const o=document.createElement('option');o.value=id;o.textContent=inp.name||id;midiInSelect.appendChild(o); }
    if(app.midiIO.inId&&app.midiIO.inputs.has(app.midiIO.inId))midiInSelect.value=app.midiIO.inId;
    else if(midiInSelect.options.length){midiInSelect.selectedIndex=0;app.midiIO.inId=midiInSelect.value;}
    bindSelectedInput();
    midiInSelect.onchange=()=>{app.midiIO.inId=midiInSelect.value;bindSelectedInput();savePref('midiInId',app.midiIO.inId);};
  }
  if (midiOutSelect) {
    midiOutSelect.innerHTML='';
    const defOpt=document.createElement('option');defOpt.value='default';defOpt.textContent='Default (WebAudio + Soundfont)';midiOutSelect.appendChild(defOpt);
    for(const[id,out]of app.midiIO.outputs){const o=document.createElement('option');o.value=id;o.textContent=out.name||id;midiOutSelect.appendChild(o);}
    if(app.midiIO.outId&&(app.midiIO.outId==='default'||app.midiIO.outputs.has(app.midiIO.outId)))midiOutSelect.value=app.midiIO.outId;
    else{midiOutSelect.value='default';app.midiIO.outId='default';}
    app.midiIO.output=(app.midiIO.outId&&app.midiIO.outId!=='default')?(app.midiIO.outputs.get(app.midiIO.outId)||null):null;
    midiOutSelect.onchange=()=>{app.midiIO.outId=midiOutSelect.value;app.midiIO.output=(app.midiIO.outId&&app.midiIO.outId!=='default')?(app.midiIO.outputs.get(app.midiIO.outId)||null):null;savePref('midiOutId',app.midiIO.outId);rescheduleTransport();};
  }
  const inN=[...app.midiIO.inputs.values()].map(i=>i.name).join(', ');
  const outN=[...app.midiIO.outputs.values()].map(o=>o.name).join(', ');
  midiStatus.textContent=`MIDI In: ${inN||'—'} | Out: ${outN||'—'}`;
  if(midiConnDot)midiConnDot.style.backgroundColor=(app.midiIO.inputs.size||app.midiIO.outputs.size)?'#22c55e':'#ef4444';
}
function bindSelectedInput() {
  if(app.midiIO.input){try{app.midiIO.input.onmidimessage=null;}catch{}}
  app.midiIO.input=app.midiIO.inputs.get(app.midiIO.inId)||null;
  if(app.midiIO.input)app.midiIO.input.onmidimessage=onMIDIMessage;
}
function onMIDIMessage(e) {
  const [status,data1,data2]=e.data;
  const cmd=status&0xf0, ch=status&0x0f, note=data1;
  const velocity=data2/127;
  const now=Tone.Transport.seconds, nowCal=now+(app.practice.inputOffsetSec||0);
  if (app.guided?.inputLocked) {
    if(cmd===0x90&&velocity>0&&app.midiIO.thru)sendNoteOn(applyTranspose(note),Math.round(velocity*127),ch);
    else if((cmd===0x80||(cmd===0x90&&velocity===0))&&app.midiIO.thru)sendNoteOff(applyTranspose(note),ch);
    else if(cmd===0xB0&&app.midiIO.thru)sendCC(data1&0x7f,data2&0x7f,ch);
    return;
  }
  if (cmd===0x90&&velocity>0) {
    const tNote=applyTranspose(note);
    if(modeSelect?.value==='listen'){if(app.midiIO.thru)sendNoteOn(tNote,Math.round(velocity*127),ch);return;}
    if(isLikelyEcho('on',tNote,ch,now))return;
    handleNoteOnVisual(tNote,ch,colorForIncoming(note)); if(app.midiIO.thru)sendNoteOn(tNote,Math.round(velocity*127),ch);
    checkNoteHit(tNote,nowCal);
    if(modeSelect.value==='practice'&&app.practice.noteWait){
      const ahead=findGroupsInLookahead(nowCal), tol=app.practice.octaveTol||0;
      for(const g of ahead){let set=app.practice.earlyHits.get(g.index);if(!set){set=new Set();app.practice.earlyHits.set(g.index,set);}for(const req of g.notes){if(set.has(req))continue;if(midiMatchesWithOctave(req,tNote,tol)){set.add(req);break;}}if(set.size>=g.notes.length)app.practice.skipWaitFor.add(g.index);}
      const near=findUpcomingGroupNearTime(nowCal);
      if(near){if(!app.practice.waiting){app.practice.waiting=true;app.practice.currentIndex=near.index;app.practice.requiredSet=new Set(near.notes);app.practice.hitSet=new Set();app.practice.lastWaitTime=near.time;}if(matchAndMarkRequired(tNote)&&isCurrentChordSatisfied()&&Tone.Transport.state!=='started')resumeFromGroupWait(now);}
    }
    if(app.practice.waiting&&matchAndMarkRequired(tNote)&&isCurrentChordSatisfied())resumeFromGroupWait(now);
  } else if (cmd===0x80||(cmd===0x90&&velocity===0)) {
    const tNote=applyTranspose(note);
    if(modeSelect?.value==='listen'){if(app.midiIO.thru)sendNoteOff(tNote,ch);return;}
    if(isLikelyEcho('off',tNote,ch,now))return;
    handleNoteOffVisual(tNote,ch,colorForIncoming(note)); if(app.midiIO.thru)sendNoteOff(tNote,ch);
  } else if (cmd===0xB0) {
    const ctrl=data1&0x7f, val=data2&0x7f;
    if(ctrl===64)updateSustainState(ch,val>=64,now);
    if(app.midiIO.thru)sendCC(ctrl,val);
  }
}
function updateSustainState(channel, isDown, now) {
  const wasDown=!!app.pedal.sustainDown.get(channel); app.pedal.sustainDown.set(channel,isDown);
  if(!isDown&&wasDown){const set=app.pedal.sustained.get(channel);if(set&&set.size){for(const m of [...set]){app.liveKeys.delete(m);startKeyGlow(m,false,getKeyGlowColor(m));set.delete(m);}}}
}
function ensureSustainSet(ch){if(!app.pedal.sustained.has(ch))app.pedal.sustained.set(ch,new Set());return app.pedal.sustained.get(ch);}
function checkNoteHit(midi, timeSec) {
  if (!app.midi) return false;
  const tol = app.practice.hitWindowSec||BASE_TOLERANCE;
  const bucket = Math.round(timeSec*10)/10;
  for (const b of [bucket, Math.round((timeSec+0.05)*10)/10, Math.round((timeSec-0.05)*10)/10]) {
    const list = app.expectedNotesByTime.get(b); if (!list) continue;
    for (const exp of list) {
      try {
        if (Array.isArray(app.roles)&&app.roles.length===app.tracks.length) {
          const hasLR=app.roles.some(r=>r==='left'||r==='right');
          if(hasLR){const role=(app.roles[exp.trackIndex])||'background';if(role==='background')continue;const hand=app.practice?.hand||'both';if(hand!=='both'&&role!==hand)continue;}
        }
      } catch {}
      if(!exp.hit&&midiMatchesWithOctave(applyTranspose(exp.midi),midi,app.practice.octaveTol||0)&&Math.abs(exp.time-timeSec)<=tol){
        exp.hit=true; app.score++; scoreEl.textContent=String(app.score);
        startKeyGlow(midi,true,'#22c55e'); setTimeout(()=>startKeyGlow(midi,false,'#22c55e'),140);
        try{const inLoop=app.practice.loop?.enabled?(exp.time>=app.practice.loop.start&&exp.time<app.practice.loop.end):true;if(inLoop&&exp.id)app.practice.matchedIds.add(exp.id);}catch{}
        return true;
      }
    }
  }
  if(!app.practice.waiting){startKeyGlow(midi,true,'#ef4444');setTimeout(()=>startKeyGlow(midi,false,'#ef4444'),200);}
  return false;
}
function midiMatchesWithOctave(exp,played,tol){if(exp===played)return true;const t=Math.max(0,Math.min(2,Number(tol)||0));const d=played-exp;if((d%12+12)%12!==0)return false;return Math.abs(d)<=t*12;}
function matchAndMarkRequired(playedMidi){
  if(!app.practice.waiting)return false;
  const tol=app.practice.octaveTol||0;
  for(const req of app.practice.requiredSet){
    if(app.practice.hitSet.has(req))continue;
    if(midiMatchesWithOctave(req,playedMidi,tol)){
      app.practice.hitSet.add(req);
      try{const gi=app.practice.currentIndex,g=app.practice.groups?.[gi];if(g&&Array.isArray(g.ids)&&g.ids.length===g.notes.length){for(let k=0;k<g.notes.length;k++){if(!app.practice.matchedIds.has(g.ids[k])&&midiMatchesWithOctave(g.notes[k],playedMidi,tol)){app.practice.matchedIds.add(g.ids[k]);break;}}}}catch{}
      return true;
    }
  }
  return false;
}
function flashKey(midi,ok){if(modeSelect?.value==='practice')return;const now=performance.now();if(!flashKey._last||(now-flashKey._last)>400){flashKey._last=now;showOverlay(ok?"Correct!":"Oops",400);}}

async function loadPracticeStats(){try{const s=localStorage.getItem('practiceStats');if(!s)return false;const obj=JSON.parse(s);if(obj&&typeof obj==='object'){app.practice.stats={total:Number(obj.total)||0,correct:Number(obj.correct)||0,misses:Array.isArray(obj.misses)?obj.misses:[],timings:Array.isArray(obj.timings)?obj.timings:[]};return true;}}catch{__LP_LOAD_ERRORS++;}return false;}
function anySavedDataPresent(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k.startsWith(PREF_PREFIX)||k==='practiceStats'||k==='lp_last_midi_b64'||k==='lp_last_midi_name')return true;}}catch{}return false;}

async function bootstrap() {
  try {
    setLoadingStatus('Loading preferences…'); setLoadingHeadline('Loading your practice setup…');
    try{const op='lp_pref_';for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k.startsWith(op)){const v=localStorage.getItem(k),nk='km_pref_'+k.slice(op.length);if(localStorage.getItem(nk)==null&&v!=null)localStorage.setItem(nk,v);}}const oM=localStorage.getItem('lp_last_midi_b64'),oN=localStorage.getItem('lp_last_midi_name');if(oM&&!localStorage.getItem('km_last_midi_b64'))localStorage.setItem('km_last_midi_b64',oM);if(oN&&!localStorage.getItem('km_last_midi_name'))localStorage.setItem('km_last_midi_name',oN);}catch{}
    applyPrefsToUI();
    setLoadingStatus('Loading MIDI config…'); await initMIDI();
    setLoadingStatus('Loading practice progress…'); await loadPracticeStats(); updatePreviousButtonLabel();
    const hadAny=anySavedDataPresent();
    if(!hadAny||__LP_LOAD_ERRORS>0){setLoadingHeadline('Starting fresh…');setLoadingStatus(__LP_LOAD_ERRORS>0?'Some saved data could not be read.':'');await sleep(1500);}
    else{
      const b64=localStorage.getItem('km_last_midi_b64')||localStorage.getItem('lp_last_midi_b64');
      const name=localStorage.getItem('km_last_midi_name')||localStorage.getItem('lp_last_midi_name');
      if(b64){setLoadingStatus('Loading previous MIDI…');try{const bs=atob(b64);const bytes=new Uint8Array(bs.length);for(let i=0;i<bs.length;i++)bytes[i]=bs.charCodeAt(i);let midi;try{midi=new Midi(bytes.buffer);}catch{const safe=sanitizeTimeSignatureMeta(bytes);midi=new Midi(safe.buffer);}initFromMidi(midi);if(name)showOverlay(`Loaded previous: ${name}`);}catch(e){__LP_LOAD_ERRORS++;console.warn('[KeyMistry] Failed to load previous MIDI',e);}}
      await sleep(300);
    }
  } finally { hideLoadingOverlay(); resizeCanvas(); }
}
function setLoadingStatus(msg){if(loadingStatus)loadingStatus.textContent=msg;}
function setLoadingHeadline(msg){if(loadingHeadline)loadingHeadline.textContent=msg;}
function hideLoadingOverlay(){if(!loadingOverlay)return;loadingOverlay.style.opacity='0';setTimeout(()=>{loadingOverlay.classList.add('hidden');app.isLoading=false;},520);}

bootstrap();

// ─────────────────────────────────────────────
// PRACTICE GROUPS & MIDI NOTE MATCHING
// ─────────────────────────────────────────────
function setHand(hand){
  app.practice.hand=hand;
  if(handLeftBtn&&handRightBtn&&handBothBtn){handLeftBtn.className=`px-2 py-1 ${hand==='left'?'bg-blue-600':'bg-gray-700 hover:bg-gray-600'}`;handBothBtn.className=`px-2 py-1 ${hand==='both'?'bg-blue-600':'bg-gray-700 hover:bg-gray-600'}`;handRightBtn.className=`px-2 py-1 ${hand==='right'?'bg-blue-600':'bg-gray-700 hover:bg-gray-600'}`;}
  clearEarlyLookaheadState(); buildPracticeGroups(); rescheduleTransport();
}
function handFilter(n){
  if(modeSelect?.value==='listen')return true;
  if(Array.isArray(app.roles)&&app.roles.length===app.tracks.length){const hasLR=app.roles.some(r=>r==='left'||r==='right');if(!hasLR)return true;const role=app.roles[n.trackIndex]||'background';if(role==='background')return false;const hand=app.practice?.hand||'both';if(hand==='both')return role==='left'||role==='right';return role===hand;}
  const thr=applyTranspose(60);if(app.practice?.hand==='left')return applyTranspose(n.midi)<thr;if(app.practice?.hand==='right')return applyTranspose(n.midi)>=thr;return true;
}
async function doCountdownIfNeeded(){if(modeSelect.value!=='practice'||!countdownEl)return;countdownEl.classList.remove('hidden');for(let i=3;i>=1;i--){countdownEl.textContent=String(i);await sleep(500);}countdownEl.classList.add('hidden');}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function buildPracticeGroups(){
  if(!app.midi){app.practice.groups=[];return;}
  const all=app.tracks.flatMap(tr=>tr.notes);
  const filtered=all.filter(n=>handFilter(n)).sort((a,b)=>a.time-b.time);
  const groups=[], tol=app.practice.chordWindowSec||0.06;
  let cur=null;
  for(const n of filtered){if(!cur||Math.abs(n.time-cur.time)>tol){cur={time:n.time,notes:[applyTranspose(n.midi)],ids:[n.id]};groups.push(cur);}else{cur.notes.push(applyTranspose(n.midi));cur.ids.push(n.id);}}
  app.practice.groups=groups; app.practice.currentIndex=0;
  app.practice.groupTimeById=new Map();
  for(const g of groups)for(const id of g.ids)app.practice.groupTimeById.set(id,g.time);
  app.practice.earlyHits=new Map(); app.practice.skipWaitFor=new Set(); app.practice.satisfiedGroups=new Set();
}
function findUpcomingGroupNearTime(tCal){
  if(!app.practice.groups.length)return null;
  const si=Math.max(0,app.practice.currentIndex), mx=Math.min(app.practice.groups.length-1,si+3), win=app.practice.hitWindowSec||BASE_TOLERANCE;
  for(let i=si;i<=mx;i++){const g=app.practice.groups[i];if(!g)continue;if(Math.abs(g.time-tCal)<=win)return{...g,index:i};if(g.time>tCal+win)break;}
  return null;
}
function findGroupsInLookahead(tCal){
  const out=[],list=app.practice.groups,look=Math.max(0,app.practice.lookaheadSec||0);
  if(!list.length||look<=0)return out;
  const loS=app.practice.loop.enabled?app.practice.loop.start:tCal, loE=app.practice.loop.enabled?app.practice.loop.end:tCal+look;
  for(let i=0;i<list.length;i++){const g=list[i];if(g.time<loS)continue;if(g.time>Math.min(loE,tCal+look))break;if(g.time>=tCal)out.push({...g,index:i});}
  return out;
}
function clearEarlyLookaheadState(){app.practice.earlyHits.clear();app.practice.skipWaitFor.clear();if(maybePauseForGroup._credited)maybePauseForGroup._credited.clear();app.practice.satisfiedGroups.clear();}
function maybePauseForGroup(index){
  if(!app.practice.noteWait||modeSelect.value!=='practice')return;
  const g=app.practice.groups[index]; if(!g)return;
  const t=Tone.Transport.seconds;
  if(t>g.time+0.02)return;
  if(app.practice.skipWaitFor.has(index)){
    if(app.practice.waiting&&app.practice.currentIndex===index){app.practice.waiting=false;clearTimeout(app.practice._waitTimeout);}
    if(!maybePauseForGroup._credited)maybePauseForGroup._credited=new Set();
    if(!maybePauseForGroup._credited.has(index)){maybePauseForGroup._credited.add(index);app.practice.stats.correct+=(g.notes?.length||0);app.practice.stats.timings.push(t-(g.time??t));updateGuidedUI();app.practice.satisfiedGroups.add(index);}
    return;
  }
  if(app.practice.waiting&&app.practice.currentIndex===index){if(isCurrentChordSatisfied()){app.practice.waiting=false;return;}}
  else{app.practice.waiting=true;app.practice.currentIndex=index;app.practice.requiredSet=new Set(g.notes);app.practice.hitSet=new Set();app.practice.lastWaitTime=g.time;}
  if(!isCurrentChordSatisfied()){
    Tone.Transport.pause();
    if(app.practice.autoContinue){clearTimeout(app.practice._waitTimeout);app.practice._waitTimeout=setTimeout(()=>{if(app.practice.waiting&&app.practice.currentIndex===index&&!isCurrentChordSatisfied()){for(const n of app.practice.requiredSet)if(!app.practice.hitSet.has(n))app.practice.stats.misses.push({midi:n,time:g.time});resumeFromGroupWait(Tone.Transport.seconds);}},Math.max(600,(app.practice.hitWindowSec||BASE_TOLERANCE)*2000));}
  }
}
function isCurrentChordSatisfied(){if(!app.practice.waiting)return false;for(const n of app.practice.requiredSet)if(!app.practice.hitSet.has(n))return false;return true;}
function resumeFromGroupWait(now){
  app.practice.waiting=false; clearTimeout(app.practice._waitTimeout);
  try{const gi=app.practice.currentIndex,required=app.practice.requiredSet,hitCount=[...required].filter(n=>app.practice.hitSet?.has(n)).length;app.practice.stats.correct+=hitCount;app.practice.stats.timings.push(now-(app.practice.lastWaitTime??now));if(Number.isFinite(gi)&&hitCount>=required.size&&required.size>0)app.practice.satisfiedGroups.add(gi);}catch{}
  updateGuidedUI(); Tone.Transport.start();
}
function showFeedback(){
  if(!feedbackModal)return;
  const{total,correct,timings,misses}=app.practice.stats;
  const percent=total?Math.round((correct/total)*100):0;
  if(accPercentEl)accPercentEl.textContent=String(percent);if(accCorrectEl)accCorrectEl.textContent=String(correct);if(accTotalEl)accTotalEl.textContent=String(total);
  if(missListEl){missListEl.innerHTML='';const frag=document.createDocumentFragment();misses.forEach(m=>{const li=document.createElement('li');li.textContent=`Note ${m.midi} at ${formatTime(m.time)}`;frag.appendChild(li);});missListEl.appendChild(frag);}
  try{localStorage.setItem('practiceStats',JSON.stringify(app.practice.stats));}catch{}
  feedbackModal.classList.remove('hidden');
}

// ─────────────────────────────────────────────
// ECHO / MIDI OUTPUT HELPERS
// ─────────────────────────────────────────────
function _echoKey(type,midi,ch){return `${ch&0x0f}:${midi&0x7f}:${type}`;}
function markOutbound(type,midi,ch){try{app.midiIO._echo.set(_echoKey(type,midi,ch),Tone.Transport.seconds||0);}catch{}}
function isLikelyEcho(type,midi,ch,nowSec){try{const t=app.midiIO._echo.get(_echoKey(type,midi,ch));if(t==null)return false;return(nowSec-t)<=(app.midiIO.echoWindowSec||0.3);}catch{return false;}}
function _audioTimeToTs(audioTimeSec){try{const rctx=Tone.getContext().rawContext;return performance.now()+Math.max(0,(audioTimeSec-rctx.currentTime)*1000);}catch{return undefined;}}
function sendNoteOn(midi,velocity=100,ch=0,schedTime){const out=app.midiIO.output;if(!out)return;try{out.send([0x90|(ch&0x0f),midi&0x7f,clamp(velocity,0,127)],schedTime!=null?_audioTimeToTs(schedTime):undefined);markOutbound('on',midi,ch);}catch{}}
function sendNoteOff(midi,ch=0,schedTime){const out=app.midiIO.output;if(!out)return;try{out.send([0x80|(ch&0x0f),midi&0x7f,0],schedTime!=null?_audioTimeToTs(schedTime):undefined);markOutbound('off',midi,ch);}catch{}}
function sendCC(ctrl,val,ch=0){const out=app.midiIO.output;if(!out)return;try{out.send([0xB0|(ch&0x0f),ctrl&0x7f,clamp(val,0,127)]);}catch{}}
function panicAll(){for(let ch=0;ch<16;ch++){sendCC(64,0,ch);const out=app.midiIO.output;if(!out)continue;try{out.send([0xB0|ch,123,0]);}catch{}try{out.send([0xB0|ch,120,0]);}catch{}try{out.send([0xB0|ch,121,0]);}catch{}}try{app.synths.forEach(s=>s?.releaseAll?.());}catch{}}
function shouldUseLocalAudio(){return !app.midiIO.output;}

// ─────────────────────────────────────────────
// COLORS & TRANSPOSE
// ─────────────────────────────────────────────
function handColorForMidi(midi){return midi<60?'#60a5fa':'#fb923c';}
function roleColor(role){return role==='left'?'#14b8a6':role==='right'?'#fb923c':'#9ca3af';}
function colorForNoteObj(n){const role=(app.roles&&app.roles[n.trackIndex])||'background';return ROLE_COLOR[role]||ROLE_COLOR.background;}
function colorForIncoming(midi){
  const tc=app.tracks?.length||0; if(tc<=1)return handColorForMidi(applyTranspose(midi));
  const now=Tone.Transport.seconds; let best=null;
  for(let ti=0;ti<app.tracks.length;ti++){const notes=app.tracks[ti].notes;let nd=Infinity;for(let i=0;i<notes.length;i++){const n=notes[i];if(n.midi!==midi)continue;const dt=Math.abs(n.time-now);if(dt<nd){nd=dt;best={trackIndex:ti};}if(dt<0.02)break;}}
  if(best){if(best.trackIndex===0)return'#60a5fa';if(best.trackIndex===1)return'#fb923c';return TRACK_COLORS[best.trackIndex%TRACK_COLORS.length]||'#a78bfa';}
  return handColorForMidi(midi);
}
function applyTranspose(midi){return clamp(Math.round(midi+(app.pitch?.transpose||0)),0,127);}

// ─────────────────────────────────────────────
// PLAYBACK TIME & SMOOTH CLOCK
// ─────────────────────────────────────────────
function _audioPlaybackTime(){try{const rc=Tone.getContext().rawContext,f=clamp(parseFloat(speed?.value||'1')||1,0.5,1.5);return app.listen.baseSongTimeSec+(rc.currentTime-app.listen.startAudioTime)*f;}catch{return 0;}}
function getPlaybackTime(){
  try{if(modeSelect?.value==='listen'&&app.listen?.useAudioScheduler&&app.listen.playing)return _audioPlaybackTime();}catch{}
  try{return Tone.Transport.seconds||0;}catch{return 0;}
}
const _sc={est:0,lastRaf:0,lastState:'stopped',lastTone:0};
function getSmoothVisualTime(){
  const tone=getPlaybackTime(),now=performance.now(),state=Tone.Transport.state;
  const started=(state==='started')||(modeSelect?.value==='listen'&&app.listen?.useAudioScheduler&&app.listen.playing);
  if(!started){_sc.est=tone;_sc.lastRaf=now;_sc.lastState=started?'started':state;_sc.lastTone=tone;return tone;}
  if(_sc.lastState!=='started'||Math.abs(tone-_sc.est)>0.15){_sc.est=tone;_sc.lastRaf=now;_sc.lastState=state;_sc.lastTone=tone;return tone;}
  const dt=Math.max(0,(now-_sc.lastRaf)/1000);
  _sc.est+=dt;_sc.lastRaf=now;_sc.lastState=state;_sc.lastTone=tone;
  _sc.est+=clamp(tone-_sc.est,-0.05,0.05)*0.2;
  return _sc.est;
}

// ─────────────────────────────────────────────
// LISTEN SCHEDULER (soundfont-aware)
// ─────────────────────────────────────────────
function buildListenEvents(isSoloActive){
  const events=[];
  const enabled=ti=>isSoloActive?app.tracks[ti]?.solo:!app.tracks[ti]?.muted;
  app.tracks.forEach((t,ti)=>{
    if(!enabled(ti))return;
    const ch=t.channel??0;
    t.notes.forEach(n=>{
      const start=n.time,dur=Math.max(0.02,n.duration),end=start+dur,mOut=applyTranspose(n.midi),tail=app.midiIO.tailMs/1000,col=colorForNoteObj(n);
      events.push({type:'noteOn',time:start,midi:mOut,velocity:n.velocity,channel:ch,dur,color:col,trackIndex:ti});
      events.push({type:'visualOff',time:end,midi:mOut,channel:ch,color:col});
      events.push({type:'midiOff',time:end+tail,midi:mOut,channel:ch});
    });
  });
  app.midi.tracks.forEach((mt,mi)=>{
    const ai=app.midiTrackToAppTrackIndex?.get(mi); if(ai===undefined)return;
    const ch=typeof mt.channel==='number'?mt.channel:(app.tracks[ai]?.channel??0);
    const cc64=mt.controlChanges?.[64]||mt.controlChanges?.["64"]||[];
    cc64.forEach(cc=>events.push({type:'cc64',time:cc.time||0,value:Math.round((cc.value??0)*127),channel:ch}));
  });
  const prio={cc64:0,noteOn:1,visualOff:2,midiOff:3};
  events.sort((a,b)=>(a.time-b.time)||(prio[a.type]-prio[b.type]));
  return events;
}
function reindexListenEvents(songTimeSec){
  const ev=app.listen.events;let lo=0,hi=ev.length;
  while(lo<hi){const mid=(lo+hi)>>1;ev[mid].time<songTimeSec?lo=mid+1:hi=mid;}
  app.listen.idx=lo;
}
function startListenScheduler(){
  const rc=Tone.getContext().rawContext;
  if(!Number.isFinite(app.listen.baseSongTimeSec))app.listen.baseSongTimeSec=0;
  app.listen.startAudioTime=rc.currentTime; reindexListenEvents(app.listen.baseSongTimeSec); app.listen.playing=true;
  if(!Array.isArray(app.listen.events)||!app.listen.events.length){app.listen.events=buildListenEvents(app.tracks.some(t=>t.solo));reindexListenEvents(app.listen.baseSongTimeSec);}
  if(app.listen.intervalId){try{clearInterval(app.listen.intervalId);}catch{}}
  app.listen.intervalId=setInterval(scheduleListenWindow,app.listen.intervalMs);
  scheduleListenWindow();
}
function stopListenScheduler(pause){
  if(app.listen.intervalId){try{clearInterval(app.listen.intervalId);}catch{}app.listen.intervalId=null;}
  if(app.listen.playing&&pause){try{app.listen.baseSongTimeSec=_audioPlaybackTime();}catch{}}
  app.listen.playing=false;
}
function scheduleListenWindow(){
  if(!app.listen.playing)return;
  const rc=Tone.getContext().rawContext,nowA=rc.currentTime;
  const f=clamp(parseFloat(speed?.value||'1')||1,0.5,1.5);
  const wSong=app.listen.baseSongTimeSec+(nowA-app.listen.startAudioTime)*f;
  const wEnd=wSong+app.listen.aheadSec*f;
  const loop=app.practice?.loop||{enabled:false};
  const lS=loop.enabled?Math.max(0,loop.start||0):0;
  const lE=loop.enabled?Math.max(lS,loop.end||(app.duration||0)):(app.duration||Infinity);
  if(loop.enabled&&wSong>=lE){
    try{panicAll();}catch{}
    try{app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();app.pedal.sustainDown.clear();app.pedal.sustained.forEach(s=>s.clear());}catch{}
    kbDirty=true; app.listen.baseSongTimeSec=lS; app.listen.startAudioTime=nowA; reindexListenEvents(lS); return;
  }
  const limit=Math.min(wEnd,lE), events=app.listen.events;
  while(app.listen.idx<events.length){
    const ev=events[app.listen.idx];
    if(ev.time<wSong-0.001){app.listen.idx++;continue;}
    if(ev.time>=limit)break;
    const whenAudio=app.listen.startAudioTime+(ev.time-app.listen.baseSongTimeSec)/f;
    switch(ev.type){
      case 'noteOn':
        if(shouldUseLocalAudio())sfPlay(ev.trackIndex??0,app.sfInstrumentNames[ev.trackIndex??0]||'acoustic_grand_piano',ev.midi,ev.velocity,whenAudio,Math.max(0.02,ev.dur||0)).catch(()=>{});
        sendNoteOn(ev.midi,Math.round((ev.velocity||0)*127),ev.channel,whenAudio);
        Tone.Draw.schedule(()=>handleNoteOnVisual(ev.midi,ev.channel,ev.color||getKeyGlowColor(ev.midi)),whenAudio); break;
      case 'visualOff':
        Tone.Draw.schedule(()=>handleNoteOffVisual(ev.midi,ev.channel,ev.color||getKeyGlowColor(ev.midi)),whenAudio); break;
      case 'midiOff': sendNoteOff(ev.midi,ev.channel,whenAudio); break;
      case 'cc64': updateSustainState(ev.channel,(ev.value|0)>=64,wSong); sendCC(64,ev.value|0,ev.channel); break;
    }
    app.listen.idx++;
  }
}

// ─────────────────────────────────────────────
// TRANSPOSE & KEY
// ─────────────────────────────────────────────
function updateEffectiveKeyLabel(){
  if(!effectiveKeyLabel)return;
  const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  effectiveKeyLabel.textContent=`${names[app.pitch.keyTonic||0]} ${app.pitch.keyScale||'major'}`;
}
function detectKeyFromMidi(){
  if(!app.midi)return null;
  const maj=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
  const min=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const counts=new Array(12).fill(0);
  for(const tr of app.tracks)for(const n of tr.notes)counts[n.midi%12]+=Math.max(1,n.duration);
  const scoreFor=profile=>{let best={tonic:0,score:-Infinity};for(let s=0;s<12;s++){let sc=0;for(let i=0;i<12;i++)sc+=counts[i]*profile[(12+i-s)%12];if(sc>best.score)best={tonic:s,score:sc};}return best;};
  const M=scoreFor(maj),m=scoreFor(min);
  const scale=M.score>=m.score?'major':'minor';
  return{tonic:(scale==='major'?M.tonic:m.tonic)%12,scale};
}
function getOriginalTonic(){return app.pitch.originalTonicPref!=null?app.pitch.originalTonicPref:app.pitch.detectedTonic!=null?app.pitch.detectedTonic:0;}
function computeTransposeForTarget(targetTonic){const orig=getOriginalTonic();let t=((targetTonic-orig)%12+12)%12;if(t>6)t=t-12;return clamp(t,-12,12);}
function syncTransposeUI(){if(transposeInput)transposeInput.value=String(app.pitch.transpose);if(transposeLabel)transposeLabel.textContent=`${app.pitch.transpose}`;}
function clearTransposeState(){try{app.liveKeys.clear();app.keyGlow.clear();app.upcomingKeys.clear();app._lastLandingFlash.clear();app.pedal.sustained.forEach(s=>s.clear());app.practice.waiting=false;app.practice.requiredSet.clear();app.practice.hitSet.clear();}catch{}}

transposeInput?.addEventListener('input',()=>{
  const v=parseInt(transposeInput.value||'0',10)||0; app.pitch.transpose=clamp(v,-12,12);
  if(transposeLabel)transposeLabel.textContent=`${app.pitch.transpose}`; savePref('transpose',app.pitch.transpose); persistSongConfig();
  const nk=((getOriginalTonic()+app.pitch.transpose)%12+12)%12; app.pitch.keyTonic=nk;
  if(keyTonicSelect)keyTonicSelect.value=String(nk); savePref('keyTonic',nk);
  clearTransposeState(); clearEarlyLookaheadState(); buildPracticeGroups(); kbDirty=true;
  const t=getPlaybackTime();drawNotes(t);drawKeyboard();rescheduleTransport();updateEffectiveKeyLabel();persistSongConfig();
});
inputOffsetMsInput?.addEventListener('input',()=>{const ms=parseInt(inputOffsetMsInput.value||'0',10);if(inputOffsetLabel)inputOffsetLabel.textContent=`${ms} ms`;app.practice.inputOffsetSec=clamp(ms/1000,-0.4,0.4);savePref('inputOffsetMs',ms);});
octaveTolInput?.addEventListener('input',()=>{const v=clamp(parseInt(octaveTolInput.value||'1',10)||0,0,2);app.practice.octaveTol=v;if(octaveTolLabel)octaveTolLabel.textContent=`±${v} oct`;savePref('octaveTol',v);});
keyTonicSelect?.addEventListener('change',()=>{
  app.pitch.keyTonic=parseInt(keyTonicSelect.value||'0',10)||0; savePref('keyTonic',app.pitch.keyTonic); persistSongConfig();
  const newT=computeTransposeForTarget(app.pitch.keyTonic);
  if(app.pitch.transpose!==newT){app.pitch.transpose=newT;savePref('transpose',newT);syncTransposeUI();clearTransposeState();clearEarlyLookaheadState();buildPracticeGroups();kbDirty=true;const t=getPlaybackTime();drawNotes(t);drawKeyboard();rescheduleTransport();}
  updateEffectiveKeyLabel();persistSongConfig();
});
keyScaleSelect?.addEventListener('change',()=>{app.pitch.keyScale=keyScaleSelect.value||'major';savePref('keyScale',app.pitch.keyScale);updateEffectiveKeyLabel();persistSongConfig();});
autoDetectKeyBtn?.addEventListener('click',()=>{
  const r=detectKeyFromMidi(); const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  if(r){app.pitch.detectedTonic=r.tonic;app.pitch.detectedScale=r.scale;if(detectedKeyLabel)detectedKeyLabel.textContent=`${names[r.tonic]} ${r.scale}`;if(keyTonicSelect)keyTonicSelect.value=String(r.tonic);if(keyScaleSelect)keyScaleSelect.value=r.scale;app.pitch.keyTonic=r.tonic;app.pitch.keyScale=r.scale;savePref('keyTonic',r.tonic);savePref('keyScale',r.scale);app.pitch.originalTonicPref=r.tonic;savePref('originalTonic',r.tonic);app.pitch.originalScalePref=r.scale;savePref('originalScale',r.scale);updateEffectiveKeyLabel();persistSongConfig();}
  else if(detectedKeyLabel)detectedKeyLabel.textContent='—';
});
fallTime?.addEventListener('input',()=>{NOTE_FALL_DURATION=parseFloat(fallTime.value);fallTimeLabel.textContent=`${NOTE_FALL_DURATION.toFixed(1)}s`;savePref('fallTime',NOTE_FALL_DURATION);});

updateEffectiveKeyLabel();

// ─────────────────────────────────────────────
// WALKTHROUGH
// ─────────────────────────────────────────────
function openWalkthroughWelcome(){walkthroughWelcome?.classList.remove('hidden');}
function closeWalkthroughWelcome(){walkthroughWelcome?.classList.add('hidden');}
function getDriverSteps(){const defs=[{sel:'#uploadLabel',title:'MIDI Upload',desc:'Upload a MIDI file to start learning. Your file stays local and private.',side:'bottom',align:'start'},{sel:'#openMIDISettings',title:'MIDI & Visual Settings',desc:'Configure MIDI input/output, timing offsets, and visual preferences.',side:'bottom',align:'end'},{sel:'#openTransposeSettings',title:'Transpose & Key',desc:'Shift the song to a comfortable scale.',side:'bottom',align:'end'},{sel:'#modeSelect',title:'Practice & Guided Modes',desc:'Switch between Listen and Practice. Guided Mode teaches each section step-by-step.',side:'bottom',align:'start'},{sel:'#progress',title:'Timeline',desc:'Scrub through the song.',side:'bottom',align:'center'},{sel:'#speed',title:'Tempo',desc:'Adjust the playback tempo to slow down tricky parts.',side:'bottom',align:'start'},{sel:'#guidedToggle',title:'Guided Learning',desc:'Open the Guided panel when ready for structured stages.',side:'bottom',align:'end'},{sel:'#loopToggle',title:'Loop Practice',desc:'Enable Loop and set Start/End to focus on a section.',side:'bottom',align:'start'},{sel:'#tracksPanel',title:'Track Colors',desc:'Each instrument track is listed here. Use mute/solo.',side:'right',align:'start'},{sel:'#pianoRoll',title:'Falling Notes',desc:'These falling tiles represent notes. Press the key when they hit the line!',side:'top',align:'center'},{sel:'#dashboardLink',title:'Progress Dashboard',desc:'Open the Dashboard to review accuracy and completion.',side:'top',align:'center'}];return defs.filter(d=>document.querySelector(d.sel)).map(d=>({element:d.sel,popover:{title:d.title,description:d.desc,side:d.side,align:d.align}}));}
async function startWalkthrough(){
  let df=null;
  if(window.driver?.js&&typeof window.driver.js.driver==='function')df=window.driver.js.driver;else if(typeof window.driver==='function')df=window.driver;
  if(!df&&window._driverReady){try{await window._driverReady;}catch{}if(window.driver?.js&&typeof window.driver.js.driver==='function')df=window.driver.js.driver;else if(typeof window.driver==='function')df=window.driver;}
  if(!df){console.warn('Driver.js not loaded');return;}
  const steps=getDriverSteps();if(!steps.length){if(typeof showOverlay==='function')showOverlay('Tutorial unavailable.',1800);return;}
  const d=df({showProgress:true,allowClose:true,steps,nextBtnText:'Next',prevBtnText:'Back',doneBtnText:'Done',onDestroyed:()=>{try{localStorage.setItem('km_walkthrough_done','true');}catch{}}});
  try{d.drive();}catch{try{d.highlight(steps[0]);}catch{}}
}
function maybeAutoStartWalkthrough(){try{if(localStorage.getItem('km_walkthrough_done')!=='true')openWalkthroughWelcome();}catch{}}
walkthroughStart?.addEventListener('click',()=>{closeWalkthroughWelcome();setTimeout(startWalkthrough,200);});
walkthroughSkip?.addEventListener('click',()=>{closeWalkthroughWelcome();try{localStorage.setItem('km_walkthrough_done','true');}catch{};});
helpWalkthroughBtn?.addEventListener('click',async()=>{const ok=await openConfirmModal('Replay the walkthrough?','Replay Walkthrough');if(ok){try{localStorage.removeItem('km_walkthrough_done');localStorage.removeItem('km_walkthrough_last_step');}catch{}openWalkthroughWelcome();}});
window.addEventListener('load',()=>setTimeout(maybeAutoStartWalkthrough,400));

// ─────────────────────────────────────────────
// MISC UTILITIES
// ─────────────────────────────────────────────
function countNoteTracks(midi){try{return midi?.tracks?.filter(t=>Array.isArray(t.notes)&&t.notes.length>0).length||0;}catch{return 0;}}
function openConfirmModal(message,title='Confirm'){return new Promise(resolve=>{if(multiTrackTitle)multiTrackTitle.textContent=title;if(multiTrackText)multiTrackText.textContent=message;multiTrackModal?.classList.remove('hidden');const cleanup=()=>multiTrackModal?.classList.add('hidden');multiTrackCancel?.addEventListener('click',()=>{cleanup();resolve(false);},{once:true});multiTrackContinue?.addEventListener('click',()=>{cleanup();resolve(true);},{once:true});});}
async function shouldProceedWithMultiTrack(midi){const n=countNoteTracks(midi);if(n<=3)return true;const ok=await openConfirmModal([`This MIDI appears to have ${n} instrument tracks.`,'','For best results, use a solo piano MIDI. You can continue, but you may need to mute extra tracks.','','Continue loading this MIDI?'].join('\n'),'Multiple Instruments Detected');if(ok)showOverlay('Tip: Use the Mute/Solo buttons in the Tracks panel.',2000);return ok;}