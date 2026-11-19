import { DIRECTIONS, PANELS, rotate, trace, wiring } from './patch-bay.mjs';
import { dailyPanels, MAX_ACTIONS, panelPoints } from './patch-score.mjs';
import { leaderboard } from './patch-ranks.mjs';

const byId = id => document.getElementById(id);
const board = byId('sockets');
const next = byId('next');
let stage = 0;
let panels = PANELS, ranked = null, history = [], banked = 0;
const practiceKey = 'ilyynina.patch.practice-best.v1';
let practiceBest = 0;
try { practiceBest = Number(localStorage.getItem(practiceKey)) || 0; }
catch { /* Practice works with storage disabled. */ }

function showPracticeBest() {
  const label = byId('practice-best');
  label.hidden = Boolean(ranked) || practiceBest <= 0;
  label.textContent = 'Practice best on this device · ' + practiceBest.toLocaleString() + ' pts';
}

const ranks = leaderboard(run => {
  ranked = run;
  panels = dailyPanels(run.day);
  history = panels.map(() => []);
  stage = 0;
  banked = 0;
  byId('mode').textContent = 'Ranked daily circuit · '+run.day;
  showPracticeBest();
  openPanel(true);
});
let sockets, buttons, moves, connected;

function render() {
  const panel = panels[stage];
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
  const final = stage === panels.length - 1;
  byId('moves').textContent = moves;
  const earned = live ? panelPoints(stage,moves) : 0;
  byId('points').textContent = (banked + earned).toLocaleString();
  byId('reset').disabled = live;
  board.dataset.live = live;
  const message = live ? (final ? 'Studio live' : panel.name + ' connected') + ' · +' + earned + ' pts'
    : 'Panel value · ' + panelPoints(stage,moves) + ' pts';
  if (byId('signal').textContent !== message) byId('signal').textContent = message;
  next.hidden = !live;
  next.textContent = final ? (ranked ? 'View standings' : 'Play again') : 'Next panel';
}

function terminal(name, cell, column) {
  const tag = document.createElement('span');
  tag.className = 'terminal';
  tag.textContent = name;
  tag.style.gridColumn = column;
  tag.style.gridRow = Math.floor(cell / panels[stage].cols) + 1;
  tag.dataset.end = name;
  return tag;
}

function openPanel(focus = false, spent = 0) {
  const panel = panels[stage];
  moves = spent;
  sockets = wiring(panel);
  byId('panel-number').textContent = 'Panel ' + (stage + 1) + ' of ' + panels.length;
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

function logAction(cell) {
  if (!ranked) return;
  if (history[stage].length === MAX_ACTIONS) {
    ranked = null;
    byId('mode').textContent = 'Practice · ranked turn limit reached';
    ranks.abandon();
  } else history[stage].push(cell);
}

board.addEventListener('click', event => {
  const button = event.target.closest('.socket');
  if (!button || connected) return;
  const cell = Number(button.dataset.cell);
  logAction(cell);
  rotate(sockets, cell);
  moves++;
  render();
  if (connected) {
    next.focus();
    if (stage === panels.length - 1) {
      if (ranked) ranks.finish(ranked, history);
      else if (panels === PANELS) {
        practiceBest = Math.max(practiceBest, banked + panelPoints(stage,moves));
        try { localStorage.setItem(practiceKey, String(practiceBest)); }
        catch { /* Keep the record in memory for this visit. */ }
        showPracticeBest();
      }
    }
  }
});
board.addEventListener('focusin', event => {
  if (event.target.matches('.socket')) buttons.forEach(b => { b.tabIndex = b === event.target ? 0 : -1; });
});
board.addEventListener('keydown', event => {
  const key = event.key;
  if (!event.target.matches('.socket') || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) return;
  event.preventDefault();
  const i = Number(event.target.dataset.cell);
  const { cols, rows } = panels[stage];
  const x = i % cols, y = Math.floor(i / cols);
  const col = Math.max(0, Math.min(cols - 1, x + Number(key === 'ArrowRight') - Number(key === 'ArrowLeft')));
  const row = Math.max(0, Math.min(rows - 1, y + Number(key === 'ArrowDown') - Number(key === 'ArrowUp')));
  buttons[row * cols + col].focus();
});
byId('reset').addEventListener('click', () => {
  if (connected) return;
  logAction(-1);
  openPanel(true, moves+1);
});
next.addEventListener('click', () => {
  if (!connected) return;
  const viewStandings = ranked && stage === panels.length - 1;
  banked += panelPoints(stage,moves);
  stage = (stage + 1) % panels.length;
  if (!stage) {
    ranked = null;
    panels = PANELS;
    banked = 0;
    byId('mode').textContent = 'Practice circuit';
    showPracticeBest();
  }
  openPanel(!viewStandings);
  if (viewStandings) byId('standings-title').focus();
});
showPracticeBest();
openPanel();
