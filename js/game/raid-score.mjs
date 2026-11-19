import { launch, newGame, STEP, step } from './pinball.mjs';

// Increment the version when changing table geometry, physics or scoring.
export const RAID_VERSION = 1;
export const MAX_RAID_TICKS = Math.round(30 * 60 / STEP);
export const MAX_RAID_GROUPS = 3072;

// Each integer stores (consecutive physics ticks * 4 + held flippers).
// Time spent paused or waiting to launch has no effect on the table.
export function createRaidRecorder() {
  const history = [];
  let ticks = 0;
  let previousMask = -1;
  let full = false;
  return {
    history,
    record(held) {
      const mask = Number(held[0]) + 2 * Number(held[1]);
      if (full || ticks === MAX_RAID_TICKS || (mask !== previousMask && history.length === MAX_RAID_GROUPS)) {
        full = true;
        return false;
      }
      ticks++;
      if (mask === previousMask) history[history.length - 1] += 4;
      else history.push(4 + mask);
      previousMask = mask;
      return true;
    }
  };
}

export function replayRaidScore(history, version = RAID_VERSION) {
  if (version !== RAID_VERSION || !Array.isArray(history) || !history.length || history.length > MAX_RAID_GROUPS) return null;
  let total = 0;
  let lastMask = -1;
  for (const group of history) {
    if (!Number.isSafeInteger(group) || group < 4 || group % 4 === lastMask) return null;
    lastMask = group % 4;
    total += Math.floor(group / 4);
    if (total > MAX_RAID_TICKS) return null;
  }

  const game = newGame();
  for (const group of history) {
    const ticks = Math.floor(group / 4);
    const mask = group % 4;
    for (let tick = 0; tick < ticks; tick++) {
      if (game.phase === 'over') return null;
      if (game.phase !== 'playing') launch(game);
      game.held[0] = Boolean(mask & 1);
      game.held[1] = Boolean(mask & 2);
      step(game);
    }
  }
  return game.phase === 'over' ? game.score : null;
}
