import { DIRECTIONS, PANELS, rotate, trace, wiring } from './patch-bay.mjs';

const byId = id => document.getElementById(id);
const board = byId('sockets');
const next = byId('next');
let stage = 0;
let sockets, buttons, moves, connected;

function render() {
  const panel = PANELS[stage];
  const { powered, live } = trace(panel, sockets);
  connected = live;
  buttons.forEach((button, i) => {
    button.dataset.powered = powered.has(i);
    button.children[0].dataset.port = sockets[i][0];
    button.children[1].dataset.port = sockets[i][1];
    const row = Math.floor(i / panel.cols) + 1, col = i % panel.cols + 1;
    const ports = sockets[i].map(d => DIRECTIONS[d]).join(' to ');
    button.setAttribute('aria-label', 'Row ' + row + ', column ' + col + ', ' + ports +
      (powered.has(i) ? ', carrying signal' : ', open'));
    button.setAttribute('aria-disabled', String(live));
  });
  const final = stage === PANELS.length - 1;
  byId('moves').textContent = moves;
  board.dataset.live = live;
  const message = live ? (final ? 'Studio live · all panels connected' : panel.name + ' connected') : 'Signal open';
  if (byId('signal').textContent !== message) byId('signal').textContent = message;
  next.hidden = !live;
  next.textContent = final ? 'Play again' : 'Next panel';
}

function terminal(name, cell, column) {
  const tag = document.createElement('span');
  tag.className = 'terminal';
  tag.textContent = name;
  tag.style.gridColumn = column;
  tag.style.gridRow = Math.floor(cell / PANELS[stage].cols) + 1;
  tag.dataset.end = name;
  return tag;
}

function openPanel(focus = false) {
  const panel = PANELS[stage];
  moves = 0;
  sockets = wiring(panel);
  byId('panel-number').textContent = 'Panel ' + (stage + 1) + ' of ' + PANELS.length;
  byId('panel-name').textContent = panel.name;
  board.style.setProperty('--cols', panel.cols);
  buttons = sockets.map((_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'socket';
    button.tabIndex = i === panel.route[0] ? 0 : -1;
    button.dataset.cell = i;
    button.style.gridColumn = i % panel.cols + 2;
    button.style.gridRow = Math.floor(i / panel.cols) + 1;
    button.innerHTML = '<i></i><i></i><b></b>';
    return button;
  });
  board.replaceChildren(terminal('IN', panel.route[0], 1), ...buttons,
    terminal('AIR', panel.route.at(-1), panel.cols + 2));
  render();
  if (focus) buttons[panel.route[0]].focus();
}

board.addEventListener('click', event => {
  const button = event.target.closest('.socket');
  if (!button || connected) return;
  rotate(sockets, Number(button.dataset.cell));
  moves++;
  render();
  if (connected) next.focus();
});
board.addEventListener('focusin', event => {
  if (event.target.matches('.socket')) buttons.forEach(b => { b.tabIndex = b === event.target ? 0 : -1; });
});
board.addEventListener('keydown', event => {
  const key = event.key;
  if (!event.target.matches('.socket') || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) return;
  event.preventDefault();
  const i = Number(event.target.dataset.cell);
  const { cols, rows } = PANELS[stage];
  const x = i % cols, y = Math.floor(i / cols);
  const col = Math.max(0, Math.min(cols - 1, x + Number(key === 'ArrowRight') - Number(key === 'ArrowLeft')));
  const row = Math.max(0, Math.min(rows - 1, y + Number(key === 'ArrowDown') - Number(key === 'ArrowUp')));
  buttons[row * cols + col].focus();
});
byId('reset').addEventListener('click', () => openPanel(true));
next.addEventListener('click', () => {
  if (!connected) return;
  stage = (stage + 1) % PANELS.length;
  openPanel(true);
});
openPanel();
