import test from 'node:test';
import assert from 'node:assert/strict';
import { launch, newGame, pause, step } from '../js/game/pinball.mjs';
import { createRaidRecorder, MAX_RAID_GROUPS, MAX_RAID_TICKS, RAID_VERSION, replayRaidScore } from '../js/game/raid-score.mjs';

test('a completed three-ball game with flips, a pause and a raid replays to its score', () => {
  const game = newGame();
  const tape = createRaidRecorder();
  for (let tick = 0; game.phase !== 'over'; tick++) {
    if (game.phase !== 'playing') launch(game);
    if (tick === 200) {
      pause(game);
      for (let n = 0; n < 20; n++) step(game);
      game.phase = 'playing';
    }
    for (let side = 0; side < 2; side++) {
      const ball = game.ball;
      const inLane = side === 0 ? ball.x < 187 : ball.x >= 187;
      game.held[side] = !game.raids && ((inLane && ball.y > 478 && ball.vy > 10) ||
        (game.held[side] && ball.y > 460 && ball.y < 545 && game.lift[side] < 1));
    }
    assert.ok(tape.record(game.held));
    step(game);
  }
  assert.equal(game.number, 3);
  assert.equal(game.raids, 1);
  assert.ok(tape.history.length > 1);
  assert.equal(replayRaidScore(tape.history, RAID_VERSION), game.score);
});

test('version 1 accepts the published idle replay and requires the exact last tick', () => {
  assert.equal(replayRaidScore([31340], 1), 600);
  for (const history of [[31336], [31344], [31340, 5], [4, 31336], [], null,
    [2], [4.5], ['31340'], [MAX_RAID_TICKS * 4 + 4], Array(MAX_RAID_GROUPS + 1).fill(5)]) {
    assert.equal(replayRaidScore(history), null);
  }
  assert.equal(replayRaidScore([31340], 2), null);
});

test('recording coalesces inputs and stops permanently at the server limits', () => {
  const switches = createRaidRecorder();
  for (let n = 0; n < MAX_RAID_GROUPS; n++) assert.ok(switches.record([Boolean(n % 2), true]));
  assert.equal(switches.history.length, MAX_RAID_GROUPS);
  assert.equal(switches.record([false, false]), false);
  assert.equal(switches.record([true, true]), false);

  const held = createRaidRecorder();
  for (let n = 0; n < MAX_RAID_TICKS; n++) assert.ok(held.record([true, true]));
  assert.deepEqual(held.history, [MAX_RAID_TICKS * 4 + 3]);
  assert.equal(held.record([true, true]), false);
});
