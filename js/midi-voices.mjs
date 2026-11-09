// A saved voice override belongs to a specific arrangement, not just a filename
// or the number of tracks. Keep program numbers zero-based throughout.
export function voiceLayout(tracks) {
  return JSON.stringify(tracks.map(t => [t.channel, t.program, t.name,
    t.notes.length, t.notes[0]?.midi, t.notes[0]?.time,
    t.notes.at(-1)?.midi, t.notes.at(-1)?.time]));
}
export function restoredVoices(config, tracks, defaults) {
  if (config.voiceLayout !== voiceLayout(tracks) || !Array.isArray(config.sfInstrumentNames)
    || config.sfInstrumentNames.length !== tracks.length) return defaults.slice();
  return config.sfInstrumentNames.map((name, i) => tracks[i].channel === 9 ? defaults[i]
    : (typeof name === 'string' && /^[a-z0-9_]+$/.test(name) ? name : defaults[i]));
}

export function createProgramSender(send) {
  const programs = new Map();
  return {
    reset() { programs.clear(); },
    set(channel, program, timestamp) {
      if (programs.get(channel) === program) return;
      send([0xc0 | (channel & 15), Math.max(0, Math.min(127, program))], timestamp);
      programs.set(channel, program);
    },
  };
}
