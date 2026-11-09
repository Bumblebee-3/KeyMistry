export function createMidiMix(tracks) {
  const events = [];
  for (const track of tracks) for (const controller of [7, 11]) {
    for (const cc of track.controlChanges?.[controller] || []) events.push({
      type:'mixCC', channel:track.channel ?? 0, controller,
      time:Math.max(0,cc.time || 0), value:Math.round(Math.max(0,Math.min(1,cc.value ?? 0))*127),
    });
  }
  events.sort((a,b)=>a.time-b.time);
  const lanes = new Map();
  for (const event of events) {
    const key = `${event.channel}:${event.controller}`;
    if (!lanes.has(key)) lanes.set(key,[]);
    lanes.get(key).push(event);
  }
  function valueAt(channel, controller, time) {
    const lane = lanes.get(`${channel}:${controller}`) || [];
    let lo=0,hi=lane.length;
    while(lo<hi) { const mid=(lo+hi)>>1; lane[mid].time<=time ? lo=mid+1 : hi=mid; }
    return lane[lo-1]?.value ?? (controller===7 ? 100 : 127);
  }
  return {events, valueAt, gainAt:(channel,time)=>valueAt(channel,7,time)*valueAt(channel,11,time)/(127*127)};
}
