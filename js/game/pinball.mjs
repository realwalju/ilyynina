import { BALL_RADIUS, BALLS, BUMPERS, FLIPPERS, FLIP_RADIUS, HEIGHT, JACKPOT,
  MOUTH, POSTS, RAILS, SLINGS, flipperTip } from './table.mjs';

export const STEP = 1 / 240;
const GRAVITY = 670;
const MAX_SPEED = 1300;
const spawn = () => ({ x: 382, y: 522, vx: 0, vy: 0 });

export function newGame() {
  return { phase: 'ready', ball: spawn(), number: 1, score: 0, raids: 0, lit: 0,
    time: 0, servedAt: 0, saveUsed: false, entered: false,
    held: [false,false], lift: [0,0], bumperAt: [-10,-10,-10], slingAt: [-10,-10],
    event: null };
}

function notify(game, kind, text) {
  game.event = { kind, text, time: game.time };
}
export function launch(game) {
  if (game.phase !== 'ready' && game.phase !== 'serve') return;
  game.ball = spawn();
  game.ball.vy = -1020 - (game.number-1)*31;
  game.phase = 'playing';
  game.entered = false;
  game.servedAt = game.time;
  notify(game, 'launch', 'Ball ' + game.number + ' in play');
}
export function pause(game) {
  if (game.phase !== 'playing') return;
  game.phase = 'paused';
  game.held.fill(false);
}

// Resolve a ball against a circle centered on the closest point of a
// collider. Flipper contact velocity is included in the reference frame.
function contact(ball, x, y, radius, elasticity, kick = 0, vx = 0, vy = 0) {
  const dx = ball.x-x, dy = ball.y-y;
  const limit = BALL_RADIUS + radius;
  const squared = dx*dx + dy*dy;
  if (squared >= limit*limit) return false;
  const distance = Math.sqrt(squared);
  const nx = distance ? dx/distance : 0, ny = distance ? dy/distance : -1;
  ball.x += nx*(limit-distance+.01);
  ball.y += ny*(limit-distance+.01);
  const incoming = (ball.vx-vx)*nx + (ball.vy-vy)*ny;
  if (incoming >= 0) return false;
  const impulse = -(1+elasticity)*incoming + kick;
  ball.vx += nx*impulse;
  ball.vy += ny*impulse;
  return true;
}
function segment(ball, a, b, radius, bounce, kick = 0) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  const t = Math.max(0, Math.min(1, ((ball.x-a[0])*dx+(ball.y-a[1])*dy)/(dx*dx+dy*dy)));
  return contact(ball, a[0]+t*dx, a[1]+t*dy, radius, bounce, kick);
}

function flip(game, index, dt) {
  const old = game.lift[index];
  const target = Number(game.held[index]);
  const rate = target ? 16 : 9;
  const lift = game.lift[index] = old + Math.sign(target-old)*Math.min(Math.abs(target-old),dt*rate);
  const pivot = FLIPPERS[index], tip = flipperTip(index, lift);
  const dx = tip.x-pivot.x, dy = tip.y-pivot.y, ball = game.ball;
  const t = Math.max(0,Math.min(1,((ball.x-pivot.x)*dx+(ball.y-pivot.y)*dy)/(dx*dx+dy*dy)));
  const omega = -pivot.direction*1.06*(lift-old)/dt;
  contact(ball,pivot.x+t*dx,pivot.y+t*dy,FLIP_RADIUS,.72,0,-omega*t*dy,omega*t*dx);
}

function drain(game) {
  game.held.fill(false);
  game.lift.fill(0);
  if (!game.saveUsed && game.time-game.servedAt < 4) {
    game.saveUsed = true;
    game.phase = 'serve';
    notify(game,'save','Ball saved. Launch again.');
  } else if (game.number < BALLS) {
    game.number++;
    game.saveUsed = false;
    game.phase = 'serve';
    notify(game,'drain','Next ball ready. Your lit bumpers carry over.');
  } else {
    game.phase = 'over';
    notify(game,'over','Game over');
  }
  game.ball = spawn();
}

export function step(game) {
  if (game.phase !== 'playing') return;
  const b = game.ball;
  const previousY = b.y;
  game.time += STEP;
  b.vy += GRAVITY*STEP;
  b.vx *= 1-.045*STEP;
  b.vy *= 1-.045*STEP;
  b.x += b.vx*STEP;
  b.y += b.vy*STEP;

  for (const rail of RAILS) {
    for (let i=1; i<rail.length; i++) segment(b,rail[i-1],rail[i],3,.84);
  }
  if (b.x < 351 && b.y < 122) game.entered = true;
  // The launch gate opens into the orbit and closes behind the served ball.
  if (game.entered) segment(b,[354,95],[397,95],2,.72);
  for (const post of POSTS) contact(b,post.x,post.y,post.r,.86);

  SLINGS.forEach((sling,i) => {
    const armed = game.time-game.slingAt[i] > .15;
    for (let j=1; j<sling.length; j++) {
      if (segment(b,sling[j-1],sling[j],3,.85,armed ? 115 : 0) && armed) {
        game.slingAt[i] = game.time;
        break;
      }
    }
  });
  BUMPERS.forEach((bumper,i) => {
    const armed = game.time-game.bumperAt[i] > .12;
    if (!contact(b,bumper.x,bumper.y,bumper.r,.85,armed ? 245 : 0) || !armed) return;
    game.bumperAt[i] = game.time;
    game.score += 100;
    game.lit |= 1 << i;
    notify(game,'bump', game.lit === 7 ? 'Raid ready! Shoot the uplink.' : bumper.label + '  +100');
  });

  flip(game,0,STEP);
  flip(game,1,STEP);

  if (game.lit === 7 && previousY > MOUTH.y && b.y <= MOUTH.y && Math.abs(b.x-MOUTH.x) < MOUTH.halfWidth) {
    game.score += JACKPOT;
    game.raids++;
    game.lit = 0;
    notify(game,'raid','Raid sent!  +2,000');
  }
  const speed = Math.hypot(b.vx,b.vy);
  if (speed > MAX_SPEED) { b.vx *= MAX_SPEED/speed; b.vy *= MAX_SPEED/speed; }
  if (b.y > HEIGHT+BALL_RADIUS) drain(game);
}
