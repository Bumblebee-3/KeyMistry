import test from 'node:test';
import assert from 'node:assert/strict';
import { sustainEvents, createSustainTimeline } from '../js/sustain.mjs';

test('CC-only tracks sustain notes on their channel without affecting other channels or drums', () => {
 const events=sustainEvents([{channel:0,controlChanges:{64:[{time:1,value:1},{time:4,value:0}]}},{channel:9,controlChanges:{64:[{time:0,value:1}]}}]);
 const timeline=createSustainTimeline(events,10);
 assert.equal(timeline.releaseTime(0,2),4);
 assert.equal(timeline.releaseTime(1,2),2);
 assert.equal(timeline.releaseTime(9,2),2);
 assert.equal(timeline.releaseTime(0,.5),.5);
 assert.equal(timeline.releaseTime(0,4),4);
 assert.equal(timeline.stateAt(0,2),127);
 assert.equal(timeline.stateAt(0,0),0);
 assert.equal(timeline.stateAt(0,4),0);
});

test('repeated pedal messages, missing release and seek backwards are deterministic', () => {
 const timeline=createSustainTimeline(sustainEvents([{channel:2,controlChanges:{64:[{time:2,value:1},{time:3,value:1},{time:5,value:0},{time:7,value:1}]}}]),10);
 assert.equal(timeline.releaseTime(2,3),5);
 assert.equal(timeline.releaseTime(2,8),10);
 assert.equal(timeline.releaseTime(2,6),6);
 assert.equal(timeline.stateAt(2,8),127);
 assert.equal(timeline.stateAt(2,6),0);
 assert.equal(timeline.stateAt(2,3),127);
});

test('sustain threshold follows encoded MIDI CC64 and muted channels are excluded', () => {
 const tracks=[{channel:0,controlChanges:{64:[{time:0,value:63/127},{time:1,value:64/127},{time:3,value:0}]}},{channel:1,controlChanges:{64:[{time:0,value:1}]}}];
 const events=sustainEvents(tracks,new Set([0]));
 assert.equal(events.length,3);
 const timeline=createSustainTimeline(events,4);
 assert.equal(timeline.releaseTime(0,.5),.5);
 assert.equal(timeline.releaseTime(0,1),3);
});
