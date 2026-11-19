import assert from 'node:assert/strict';
import test from 'node:test';
import { PANELS, rotate, trace, wiring } from '../js/game/patch-bay.mjs';

for (const panel of PANELS) {
  test(panel.name + ' starts disconnected and can be solved by rotating sockets', () => {
    const sockets = wiring(panel);
    assert.equal(panel.route[0] % panel.cols, 0);
    assert.equal(panel.route.at(-1) % panel.cols, panel.cols - 1);
    assert.equal(trace(panel, sockets).live, false);
    panel.turns.forEach((turns, i) => {
      for (let n = 0; n < (4 - turns) % 4; n++) rotate(sockets, i);
    });
    const signal = trace(panel, sockets);
    assert.equal(signal.live, true);
    assert.deepEqual([...signal.powered], panel.route);
    assert.deepEqual(sockets, wiring(panel, false));
  });
}

test('a wire heading off an edge cannot wrap around to the next row', () => {
  const panel = { rows: 2, cols: 2, route: [0, 3] };
  const sockets = [[3,1], [3,1], [3,1], [3,1]];
  const signal = trace(panel, sockets);
  assert.equal(signal.live, false);
  assert.deepEqual([...signal.powered], [0,1]);
});
