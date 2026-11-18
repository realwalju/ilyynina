import { advance, COURSE, move, newRun, score } from './run.mjs';
import { mountain } from './mountain.mjs';

const game = document.querySelector('#game');
const byId = id => document.getElementById(id);
const canvas = byId('slope');
const draw = mountain(canvas);
const ui = Object.fromEntries(['action', 'left', 'right', 'score', 'best', 'lives', 'distance',
  'run-status', 'run-detail', 'progress'].map(id => [id, byId(id)]));
const recordKey = 'ilyynina.switchback.best.v1';
const number = new Intl.NumberFormat('en-US');

function readBest() {
  try {
    const value = Number(localStorage.getItem(recordKey));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch { return 0; }
}
let best = readBest();
let run = newRun();
let frame = 0;
let previous = 0;

function text(el, value) {
  if (el.textContent !== value) el.textContent = value;
}
function paint() {
  draw(run);
  text(ui.distance, number.format(Math.floor(run.distance)) + ' m');
  text(ui.score, number.format(score(run)));
  text(ui.lives, String(run.lives));
  text(ui.best, best ? number.format(best) : '—');
  ui.progress.style.transform = 'scaleX(' + run.distance / COURSE.length + ')';
}
function message(title, detail) {
  text(ui['run-status'], title);
  text(ui['run-detail'], detail);
}
function controls() {
  const riding = run.phase === 'riding';
  ui.left.disabled = ui.right.disabled = !riding;
  ui.action.textContent = ({ ready: 'Start run', riding: 'Pause', paused: 'Resume' })[run.phase] || 'Ride again';
}
function finish() {
  best = Math.max(best, readBest(), score(run));
  try { localStorage.setItem(recordKey, String(best)); } catch { /* Keep the session record. */ }
  message(run.phase === 'finished' ? 'Made it to the lodge!' : 'Run over',
    number.format(score(run)) + ' points · ' + run.crystals + ' crystals collected');
  controls();
  ui.action.focus({ preventScroll: true });
}
function update(now) {
  // A delayed frame must never jump the rider past an unseen obstacle.
  const eventBefore = run.lastEvent;
  advance(run, Math.min((now - previous) / 1000, .08));
  previous = now;
  if (run.phase === 'riding') {
    if (run.lastEvent !== eventBefore) {
      message(run.lastEvent.kind === 'hit' ? 'Clipped a pine!' : 'Crystal collected!',
        run.lastEvent.kind === 'hit' ? run.lives + (run.lives === 1 ? ' life left.' : ' lives left.') : '+' + COURSE.crystalPoints + ' points');
    }
    frame = requestAnimationFrame(update);
  } else finish();
  paint();
}
function pause() {
  if (run.phase !== 'riding') return;
  cancelAnimationFrame(frame);
  run.phase = 'paused';
  controls();
  message('Paused', 'Your place on the slope is saved for this run.');
}
function activate() {
  if (run.phase === 'riding') return pause();
  if (run.phase === 'crashed' || run.phase === 'finished') run = newRun();
  run.phase = 'riding';
  controls();
  message('On the slope', 'Collect crystals and steer around the pines.');
  canvas.focus({ preventScroll: true });
  previous = performance.now();
  frame = requestAnimationFrame(update);
  paint();
}
function steer(direction) {
  move(run, direction);
  paint();
}

if (draw) {
  ui.action.disabled = false;
  ui.action.addEventListener('click', activate);
  ui.left.addEventListener('click', () => steer(-1));
  ui.right.addEventListener('click', () => steer(1));
  game.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'p' && ['paused', 'riding'].includes(run.phase)) {
      event.preventDefault();
      if (!event.repeat) activate();
    } else if (run.phase === 'riding' && ['a', 'd', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      if (!event.repeat) steer(key === 'a' || key === 'arrowleft' ? -1 : 1);
    }
  });
  game.addEventListener('focusout', event => {
    if (event.relatedTarget && !game.contains(event.relatedTarget)) pause();
  });
  window.addEventListener('blur', pause);
  window.addEventListener('pagehide', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', paint);
  window.addEventListener('storage', event => {
    if (event.key === recordKey || event.key === null) { best = readBest(); paint(); }
  });
  paint();
} else {
  message('Game graphics unavailable', 'Open this page in a browser with Canvas support to ride.');
}
