import { DIRECTIONS, PANELS, rotate, trace, wiring } from './patch-bay.mjs';
import { dailyPanels, MAX_ACTIONS, panelPoints } from './patch-score.mjs';
import { leaderboard } from './patch-ranks.mjs';

const byId = id => document.getElementById(id);
const board = byId('sockets');
const next = byId('next');
let stage = 0;
let panels = PANELS, ranked = null, history = [], banked = 0;
let panelTurns = [];
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
  startCircuit('Ranked daily circuit · ' + run.day);
});
let sockets, buttons, moves, connected;

function startCircuit(mode) {
  stage = 0;
  banked = 0;
  panelTurns = [];
  byId('results').hidden = true;
  byId('game-rack').hidden = false;
  byId('instructions').hidden = false;
  byId('board-feedback').append(byId('score-feedback'));
  byId('mode').textContent = mode;
  showPracticeBest();
  openPanel(true);
}

function finishCircuit() {
  const score = banked + panelPoints(stage, moves);
  const results = byId('panel-results');
  results.replaceChildren();
  panels.forEach((panel, index) => {
    const row = results.insertRow();
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = panel.name;
    row.append(label);
    row.insertCell().textContent = panelTurns[index];
    row.insertCell().textContent = panelPoints(index, panelTurns[index]).toLocaleString();
  });
  byId('result-total').textContent = score.toLocaleString();
  byId('result-personal').textContent = '';
  byId('replay-ranked').hidden = !ranked;
  byId('replay-practice').textContent = ranked ? 'Play practice' : 'Replay practice';
  byId('results').hidden = false;
  byId('instructions').hidden = true;
  byId('game-rack').hidden = true;
  byId('results-title').focus();
  if (ranked) {
    byId('result-feedback').append(byId('score-feedback'));
    ranks.finish(ranked, history);
  } else if (panels === PANELS) {
    practiceBest = Math.max(practiceBest, score);
    try { localStorage.setItem(practiceKey, String(practiceBest)); }
    catch { /* Keep the record in memory for this visit. */ }
    byId('practice-best').hidden = true;
    byId('result-personal').textContent = 'Practice best on this device · ' + practiceBest.toLocaleString() + ' pts';
  }
}

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
    panelTurns[stage] = moves;
    if (stage === panels.length - 1) finishCircuit();
    else next.focus();
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
  if (!connected || stage === panels.length - 1) return;
  banked += panelPoints(stage,moves);
  stage++;
  openPanel(true);
});
byId('replay-practice').addEventListener('click', () => {
  ranked = null;
  panels = PANELS;
  startCircuit('Practice circuit');
});
showPracticeBest();
openPanel();
