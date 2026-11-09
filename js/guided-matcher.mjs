export const noteLabel = midi => `${['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][midi%12]}${Math.floor(midi/12)-1}`;

// Every physical attack can satisfy one pitch in one chord, exactly once.
// Duplicate unison notes across tracks represent one playable piano key.
export function createGuidedMatcher(groups, {start=0,end=Infinity,speed=1,windowSec=.25}={}) {
  const targets=groups.map((g,index)=>({index,time:g.time,pitches:[...new Set(g.notes)],hits:new Set()}))
    .filter(g=>g.time>=start&&g.time<end);
  const byIndex=new Map(targets.map(g=>[g.index,g]));
  const down=new Set(), timings=[], errors=new Map();
  let correct=0,extras=0,cursor=0,onTimeCount=0,absoluteTiming=0;
  const expected=targets.reduce((sum,g)=>sum+g.pitches.length,0);
  function next(ignoreBefore=-Infinity) {
    while(cursor<targets.length&&(targets[cursor].hits.size===targets[cursor].pitches.length||targets[cursor].time<ignoreBefore))cursor++;
    return targets[cursor] || null;
  }
  return {
    targets, timings,
    next,
    remaining(index) { const g=byIndex.get(index);return g ? g.pitches.filter(p=>!g.hits.has(p)) : []; },
    complete(index) { const g=byIndex.get(index);return !!g&&g.hits.size===g.pitches.length; },
    release(key) { down.delete(key); },
    releaseAll() { down.clear(); },
    press(key,pitch,time,{waitingIndex=null,rate=speed,active=true}={}) {
      if(down.has(key))return {kind:'held'};
      down.add(key);
      if(!active)return {kind:'idle'};
      const window=windowSec*rate;
      let candidates;
      if(waitingIndex!==null)candidates=[byIndex.get(waitingIndex)].filter(Boolean);
      else {
        let lo=0,hi=targets.length;
        while(lo<hi){const mid=(lo+hi)>>1;targets[mid].time<time-window?lo=mid+1:hi=mid;}
        candidates=[];
        for(let i=lo;i<targets.length&&targets[i].time<=time+window;i++)candidates.push(targets[i]);
        candidates.sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time));
      }
      const group=candidates.find(g=>g.pitches.includes(pitch)&&!g.hits.has(pitch));
      if(!group){extras++;errors.set(pitch,(errors.get(pitch)||0)+1);return {kind:'wrong',pitch};}
      group.hits.add(pitch);correct++;
      const timing=(time-group.time)/rate;
      timings.push(timing);
      if(Math.abs(timing)<=.15)onTimeCount++;
      absoluteTiming+=Math.abs(timing);
      return {kind:'hit',pitch,index:group.index,timing,complete:this.complete(group.index)};
    },
    summary(details=false) {
      const missed=expected-correct, accuracy=expected?Math.round(correct/(expected+extras)*100):0;
      const onTime=onTimeCount;
      const timingAccuracy=expected?Math.round(onTime/expected*100):0;
      const meanAbsMs=timings.length?Math.round(absoluteTiming/timings.length*1000):null;
      const weak=new Map();
      if(details)for(const g of targets)for(const pitch of g.pitches)if(!g.hits.has(pitch))weak.set(pitch,(weak.get(pitch)||0)+1);
      const weakNotes=[...weak].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p])=>noteLabel(p));
      return {expected,correct,missed,extras,accuracy,timingAccuracy,meanAbsMs,weakNotes,
        passed:expected>0&&accuracy>=90&&timingAccuracy>=80};
    },
  };
}

// MIDI timestamps and calibration are real seconds, even at slow song tempos.
export function guidedEventTime({songTime,receivedAt,now,waitClock=null,rate=1,offset=0}) {
  const base=waitClock ? waitClock.song+(receivedAt-waitClock.wall)/1000*rate
    : songTime+(receivedAt-now)/1000*rate;
  return base+offset*rate;
}

export function defaultHandRoles(tracks) {
  const melodic=tracks.map((track,index)=>({track,index})).filter(({track})=>track.channel!==9);
  const piano=melodic.filter(({track})=>track.program>=0&&track.program<8);
  const targets=piano.length ? piano.slice(0,2) : melodic.slice(0,1);
  const roles=tracks.map(()=>'background');
  targets.forEach(({index},i)=>{roles[index]=i===0?'left':'right';});
  return roles;
}

export function chordName(pitches) {
  const notes=[...new Set(pitches)].sort((a,b)=>a-b);
  if(notes.length<2)return 'Single note';
  if(notes.length===2) {
    const distance=notes[1]-notes[0];
    if(distance===12)return 'Octave';
    if(distance<12)return ['Unison','Minor second','Major second','Minor third','Major third','Perfect fourth','Tritone','Perfect fifth','Minor sixth','Major sixth','Minor seventh','Major seventh'][distance];
  }
  const pcs=[...new Set(notes.map(n=>n%12))];
  const patterns=[['Major',[0,4,7]],['Minor',[0,3,7]],['Diminished',[0,3,6]],['Suspended second',[0,2,7]],['Suspended fourth',[0,5,7]],['Dominant seventh',[0,4,7,10]],['Major seventh',[0,4,7,11]],['Minor seventh',[0,3,7,10]]];
  for(const root of pcs)for(const [name,pattern] of patterns) {
    if(pcs.length===pattern.length&&pattern.every(interval=>pcs.includes((root+interval)%12))) {
      const rootName=noteLabel(root+60).replace(/\d+$/,'');
      return `${rootName} ${name.toLowerCase()}${notes[0]%12!==root?' inversion':''}`;
    }
  }
  return `${notes.length}-note chord`;
}
