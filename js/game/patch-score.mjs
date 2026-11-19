import { PANELS, rotate, trace, wiring } from './patch-bay.mjs';
import { selectRoutes } from './patch-library-v2.mjs';

export const MAX_ACTIONS = 512;
export const CIRCUIT_VERSION = 2;
const pointsPerTurn = 10;
const bonusTurns = 50;
export const panelPoints = (index, turns) => (index + 1) * 200 + Math.max(0, bonusTurns - turns) * pointsPerTurn;

export function rankTarget({score, nextPlace}, turns) {
  if (!nextPlace) return '';
  const gap = nextPlace.score - score;
  const place = '#' + nextPlace.rank;
  if (turns.some(count => count > bonusTurns)) {
    return 'Earn ' + gap.toLocaleString() + ' more points than this run to tie ' + place + '.';
  }
  const savings = gap / pointsPerTurn;
  return 'Save ' + savings + (savings === 1 ? ' turn' : ' turns') + ' on this run to tie ' + place + '.';
}

// Version 1 is the original practice-route catalog and its original scramble.
// Keep older versions playable for signed runs and interrupted submissions.
export function dailyPanels(day, version = CIRCUIT_VERSION) {
  if (version !== 1 && version !== 2) throw new RangeError('Unknown circuit version');
  const layouts = version === 1 ? PANELS : selectRoutes(day);
  let state = Number(day.replaceAll('-', '')) >>> 0;
  function nextTurn() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 30;
  }
  return layouts.map((panel, index) => {
    const result = { ...panel, turns: Array.from({length:panel.cols * panel.rows}, nextTurn) };
    if (version === 2 && index === 0) {
      // Leave a working lead at the camera input, and a visible break at AIR.
      result.turns[panel.route[0]] = 0;
      result.turns[panel.route[1]] = 0;
      const end = panel.route.at(-1);
      while (wiring(result)[end].includes(1)) result.turns[end] = (result.turns[end] + 1) % 4;
    }
    if (trace(result, wiring(result)).live) {
      const entry = result.route[0];
      while (wiring(result)[entry].includes(3)) result.turns[entry] = (result.turns[entry] + 1) % 4;
    }
    return result;
  });
}

// A reset restores the layout but costs a turn and retains all prior turns.
export function replayScore(day, history, version = CIRCUIT_VERSION) {
  if (version !== 1 && version !== 2) return null;
  if (!Array.isArray(history) || history.length !== PANELS.length) return null;
  let total = 0;
  for (const [index, panel] of dailyPanels(day, version).entries()) {
    const actions = history[index];
    if (!Array.isArray(actions) || !actions.length || actions.length > MAX_ACTIONS) return null;
    let sockets = wiring(panel);
    let live = false;
    for (const cell of actions) {
      if (live || !Number.isInteger(cell) || cell < -1 || cell >= sockets.length) return null;
      if (cell === -1) sockets = wiring(panel);
      else rotate(sockets, cell);
      live = trace(panel, sockets).live;
    }
    if (!live) return null;
    total += panelPoints(index, actions.length);
  }
  return total;
}
