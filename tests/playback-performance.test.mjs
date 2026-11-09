import test from 'node:test';
import assert from 'node:assert/strict';
import { createNoteIndex, createInstrumentPool } from '../js/playback-performance.mjs';

test('visible notes match a full scan across seeks, grouped chords and long notes', () => {
  let seed = 7;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const notes = Array.from({ length: 10000 }, (_, id) => ({ id, time: random() * 600, duration: random() * 10 }));
  notes.push({ id: 'held', time: 0, duration: 700 });
  const groups = new Map(notes.filter((_, i) => i % 3 === 0).map(n => [n.id, n.time - 0.06]));
  const index = createNoteIndex(notes, groups);
  for (const time of [0, 599, 20, -2, 500, 10, 701, ...Array.from({ length: 100 }, () => random() * 700)]) {
    const expected = notes.filter(n => n.time + n.duration > time && (groups.get(n.id) ?? n.time) <= time + 3.03);
    assert.deepEqual(new Set(index.query(time, time + 3.03)), new Set(expected));
  }
  assert.deepEqual(createNoteIndex([]).query(0, 3), []);
});

test('exact window boundaries and reused query results do not leave stale notes', () => {
  const a = { time: 3, duration: 1 }, b = { time: 0, duration: 1 };
  const index = createNoteIndex([a, b]);
  assert.deepEqual(index.query(1, 3), [a]);
  assert.deepEqual(index.query(5, 8), []);
  assert.deepEqual(index.query(0, 0), [b]);
});

test('concurrent tracks share one instrument load and cached instance', async () => {
  const pool = createInstrumentPool();
  let loads = 0, stops = 0;
  const instrument = { stop() { stops++; } };
  const loader = async () => { loads++; return instrument; };
  const instances = await Promise.all(Array.from({ length: 16 }, () => pool.load('piano', loader)));
  assert.equal(loads, 1);
  assert.ok(instances.every(i => i === instrument));
  assert.equal(pool.peek('piano'), instrument);
  pool.stop(); assert.equal(stops, 1);
  pool.clear(); assert.equal(pool.peek('piano'), undefined);
});

test('failed downloads can retry and replaced songs cannot restore stale loads', async () => {
  const pool = createInstrumentPool();
  await assert.rejects(pool.load('piano', () => Promise.reject(new Error('network'))));
  let resolve, stops = 0;
  const old = pool.load('piano', () => new Promise(r => { resolve = r; }));
  await Promise.resolve();
  pool.clear();
  const fresh = { stop() {} };
  assert.equal(await pool.load('piano', () => fresh), fresh);
  resolve({ stop() { stops++; } });
  await assert.rejects(old, /cancelled/);
  assert.equal(pool.peek('piano'), fresh);
  assert.equal(stops, 1);
});

test('different instruments stay independent and releasing a song disconnects each output', async () => {
  const pool = createInstrumentPool();
  const stopped = [], disconnected = [];
  for (const name of ['piano', 'violin', 'flute']) {
    await pool.load(name, () => ({ stop() { stopped.push(name); }, out: { disconnect() { disconnected.push(name); } } }));
  }
  pool.clear();
  assert.deepEqual(stopped, ['piano', 'violin', 'flute']);
  assert.deepEqual(disconnected, stopped);
});
