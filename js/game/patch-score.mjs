import { PANELS, rotate, trace, wiring } from './patch-bay.mjs';

export const MAX_ACTIONS = 512;
export const panelPoints = (index, turns) => (index + 1) * 200 + Math.max(0, 500 - turns * 10);

// Rotate the same valid layouts differently each day. Never start with a
// completed circuit, even when an alternate route happens to line up.
export function dailyPanels(day) {
  let state = Number(day.replaceAll('-', '')) >>> 0;
  function nextTurn() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 30;
  }
  return PANELS.map(panel => {
    const result = { ...panel, turns: panel.turns.map(nextTurn) };
    if (trace(result, wiring(result)).live) {
      const entry = result.route[0];
      while (wiring(result)[entry].includes(3)) result.turns[entry] = (result.turns[entry] + 1) % 4;
    }
    return result;
  });
}

// A reset restores the layout but costs a turn and retains all prior turns.
export function replayScore(day, history) {
  if (!Array.isArray(history) || history.length !== PANELS.length) return null;
  let total = 0;
  for (const [index, panel] of dailyPanels(day).entries()) {
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
