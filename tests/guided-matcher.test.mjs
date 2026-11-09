import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuidedMatcher,noteLabel,guidedEventTime,defaultHandRoles,chordName} from '../js/guided-matcher.mjs';
const groups=[{time:1,notes:[60,64]},{time:1.2,notes:[60]},{time:3,notes:[67]}];
test('one attack credits one chord; a held key cannot satisfy repeated notes',()=>{
 const m=createGuidedMatcher(groups);
 assert.equal(m.press('0:60',60,1).index,0);
 assert.equal(m.press('0:60',60,1.2).kind,'held');
 assert.equal(m.summary().correct,1);
 m.release('0:60');assert.equal(m.press('0:60',60,1.2).index,1);
 assert.equal(m.summary().correct,2);
});
test('a completed chord requires all distinct pitches, and duplicated unisons count as one piano key',()=>{
 const m=createGuidedMatcher([{time:0,notes:[60,60,64]}]);
 m.press('0:60',60,0);assert.equal(m.complete(0),false);
 assert.deepEqual(m.remaining(0),[64]);
 m.press('0:64',64,0);assert.equal(m.complete(0),true);assert.equal(m.summary().expected,2);
});
test('early presses cannot pre-credit distant notes or every occurrence of a pitch',()=>{
 const m=createGuidedMatcher(groups);
 assert.equal(m.press('0:67',67,1).kind,'wrong');
 assert.equal(m.summary().correct,0);assert.equal(m.summary().extras,1);
});
test('exact pitches and octaves are required, including transposed targets',()=>{
 const m=createGuidedMatcher([{time:0,notes:[62]}]);
 assert.equal(m.press('0:60',60,0).kind,'wrong');
 assert.equal(m.press('0:74',74,0).kind,'wrong');
 assert.equal(m.press('0:62',62,0).kind,'hit');
 assert.equal(m.summary().accuracy,33);
});
test('waiting locks matching to the current chord and records real hesitation',()=>{
 const m=createGuidedMatcher(groups);
 m.press('0:60',60,4,{waitingIndex:0});
 m.press('0:64',64,4,{waitingIndex:0});
 assert.equal(m.summary().correct,2);assert.equal(m.complete(1),false);
 assert.equal(m.summary().timingAccuracy,0);assert.ok(m.summary().meanAbsMs>=3000);
});
test('misses and extra keys reduce accuracy; opposing timing errors do not cancel',()=>{
 const m=createGuidedMatcher([{time:1,notes:[60]},{time:2,notes:[62]}]);
 m.press('0:60',60,.9);m.press('0:62',62,2.1);
 assert.equal(m.summary().meanAbsMs,100);assert.equal(m.summary().passed,true);
 m.press('0:70',70,2.1);assert.equal(m.summary().accuracy,67);assert.equal(m.summary().passed,false);
});
test('slow practice uses real-time timing windows rather than rewarding late hits',()=>{
 const m=createGuidedMatcher([{time:1,notes:[60]}]);
 const hit=m.press('0:60',60,1.1,{rate:.5});
 assert.equal(hit.kind,'hit');assert.ok(Math.abs(hit.timing-.2)<1e-6);
 assert.equal(m.summary().timingAccuracy,0);
});
test('focused scope excludes notes outside the selected section',()=>{
 const m=createGuidedMatcher(groups,{start:1.1,end:3});
 assert.equal(m.summary().expected,1);assert.equal(m.next().index,1);
 assert.equal(m.press('0:67',67,3).kind,'wrong');
});
test('unplayed notes are reported with useful names; empty runs cannot pass',()=>{
 const m=createGuidedMatcher(groups);assert.equal(m.summary().missed,4);
 assert.ok(m.summary(true).weakNotes.includes('C4'));assert.equal(noteLabel(61),'C♯4');
 assert.equal(createGuidedMatcher([]).summary().passed,false);
});
test('idle input does not change scores and must be released before a scored attack',()=>{
 const m=createGuidedMatcher(groups);
 assert.equal(m.press('0:60',60,1,{active:false}).kind,'idle');
 assert.equal(m.press('0:60',60,1).kind,'held');
 m.release('0:60');assert.equal(m.press('0:60',60,1).kind,'hit');
});


test('rhythm preview moves past missed notes without deleting them from the score',()=>{
 const m=createGuidedMatcher(groups);
 assert.equal(m.next(1.5).index,2);
 assert.equal(m.summary().missed,4);
 m.press('0:67',67,3);assert.equal(m.summary().correct,1);
 assert.equal(m.summary().missed,3);
});
test('event time preserves MIDI timestamps, paused hesitation and real-time calibration at slow tempo',()=>{
 assert.equal(guidedEventTime({songTime:5,receivedAt:900,now:1000,rate:.5}),4.95);
 assert.equal(guidedEventTime({songTime:5,receivedAt:900,now:1000,rate:.5,offset:.1}),5);
 assert.equal(guidedEventTime({songTime:5,receivedAt:1400,now:1500,waitClock:{wall:1000,song:1},rate:.5}),1.2);
});
test('reconnecting a keyboard clears held-key state without discarding scored notes',()=>{
 const m=createGuidedMatcher(groups);m.press('0:60',60,1);m.releaseAll();
 assert.equal(m.press('0:60',60,1.2).index,1);assert.equal(m.summary().correct,2);
});


test('full arrangements default to piano learning tracks, with drums and accompaniment excluded',()=>{
 assert.deepEqual(defaultHandRoles([{channel:9,program:0},{channel:1,program:40},{channel:2,program:0},{channel:3,program:4},{channel:4,program:32}]),['background','background','left','right','background']);
 assert.deepEqual(defaultHandRoles([{channel:0,program:40},{channel:1,program:73}]),['left','background']);
});


test('lesson prompts explain common chords and intervals without guessing unknown harmonies',()=>{
 assert.equal(chordName([60,64,67]),'C major');
 assert.equal(chordName([64,67,72]),'C major inversion');
 assert.equal(chordName([60,63,67]),'C minor');
 assert.equal(chordName([60,72]),'Octave');
 assert.equal(chordName([60,67]),'Perfect fifth');
 assert.equal(chordName([60,61,62]),'3-note chord');
});
