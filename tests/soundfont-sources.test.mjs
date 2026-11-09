import test from 'node:test';
import assert from 'node:assert/strict';
import { soundfontSources, loadSoundfontFromSources, DEFAULT_SOUNDFONT_URL } from '../js/soundfont-sources.mjs';

test('public banks have deduplicated mirrors; custom sources are not replaced', () => {
  const sources = soundfontSources('violin', 'FatBoy', 'ogg');
  assert.equal(sources.length, 3);
  assert.ok(sources.every(s => s.endsWith('/FatBoy/violin-ogg.js')));
  assert.ok(sources[0].startsWith('https://cdn.jsdelivr.net/'));
  assert.deepEqual(soundfontSources('flute','My Bank','mp3','https://example.com/{sf}/{name}-{fmt}.js'), ['https://example.com/My%20Bank/flute-mp3.js']);
  assert.equal(soundfontSources('piano','FatBoy','mp3',DEFAULT_SOUNDFONT_URL).length, 3);
});

test('failed source retries the same instrument on a mirror', async () => {
  const seen = [], instrument = {};
  const result = await loadSoundfontFromSources(['down','up'], async url => {
    seen.push(url); if(url === 'down') throw new Error('404'); return instrument;
  });
  assert.equal(result, instrument);
  assert.deepEqual(seen, ['down','up']);
});

test('timed-out downloads are cleaned up even if they finish after fallback', async () => {
  let finish, stops = 0, disconnects = 0;
  const loaded = {};
  assert.equal(await loadSoundfontFromSources(['slow','fast'], url => url === 'slow' ? new Promise(r => { finish = r; }) : loaded, 5), loaded);
  finish({stop() { stops++; }, out: {disconnect() { disconnects++; }}});
  await new Promise(r=>setTimeout(r,0));
  assert.equal(stops,1); assert.equal(disconnects,1);
});

test('complete failure reports an error rather than pretending audio is ready', async () => {
  await assert.rejects(loadSoundfontFromSources(['a','b'], () => {throw new Error('offline');}), /Soundfont unavailable: offline; offline/);
});
