// General MIDI percussion: channel 10 (zero-based 9), notes 35–81.
// Chaos GM samples hosted by the WebAudioFont project (see README credits).
export function playbackNote(note, transpose = 0) {
  return note.channel === 9 ? note.midi : Math.max(0, Math.min(127, Math.round(note.midi + transpose)));
}
export async function loadDrumKit(context, notes, fetchFile = fetch) {
  const buffers = new Map(), active = new Set();
  const out = context.createGain();
  out.gain.value = 0.28; // About -11 dB: balance the close-miked kit against melodic banks.
  out.connect(context.destination);
  const pitches = [...new Set(notes)].filter(n => n >= 35 && n <= 81);
  try {
    for (let i = 0; i < pitches.length; i += 4) await Promise.all(pitches.slice(i, i + 4).map(async pitch => {
      const file = `128${pitch}_0_Chaos_sf2_file.js`;
      let lastError;
      for (const base of ['https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/', 'https://raw.githubusercontent.com/surikov/webaudiofontdata/master/sound/']) {
        try {
          const response = await fetchFile(base + file, {signal: AbortSignal.timeout(20000)});
          if (!response.ok) throw new Error(`Drum sample ${pitch}: HTTP ${response.status}`);
          // Extract encoded audio only; never evaluate downloaded JavaScript.
          const match = (await response.text()).match(/\bfile\s*:\s*'([A-Za-z0-9+/=]+)'/);
          if (!match) throw new Error(`Invalid drum sample ${pitch}`);
          const bytes = Uint8Array.from(atob(match[1]), c => c.charCodeAt(0));
          buffers.set(pitch, await context.decodeAudioData(bytes.buffer));
          return;
        } catch (error) { lastError = error; }
      }
      throw lastError;
    }));
  } catch (error) { out.disconnect(); throw error; }
  return {
    out, buffers,
    play(pitch, when = context.currentTime, {gain = 1, destination = out} = {}) {
      const buffer = buffers.get(pitch);
      if (!buffer) return null;
      when = Math.max(when, context.currentTime);
      // Closed/pedal hats choke an open hat at the scheduled hit time.
      if (pitch === 42 || pitch === 44) for (const voice of active) {
        if (voice.pitch === 46) voice.source.stop(when);
      }
      const source = context.createBufferSource(), level = context.createGain();
      source.buffer = buffer; level.gain.value = Math.max(0, Math.min(1, gain)) * (destination === out ? 1 : 0.28);
      source.connect(level); level.connect(destination);
      const voice = {pitch, source}; active.add(voice);
      source.onended = () => { active.delete(voice); source.disconnect(); level.disconnect(); };
      source.start(when); // One-shot drums decay naturally, independent of MIDI note-off.
      return source;
    },
    stop() { for (const voice of active) voice.source.stop(); active.clear(); },
  };
}
