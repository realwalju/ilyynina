import assert from 'node:assert/strict';
import test from 'node:test';
import { launch, newGame, pause, STEP, step } from '../js/game/pinball.mjs';
import { BALLS, JACKPOT, MOUTH } from '../js/game/table.mjs';

function served() {
  const game=newGame();
  launch(game);
  return game;
}
function advance(game,seconds) {
  for(let n=0;n<Math.round(seconds/STEP);n++) step(game);
}

test('a serve takes the outer orbit into the main field and cannot be relaunched during play',()=>{
  const game=served();
  advance(game,.85);
  const ball={...game.ball};
  assert.ok(game.entered);
  assert.ok(ball.x<340);
  launch(game);
  assert.deepEqual(game.ball,ball);
});
test('left and right flips are independent and pause freezes the ball',()=>{
  const game=served();
  game.held[1]=true;
  advance(game,.07);
  assert.deepEqual(game.lift,[0,1]);
  pause(game);
  const ball={...game.ball};
  advance(game,1);
  assert.deepEqual(game.ball,ball);
  assert.deepEqual(game.held,[false,false]);
});
test('an armed uplink pays on an upward crossing only and consumes the lit bank',()=>{
  const game=served();
  const cross = (lit,vy) => {
    game.lit=lit;
    Object.assign(game.ball,{x:MOUTH.x,y:MOUTH.y-Math.sign(vy),vx:0,vy});
    step(game);
  };
  cross(7,400);
  cross(3,-400);
  assert.equal(game.score,0);
  cross(7,-400);
  assert.equal(game.score,JACKPOT);
  assert.equal(game.raids,1);
  assert.equal(game.lit,0);
  cross(0,-400);
  assert.equal(game.score,JACKPOT);
});
test('an early drain allows one save per ball, then progresses to the final score',()=>{
  const game=served();
  game.lit=3;
  for(let i=1;i<=BALLS;i++) {
    game.ball.y=630;
    step(game);
    assert.equal(game.phase,'serve');
    assert.equal(game.number,i);
    assert.equal(game.saveUsed,true);
    launch(game);
    game.ball.y=630;
    step(game);
    assert.equal(game.lit,3);
    assert.equal(game.phase,i===BALLS?'over':'serve');
    if(i<BALLS) launch(game);
  }
  const result=structuredClone(game);
  launch(game);
  advance(game,1);
  assert.deepEqual(game,result);
  assert.equal(newGame().lit,0);
});
test('idle balls drain and a player can send a raid from a real serve using only the flippers',()=>{
  const idle=served();
  advance(idle,20);
  assert.equal(idle.phase,'serve');
  assert.equal(idle.number,2);
  const game=served();
  for(let n=0;n<80/STEP && game.phase==='playing' && !game.raids;n++) {
    for(let side=0;side<2;side++){
      const b=game.ball;
      const inLane=side===0 ? b.x<187 : b.x>=187;
      const swing=b.y>478 && b.vy>10 && inLane;
      game.held[side]=swing || (game.held[side] && b.y>460 && b.y<545 && game.lift[side]<1);
    }
    step(game);
    assert.ok(Number.isFinite(game.ball.x) && Number.isFinite(game.ball.y));
  }
  assert.equal(game.number,1);
  assert.equal(game.raids,1);
  assert.ok(game.score>=JACKPOT+300);
});
