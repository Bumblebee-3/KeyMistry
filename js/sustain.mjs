export function sustainEvents(tracks, activeChannels = null) {
  const events = [];
  for (const track of tracks) {
    const channel = track.channel ?? 0;
    if (channel === 9 || (activeChannels && !activeChannels.has(channel))) continue;
    for (const cc of track.controlChanges?.[64] || []) {
      events.push({type: 'cc64', time: Math.max(0, cc.time || 0), channel,
        value: Math.round(Math.max(0, Math.min(1, cc.value ?? 0)) * 127)});
    }
  }
  return events.sort((a,b) => a.time - b.time);
}

export function createSustainTimeline(events, songEnd) {
  const channels = new Map();
  for (const event of events) {
    const list = channels.get(event.channel) || [];
    list.push(event); channels.set(event.channel, list);
  }
  for (const list of channels.values()) list.sort((a,b) => a.time - b.time);
  const intervals = new Map();
  for (const [channel, list] of channels) {
    const spans = []; let down = null;
    for (const event of list) {
      if (event.value >= 64) { if (down === null) down = event.time; }
      else if (down !== null) { spans.push([down, event.time]); down = null; }
    }
    if (down !== null) spans.push([down, songEnd]);
    intervals.set(channel, spans);
  }
  return {
    releaseTime(channel, noteEnd) {
      const spans = intervals.get(channel) || [];
      let lo = 0, hi = spans.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; spans[mid][0] <= noteEnd ? lo = mid + 1 : hi = mid; }
      const span = spans[lo - 1];
      return span && noteEnd < span[1] ? span[1] : noteEnd;
    },
    stateAt(channel, time) {
      const list = channels.get(channel) || [];
      let lo = 0, hi = list.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; list[mid].time <= time ? lo = mid + 1 : hi = mid; }
      return list[lo - 1]?.value || 0;
    },
  };
}
