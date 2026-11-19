import { BALLS, BUMPERS } from './table.mjs';
import { launch, newGame, pause, STEP, step } from './pinball.mjs';
import { playfield } from './playfield.mjs';
import { createRaidRecorder } from './raid-score.mjs';
import { raidLeaderboard } from './raid-ranks.mjs';

const byId = id => document.getElementById(id);
const cabinet = byId('game');
const canvas = byId('playfield');
const draw = playfield(canvas);
const controls = [byId('left'),byId('right')];
const action = byId('action');
const sound = byId('sound');
const mode = byId('play-mode');
const lamps = [...document.querySelectorAll('[data-lamp]')];
const ui = Object.fromEntries(['score','ball-number','message','best','raids'].map(id => [id,byId(id)]));
const recordKey = 'ilyynina.raid-relay.best.v1';
const number = new Intl.NumberFormat('en-US');
let game = newGame();
let best = savedBest();
let previous = 0, remainder = 0, frame = 0;
let audio;
let ranked = null;
const sources = [new Set(),new Set()];
const ranks = raidLeaderboard(startRanked);

function savedBest() {
  try {
    const n = Number(localStorage.getItem(recordKey));
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch { return 0; }
}
function saveScore() {
  best = Math.max(best,savedBest(),game.score);
  try { localStorage.setItem(recordKey,String(best)); } catch { /* Keep the session record. */ }
}
function text(el,value) {
  if (el.textContent !== value) el.textContent = value;
}
function paint() {
  draw(game);
  text(mode, ranked ? 'Ranked · ' + ranked.run.day : 'Practice');
  text(ui.score,String(game.score).padStart(6,'0'));
  text(ui['ball-number'],game.number+' / '+BALLS);
  text(ui.best,best ? number.format(best) : '—');
  text(ui.raids,String(game.raids));
  lamps.forEach((lamp,i)=>{
    const lit = Boolean(game.lit & (1 << i));
    lamp.classList.toggle('is-lit',lit);
    lamp.setAttribute('aria-label',BUMPERS[i].label + (lit ? ' lit' : ' unlit'));
  });
  controls.forEach((button,i)=>{
    button.disabled = game.phase !== 'playing';
    button.classList.toggle('is-held',game.held[i]);
  });
  text(action,({ ready:'Launch ball', playing:'Pause', paused:'Resume', serve:'Launch ball', over:ranked ? 'Play practice' : 'Play again' })[game.phase]);
}
function tone(frequency,duration,volume=.08,delay=0) {
  if (!audio || audio.state !== 'running' || sound.getAttribute('aria-pressed') !== 'true') return;
  const at = audio.currentTime+delay;
  const osc = audio.createOscillator(), gain=audio.createGain();
  osc.type='triangle';
  osc.frequency.setValueAtTime(frequency,at);
  gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.005);
  gain.gain.exponentialRampToValueAtTime(.001,at+duration);
  osc.connect(gain); gain.connect(audio.destination);
  osc.start(at);osc.stop(at+duration+.01);
}
function notify(event) {
  if (!event) return;
  text(ui.message,event.text);
  if(event.kind==='raid') [523,659,784,1047].forEach((f,i)=>tone(f,.18,.09,i*.065));
  else if(event.kind==='bump') tone(440+game.lit*40,.16);
  else if(event.kind==='drain' || event.kind==='over') tone(117,.24);
}
function clearInputs() {
  sources.forEach(set=>set.clear());
  game.held.fill(false);
}
function startRanked(run) {
  if (!draw) throw new Error('Canvas unavailable');
  cancelAnimationFrame(frame);
  if (game.score) saveScore();
  clearInputs();
  game = newGame();
  ranked = {run, recorder:createRaidRecorder()};
  text(ui.message, 'Ranked game ready. Launch your first ball.');
  paint();
  action.focus();
}
function doPause() {
  if (game.phase !== 'playing') return;
  cancelAnimationFrame(frame);
  pause(game);
  clearInputs();
  text(ui.message,'Paused.');
  paint();
}
function update(now) {
  remainder += Math.min(.075,Math.max(0,(now-previous)/1000));
  previous=now;
  while (remainder>=STEP && game.phase==='playing') {
    const last=game.event;
    if (ranked && !ranked.recorder.record(game.held)) {
      ranked = null;
      ranks.abandon('This run reached the ranked replay limit. You can finish in practice.');
    }
    step(game);
    if(last!==game.event) notify(game.event);
    remainder-=STEP;
  }
  if(game.phase==='playing') frame=requestAnimationFrame(update);
  else {
    clearInputs();
    saveScore();
    if (ranked && game.phase === 'over') ranks.finish(ranked.run, ranked.recorder.history);
    action.focus({preventScroll:true});
  }
  paint();
}
function activate() {
  if(game.phase==='playing') return doPause();
  if(game.phase==='over') {
    game=newGame();
    ranked=null;
  }
  if(game.phase==='paused') {
    game.phase='playing';text(ui.message,'Back in play.');
  } else {
    launch(game);notify(game.event);tone(165,.1);
  }
  canvas.focus({preventScroll:true});
  previous=performance.now();remainder=0;
  frame=requestAnimationFrame(update);
  paint();
}
function hold(side,source) {
  if(game.phase!=='playing') return;
  if(!game.held[side]) tone(side===0?133:151,.045,.055);
  sources[side].add(source);game.held[side]=true;
}
function liftSource(source) {
  sources.forEach((set,i)=>{set.delete(source);game.held[i]=set.size>0;});
}
if (draw) {
  action.disabled=false;
  action.addEventListener('click',activate);
  for(const target of [canvas,...controls]) {
    target.addEventListener('pointerdown',event=>{
      if(event.button!==0 || game.phase!=='playing') return;
      event.preventDefault();
      const box=canvas.getBoundingClientRect();
      const side=target===canvas ? Number(event.clientX>=box.left+box.width/2) : controls.indexOf(target);
      target.setPointerCapture(event.pointerId);
      canvas.focus({preventScroll:true});
      hold(side,event.pointerId);
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']) {
      target.addEventListener(name,event=>liftSource(event.pointerId));
    }
    target.addEventListener('contextmenu',event=>event.preventDefault());
  }
  controls.forEach((button,side)=>{
    // Assistive activation can produce a click without a pointer sequence.
    button.addEventListener('click',event=>{
      if(event.detail!==0) return;
      const source=Symbol('flipper');
      hold(side,source);setTimeout(()=>liftSource(source),90);
    });
  });
  cabinet.addEventListener('keydown',event=>{
    if(event.altKey || event.ctrlKey || event.metaKey) return;
    const side=['ArrowLeft','ArrowRight'].indexOf(event.code);
    if(side>=0) {
      event.preventDefault();
      if(!event.repeat) hold(side,event.code);
    } else if(event.code==='KeyP' && ['playing','paused'].includes(game.phase)) {
      event.preventDefault();if(!event.repeat) activate();
    } else if(event.code==='Space' && event.target===canvas && game.phase!=='playing') {
      event.preventDefault();if(!event.repeat) activate();
    }
  });
  window.addEventListener('keyup',e=>liftSource(e.code));
  cabinet.addEventListener('focusout',e=>{
    if(e.relatedTarget && !cabinet.contains(e.relatedTarget)) doPause();
  });
  sound.addEventListener('click',async()=>{
    const enabled=sound.getAttribute('aria-pressed')!=='true';
    try {
      if(enabled) { audio ||= new AudioContext(); await audio.resume(); }
      sound.setAttribute('aria-pressed',String(enabled));
      text(sound,enabled?'Sound on':'Sound off');
      if(enabled) tone(523,.10);
    } catch { text(sound,'Sound unavailable');sound.disabled=true; }
    if(game.phase==='playing') canvas.focus({preventScroll:true});
  });
  window.addEventListener('blur',doPause);
  window.addEventListener('pagehide',()=>{doPause();if(game.score)saveScore();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)doPause();});
  window.addEventListener('resize',paint);
  window.addEventListener('storage',e=>{if(e.key===recordKey || e.key===null){best=savedBest();paint();}});
  paint();
} else {
  text(ui.message,'Open this page in a browser with Canvas support to play.');
  sound.disabled=true;
}
