// Index note intervals once, then visit only intervals intersecting the visible
// window. A max-end tree keeps long held notes visible without scanning history.
export function createNoteIndex(notes, groupTimes = new Map()) {
  const entries = notes.map(note => ({ note, start: groupTimes.get(note.id) ?? note.time,
    end: note.time + note.duration })).sort((a, b) => a.start - b.start);
  let size = 1;
  while (size < entries.length) size *= 2;
  const maxEnd = new Float64Array(size * 2).fill(-Infinity);
  for (let i = 0; i < entries.length; i++) maxEnd[size + i] = entries[i].end;
  for (let i = size - 1; i; i--) maxEnd[i] = Math.max(maxEnd[i * 2], maxEnd[i * 2 + 1]);
  const visible = [];
  function visit(node, lo, hi, time, until) {
    if (lo >= entries.length || maxEnd[node] <= time || entries[lo].start > until) return;
    if (hi - lo === 1) { visible.push(entries[lo].note); return; }
    const mid = (lo + hi) >> 1;
    visit(node * 2, lo, mid, time, until);
    visit(node * 2 + 1, mid, hi, time, until);
  }
  return {
    query(time, until) {
      visible.length = 0;
      visit(1, 0, size, time, until);
      return visible;
    },
  };
}

// A bank/instrument is decoded once even when several tracks request it at once.
// Failed loads may be retried; clearing invalidates in-flight loads as well.
export function createInstrumentPool() {
  const loaded = new Map(), pending = new Map();
  let generation = 0;
  return {
    peek: key => loaded.get(key),
    load(key, loader) {
      if (loaded.has(key)) return Promise.resolve(loaded.get(key));
      if (pending.has(key)) return pending.get(key);
      const token = generation;
      const promise = Promise.resolve().then(loader).then(instrument => {
        if (token !== generation) {
          instrument.stop?.();
          instrument.out?.disconnect();
          throw new Error('Instrument load cancelled');
        }
        loaded.set(key, instrument);
        return instrument;
      }).finally(() => {
        if (pending.get(key) === promise) pending.delete(key);
      });
      pending.set(key, promise);
      return promise;
    },
    stop() { for (const instrument of loaded.values()) instrument.stop?.(); },
    clear() {
      generation++;
      this.stop();
      for (const instrument of loaded.values()) instrument.out?.disconnect();
      loaded.clear(); pending.clear();
    },
  };
}
