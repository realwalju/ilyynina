import { DIRECTIONS, PANELS, rotate, trace, wiring } from './patch-bay.mjs';
import { dailyPanels, MAX_ACTIONS, panelPoints } from './patch-score.mjs';
import { leaderboard } from './patch-ranks.mjs';
import { studioMonitor } from './studio-monitor.mjs';

const byId = id => document.getElementById(id);
const board = byId('sockets');
const next = byId('next');
const setMonitor = studioMonitor(byId('studio-screen'), byId('studio-sound'));
const systemNames = ['Camera', 'Microphone', 'Transmitter'];
const systemStates = ['Standby', 'Camera online', 'Mic online', 'On air'];
let stage = 0;
let panels = PANELS, ranked = null, history = [], banked = 0;
let panelTurns = [];
let guided = true, targetPorts, guestDay = null, systems = -1;
const practiceKey = 'ilyynina.patch.practice-best.v1';
let practiceBest = 0;
try { practiceBest = Number(localStorage.getItem(practiceKey)) || 0; }
catch { /* Practice works with storage disabled. */ }

function showPracticeBest() {
  const label = byId('practice-best');
  label.hidden = panels !== PANELS || practiceBest <= 0;
  label.textContent = 'Practice best on this device · ' + practiceBest.toLocaleString() + ' pts';
}

const ranks = leaderboard(run => {
  ranked = run;
  guestDay = null;
  panels = dailyPanels(run.day, run.version ?? 1);
  history = panels.map(() => []);
  startCircuit('Ranked daily circuit · ' + run.day);
}, (day, version) => {
  ranked = null;
  guestDay = day;
  panels = dailyPanels(day, version);
  startCircuit('Daily practice · ' + day);
});
let sockets, buttons, moves, connected;

function startCircuit(mode) {
  stage = 0;
  banked = 0;
  panelTurns = [];
  guided = panels === PANELS;
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
  byId('replay-practice').textContent = guestDay ? 'Replay daily practice' : ranked ? 'Play practice' : 'Replay practice';
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
  } else if (guestDay) {
    byId('result-personal').textContent = 'Daily practice complete. Sign in with Twitch to play for a rank.';
  }
}

function updateStudio(count) {
  if (count === systems) return;
  systems = count;
  setMonitor(count);
  byId('studio-monitor').dataset.systems = count;
  byId('monitor-state').textContent = systemStates[count];
  const track = byId('mission-progress');
  track.setAttribute('aria-label', count + ' of 3 systems online');
  [...track.children].forEach((step, i) => {
    step.dataset.state = i < count ? 'online' : i === count ? 'current' : 'waiting';
    step.setAttribute('aria-label', systemNames[i] + (i < count ? ' online' : ' offline'));
  });
}

function render() {
  const panel = panels[stage];
  const { powered, live } = trace(panel, sockets);
  connected = live;
  updateStudio(stage + Number(live));
  const guideCell = guided && !live ? panel.route.find(cell =>
    !targetPorts[cell].every(port => sockets[cell].includes(port))) : undefined;
  byId('guide-toggle').hidden = Boolean(ranked) || live;
  byId('guide-toggle').textContent = guided ? 'Hide guide' : 'Show guide';
  byId('guide-toggle').setAttribute('aria-pressed', String(guided));
  buttons.forEach((button, i) => {
    button.dataset.powered = powered.has(i);
    button.dataset.guide = i === guideCell;
    const cable = button.firstElementChild;
    cable.children[0].dataset.port = sockets[i][0];
    cable.children[1].dataset.port = sockets[i][1];
    const row = Math.floor(i / panel.cols) + 1, col = i % panel.cols + 1;
    const ports = sockets[i].map(d => DIRECTIONS[d]).join(' to ');
    button.setAttribute('aria-label', 'Row ' + row + ', column ' + col + ', ' + ports +
      (powered.has(i) ? ', carrying signal' : ', open') + (i === guideCell ? ', guide recommends turning this tile' : ''));
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
  let coaching = 'Follow the lit cable from IN. Turn a tile to join the next two ends.';
  if (live) coaching = systemNames[stage] + ' online. ' + (stage === 0 ? 'Next, connect the microphone.' : 'Next, send the show on air.');
  else if (guideCell !== undefined) {
    const row = Math.floor(guideCell / panel.cols) + 1, col = guideCell % panel.cols + 1;
    const turns = [1, 2, 3].find(count => sockets[guideCell].every(port =>
      targetPorts[guideCell].includes((port + count) % 4)));
    const instruction = ['','once','twice','three times'][turns];
    coaching = 'Turn the marked tile ' + instruction + ' to line up the cable (row ' + row + ', column ' + col + ').';
  }
  if (byId('coach').textContent !== coaching) byId('coach').textContent = coaching;
  next.hidden = !live || final;
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
  targetPorts = wiring(panel, false);
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
    button.innerHTML = '<span class="cable"><i></i><i></i><b></b></span>';
    return button;
  });
  board.replaceChildren(terminal('IN', panel.route[0], 1), ...buttons,
    terminal('OUT', panel.route.at(-1), panel.cols + 2));
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
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    button.firstElementChild.animate([{transform:'rotate(-90deg)'}, {transform:'rotate(0deg)'}], {duration:150,easing:'ease-out'});
  }
  if (connected) {
    panelTurns[stage] = moves;
    if (stage === panels.length - 1) finishCircuit();
    else next.focus();
  }
});
byId('guide-toggle').addEventListener('click', () => {
  if (ranked || connected) return;
  guided = !guided;
  render();
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
  guided = false;
  openPanel(true);
});
byId('replay-practice').addEventListener('click', () => {
  if (guestDay) {
    byId('daily-practice').click();
    return;
  }
  ranked = null;
  guestDay = null;
  panels = PANELS;
  startCircuit('Practice circuit');
});
showPracticeBest();
openPanel();
