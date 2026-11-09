import test from 'node:test';
import assert from 'node:assert/strict';
import { createMidiMix } from '../js/midi-mix.mjs';
test('channel volume and expression combine without changing note velocity',()=>{
 const mix=createMidiMix([{channel:0,controlChanges:{7:[{time:0,value:64/127}],11:[{time:1,value:32/127}]}},{channel:1,controlChanges:{7:[{time:0,value:1}]}}]);
 assert.equal(mix.gainAt(0,.5),64/127);
 assert.equal(mix.gainAt(0,2),(64*32)/(127*127));
 assert.equal(mix.gainAt(1,2),1);
 assert.equal(mix.gainAt(2,2),100/127);
});
test('mixer state can be restored after seeking in either direction',()=>{
 const mix=createMidiMix([{channel:9,controlChanges:{7:[{time:1,value:.25},{time:5,value:.75}]}}]);
 assert.equal(mix.valueAt(9,7,6),95);
 assert.equal(mix.valueAt(9,7,2),32);
 assert.equal(mix.valueAt(9,7,0),100);
 assert.equal(mix.valueAt(9,11,2),127);
});
