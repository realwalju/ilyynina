import assert from 'node:assert/strict';
import test from 'node:test';
import { advance, COURSE, move, newRun, score } from '../js/game/run.mjs';

test('each gate has a crystal, a pine, and a clear lane', () => {
  for (const pick of [0, .2, .4, .55, .65, .8, .999]) {
    const { gates } = newRun(() => pick);
    assert.ok(gates.length > 2);
    for (const gate of gates) {
      assert.ok(gate.at < COURSE.length);
      assert.ok([-1, 0, 1].includes(gate.tree));
      assert.ok([-1, 0, 1].includes(gate.crystal));
      assert.notEqual(gate.tree, gate.crystal);
    }
  }
});

test('ready and paused runs ignore movement and time', () => {
  const run = newRun();
  for (const phase of ['ready', 'paused']) {
    run.phase = phase;
    move(run, 1);
    advance(run, 500);
    assert.equal(run.distance, 0);
    assert.equal(run.lane, 0);
  }
  run.phase = 'riding';
  move(run, 1);
  move(run, 1);
  assert.equal(run.lane, 1);
  for (let i = 0; i < 3; i++) move(run, -1);
  assert.equal(run.lane, -1);
});

test('crossing several gates resolves each exactly once and caps the winning distance', () => {
  const run = newRun(() => 0);
  run.phase = 'riding';
  advance(run, 60);
  assert.equal(run.phase, 'finished');
  assert.equal(run.distance, COURSE.length);
  assert.equal(run.crystals, run.gates.length);
  assert.equal(run.lives, COURSE.lives);
  const final = COURSE.length + run.gates.length * COURSE.crystalPoints;
  advance(run, 60);
  assert.equal(score(run), final);
});

test('third collision ends the run at the tree and replay starts fresh', () => {
  const run = newRun(() => 0);
  run.phase = 'riding';
  move(run, -1);
  advance(run, 200);
  assert.equal(run.phase, 'crashed');
  assert.equal(run.lives, 0);
  assert.equal(run.distance, run.gates[2].at);
  const final = score(run);
  advance(run, 200);
  assert.equal(score(run), final);
  assert.equal(score(newRun()), 0);
});
