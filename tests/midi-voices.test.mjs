import test from 'node:test';
import assert from 'node:assert/strict';
import { voiceLayout, restoredVoices, createProgramSender } from '../js/midi-voices.mjs';
const tracks = [
 {channel:0,program:40,name:'Strings',notes:[{midi:60,time:0}]},
 {channel:1,program:73,name:'Flute',notes:[{midi:72,time:0}]},
 {channel:9,program:0,name:'Drums',notes:[{midi:36,time:0}]},
];
const defaults=['violin','flute','acoustic_grand_piano'];
test('voice restoration rejects old filename/track-count-only preferences',()=>{
 assert.deepEqual(restoredVoices({sfInstrumentNames:['acoustic_grand_piano','violin','flute']},tracks,defaults),defaults);
});
test('saved overrides only restore for the original track layout and never turn drums melodic',()=>{
 const config={voiceLayout:voiceLayout(tracks),sfInstrumentNames:['cello','clarinet','flute']};
 assert.deepEqual(restoredVoices(config,tracks,defaults),['cello','clarinet','acoustic_grand_piano']);
 const different=tracks.map(t=>({...t}));different[0].program=0;
 assert.deepEqual(restoredVoices(config,different,defaults),defaults);
});
test('MIDI output uses channel-specific zero-based program changes and resends after reset',()=>{
 const messages=[], sender=createProgramSender((data,time)=>messages.push({data,time}));
 sender.set(0,40,500);sender.set(1,73,500);sender.set(0,40,550);
 sender.set(0,42,600);sender.reset();sender.set(0,42,700);
 assert.deepEqual(messages,[{data:[192,40],time:500},{data:[193,73],time:500},{data:[192,42],time:600},{data:[192,42],time:700}]);
});
