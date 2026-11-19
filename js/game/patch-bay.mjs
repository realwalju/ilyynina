// Ports are numbered clockwise from north. Each socket joins two ports.
export const DIRECTIONS = ['north', 'east', 'south', 'west'];
const DELTAS = [[-1,0],[0,1],[1,0],[0,-1]];

export const PANELS = [
  { name: 'Camera feed', cols: 3, rows: 3, route: [3,4,1,2,5], turns: [0,1,0,0,2,1,0,0,0] },
  { name: 'Mic check', cols: 4, rows: 3, route: [4,0,1,5,6,10,11,7], turns: [1,1,0,0,0,2,0,1,0,0,1,2] },
  { name: 'Master output', cols: 4, rows: 4, route: [8,9,5,4,0,1,2,6,10,11],
    turns: [1,1,2,0,1,2,1,0,0,1,2,1,0,0,0,0] },
];

function neighbor(panel, cell, direction) {
  const [dy, dx] = DELTAS[direction];
  const col = cell % panel.cols + dx;
  const row = Math.floor(cell / panel.cols) + dy;
  if (row < 0 || row >= panel.rows || col < 0 || col >= panel.cols) return -1;
  return row * panel.cols + col;
}

export function wiring(panel, scrambled = true) {
  const sockets = Array.from({ length: panel.cols * panel.rows }, (_, i) =>
    i % 3 === 0 ? [0, 2] : [i % 4, (i + 1) % 4]);
  panel.route.forEach((cell, index) => {
    const portTo = next => DELTAS.findIndex((_, d) => neighbor(panel, cell, d) === next);
    const input = index === 0 ? 3 : portTo(panel.route[index - 1]);
    const output = index === panel.route.length - 1 ? 1 : portTo(panel.route[index + 1]);
    sockets[cell] = [input, output];
  });
  return sockets.map((ports, i) => ports.map(port => (port + (scrambled ? panel.turns[i] : 0)) % 4));
}

export function rotate(sockets, cell) {
  sockets[cell] = sockets[cell].map(port => (port + 1) % 4);
}

export function trace(panel, sockets) {
  const powered = new Set();
  let cell = panel.route[0];
  let incoming = 3;
  while (cell >= 0 && !powered.has(cell) && sockets[cell].includes(incoming)) {
    powered.add(cell);
    const outgoing = sockets[cell].find(port => port !== incoming);
    if (cell === panel.route.at(-1) && outgoing === 1) return { powered, live: true };
    cell = neighbor(panel, cell, outgoing);
    incoming = (outgoing + 2) % 4;
  }
  return { powered, live: false };
}
