import test from 'node:test';
import assert from 'node:assert/strict';
import { playbackNote, loadDrumKit } from '../js/drum-kit.mjs';

test('transposing a song never changes General MIDI drum identities', () => {
 for(let midi=35;midi<=81;midi++) {
  assert.equal(playbackNote({channel:9,midi},12),midi);
  assert.equal(playbackNote({channel:0,midi},12),midi+12);
 }
});

test('drums use one-shot samples, choke open hats, and clean up voices', async () => {
 const sources=[],requests=[];
 const context={currentTime:10,destination:{},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},
  async decodeAudioData(){return {duration:2};},createBufferSource(){
   const node={stops:[],connect(){},disconnect(){},start(t){this.started=t;},stop(t){this.stops.push(t);}};sources.push(node);return node;
  }};
 const kit=await loadDrumKit(context,[36,38,42,46,46],async url=>{requests.push(url);return {ok:true,text:async()=>"file:'AAAA'"};});
 assert.equal(requests.length,4);
 assert.equal(kit.out.gain.value,0.28);
 kit.play(46,11,{gain:.6,duration:.01});
 assert.equal(sources[0].started,11);assert.deepEqual(sources[0].stops,[]);
 kit.play(42,12,{gain:.8});assert.deepEqual(sources[0].stops,[12]);
 assert.equal(kit.play(20),null);
 sources[0].onended();kit.stop();assert.equal(sources[0].stops.length,1);
 assert.equal(sources[1].stops.length,1);
});
