import { WIDTH, HEIGHT, BALL_RADIUS, BUMPERS, RAILS, SLINGS, POSTS, FLIPPERS, FLIP_RADIUS,
  MOUTH, flipperTip } from './table.mjs';

const ink = '#091a22';
const mint = '#9ef8d4';
const gold = '#ffc26f';
const art = new Image();
art.src = new URL('../../assets/game/raid-relay.webp', import.meta.url).href;

function line(ctx, points, width, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function circle(ctx,x,y,r,fill,stroke,width=1) {
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  if (fill) { ctx.fillStyle=fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=width; ctx.stroke(); }
}
function plate(ctx,x,y,w,h,r,fill,stroke) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
  ctx.fillStyle=fill; ctx.fill();
  if (stroke) { ctx.lineWidth=1.4; ctx.strokeStyle=stroke; ctx.stroke(); }
}
function label(ctx,text,x,y,size,color,weight='bold',family='monospace') {
  ctx.fillStyle=color; ctx.font=weight+' '+size+'px '+family;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,x,y);
}
function screw(ctx,x,y,r=3) {
  circle(ctx,x,y,r+1.2,'#18282c');
  circle(ctx,x,y,r,'#93a3a1');
  line(ctx,[[x-r*.55,y+r*.42],[x+r*.55,y-r*.42]],1.2,'#30434b');
}
function chrome(ctx,points) {
  line(ctx,points,9,'#08151dd9');
  line(ctx,points,6,'#738c97');
  line(ctx,points,3.4,'#c2d7d4');
  line(ctx,points.map(([x,y])=>[x-1,y-1]),1.2,'#fff9db');
}
function printedTable(ctx) {
  ctx.lineJoin=ctx.lineCap='round';
  ctx.fillStyle='#111e25'; ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(7,7,406,584,18); ctx.clip();
  if (art.naturalWidth) ctx.drawImage(art,9,8,392,559);
  else {
    ctx.fillStyle='#143d42'; ctx.fillRect(8,8,406,565);
    for (let r=42;r<430;r+=36) circle(ctx,177,335,r,null,'#477274',1.5);
    label(ctx,'ON AIR',178,327,29,mint,'900','sans-serif');
  }
  const shade=ctx.createLinearGradient(0,0,0,HEIGHT);
  // Keep the print visible under the hardware, especially behind the ball
  // as it crosses the bright CRT face in the center of the table.
  shade.addColorStop(0,'#09152085'); shade.addColorStop(.48,'#08182079');
  shade.addColorStop(.74,'#09192086'); shade.addColorStop(1,'#071719e8');
  ctx.fillStyle=shade; ctx.fillRect(0,0,WIDTH,HEIGHT);

  // Printed orbit, packet trace and arrow inserts are below all hardware.
  ctx.setLineDash([3,6]);
  line(ctx,[[377,450],[380,131],[365,86],[330,54],[290,38],[100,38],[53,65],[34,117]],1.3,'#ffdaa6bd');
  ctx.setLineDash([]);
  ctx.fillStyle='#151e30'; ctx.fillRect(366,122,33,459);
  for (let y=158;y<496;y+=19) line(ctx,[[371,y+3],[382,y-3],[393,y+3]],1.3,'#6d6f92');
  ctx.save(); ctx.translate(381,317); ctx.rotate(-Math.PI/2);
  plate(ctx,-37,-8,74,17,3,'#0d1923');
  label(ctx,'LAUNCH',0,1,11,'#dccfee'); ctx.restore();
  // Steel plunger at rest at the bottom of the shooter lane.
  for(let y=541;y<568;y+=5) line(ctx,[[372,y+4],[391,y]],2.5,'#a3b4bd');
  plate(ctx,371,531,22,9,3,'#d4d8cd','#505e70');

  SLINGS.forEach((points,i) => {
    ctx.beginPath();ctx.moveTo(...points[0]);ctx.lineTo(...points[1]);ctx.lineTo(...points[2]);ctx.closePath();
    ctx.fillStyle=i ? '#73559b' : '#367e74';ctx.fill();
    line(ctx,points,8,'#132833');
    line(ctx,points,5,i ? '#bb9bf2' : '#8ae6bf');
    for (const [x,y] of points.slice(0,3)) screw(ctx,x,y,2.5);
  });
  for (const rail of RAILS) chrome(ctx,rail);
  for (const p of POSTS) {
    circle(ctx,p.x,p.y+2,p.r+2,'#112028');
    circle(ctx,p.x,p.y,p.r,'#d6b995','#463c48',1.5);
    screw(ctx,p.x,p.y,2.5);
  }
  // The apron sits behind the flippers; the center gap is an open drain.
  for(const sign of [-1,1]) {
    ctx.save(); if(sign===1) {ctx.translate(369,0);ctx.scale(-1,1);}
    ctx.beginPath();ctx.moveTo(12,453);ctx.lineTo(103,519);ctx.lineTo(151,550);ctx.lineTo(151,575);ctx.lineTo(12,575);ctx.closePath();
    ctx.fillStyle='#26313f';ctx.fill();
    for(let k=0;k<3;k++) line(ctx,[[14,479+6*k],[95,533+6*k]],2,['#9890bd','#7de6c4','#d99b69'][k]);
    ctx.restore();
  }
  plate(ctx,8,567,404,29,6,'#222c34','#707c80');
  label(ctx,'N I N A ’ S   A R C A D E',210,581,12,'#e6e7cf');
  screw(ctx,19,580); screw(ctx,400,580);
  ctx.restore();
}

function bumper(ctx,p,isLit,age) {
  const pulse=Math.max(0,1-age/.22);
  circle(ctx,p.x,p.y+4,p.r+3,'#091b22c8');
  ctx.save();
  if(isLit || pulse) { ctx.shadowBlur=6+12*pulse;ctx.shadowColor=p.color; }
  circle(ctx,p.x,p.y,p.r+1,p.color);ctx.restore();
  circle(ctx,p.x,p.y,p.r-2,'#273238','#f0e4d8',1);
  const bevel=ctx.createLinearGradient(p.x-10,p.y-23,p.x+9,p.y+22);
  bevel.addColorStop(0,'#ffffe9');bevel.addColorStop(.18,p.color);bevel.addColorStop(.75,p.color);bevel.addColorStop(1,'#566573');
  circle(ctx,p.x,p.y-2,p.r-4+pulse*2,bevel);
  circle(ctx,p.x,p.y-2,p.r-8,null,'#15273077',1);
  label(ctx,p.label,p.x,p.y-1,p.r*.72,ink,'900','sans-serif');
  // Shape as well as color distinguishes a completed target. The four
  // illuminated bars remain visible between hits, without flashing.
  if (isLit) {
    for (let i=0; i<4; i++) {
      const start = Math.PI * (.5*i + .08);
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r+4,start,start+.78);
      ctx.strokeStyle=p.color;
      ctx.lineWidth=2.5;
      ctx.stroke();
    }
  }
  circle(ctx,p.x,p.y+p.r-8,2.5,isLit?'#fffbe5':'#3e4a57');
}

export function playfield(canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx) return null;
  const base=document.createElement('canvas');
  let dirty=true, lastGame=null;
  function draw(game) {
    lastGame=game;
    const dpr=Math.min(window.devicePixelRatio || 1,2);
    const w=Math.round(canvas.clientWidth*dpr);
    if(!w) return;
    const h=Math.round(w*HEIGHT/WIDTH);
    if(base.width!==w || base.height!==h || dirty) {
      canvas.width=base.width=w;canvas.height=base.height=h;
      const layer=base.getContext('2d');
      layer.scale(w/WIDTH,h/HEIGHT);printedTable(layer);dirty=false;
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(base,0,0);
    ctx.setTransform(w/WIDTH,0,0,h/HEIGHT,0,0);
    ctx.lineJoin=ctx.lineCap='round';
    const ready=game.lit===7;
    plate(ctx,149,52,74,20,7,ready?'#a2ffcf':'#102d35',ready?'#fff5ba':'#88afab');
    label(ctx,'UPLINK',MOUTH.x,62,14,ready?ink:'#eaf9ef');
    const gate = [[153,MOUTH.y],[219,MOUTH.y]];
    line(ctx,gate,5,ink);
    ctx.save();
    if (!ready) ctx.setLineDash([4,4]);
    line(ctx,gate,ready ? 3 : 2,ready?gold:'#b3dcd3');ctx.restore();
    for(let i=0;i<3;i++){
      const y=94+9*i;
      line(ctx,[[180,y+3],[186,y-2],[192,y+3]],2.2,ready?gold:'#9ac6ba');
    }
    // The thin one-way wire at the entrance opens during a serve.
    if(game.entered) line(ctx,[[354,95],[397,95]],2,'#dce4dc');
    BUMPERS.forEach((p,i)=>bumper(ctx,p,Boolean(game.lit&(1<<i)),game.time-game.bumperAt[i]));
    FLIPPERS.forEach((pivot,i)=>{
      const tip=flipperTip(i,game.lift[i]), points=[[pivot.x,pivot.y],[tip.x,tip.y]];
      line(ctx,points.map(([x,y])=>[x,y+3]),FLIP_RADIUS*2+3,'#091319');
      line(ctx,points,FLIP_RADIUS*2,i?'#efa982':'#a39de8');
      line(ctx,points,FLIP_RADIUS*2-5,i?'#ffd2a3':'#dad3ff');
      line(ctx,[[pivot.x,pivot.y-2],[tip.x,tip.y-2]],2,'#fff4d4');
      screw(ctx,pivot.x,pivot.y);
    });
    if(game.phase!=='over') {
      const b=game.ball;
      if(game.phase==='playing'){
        const len=Math.hypot(b.vx,b.vy);
        if(len>460) line(ctx,[[b.x-b.vx*.019,b.y-b.vy*.019],[b.x,b.y]],6,'#d8fdffc2');
      }
      circle(ctx,b.x+1,b.y+2,BALL_RADIUS+2,'#07121ce8');
      const steel=ctx.createRadialGradient(b.x-2.4,b.y-3.2,.4,b.x,b.y,BALL_RADIUS);
      steel.addColorStop(0,'#fff');steel.addColorStop(.35,'#ffffff');steel.addColorStop(.62,'#c6e5ec');
      steel.addColorStop(.78,'#738997');steel.addColorStop(.91,'#384d5a');steel.addColorStop(1,'#e8ffff');
      circle(ctx,b.x,b.y,BALL_RADIUS,steel,'#fff',1.2);
    }
    // Keep mission feedback on the glass, including when a phone only
    // shows the table. Never cover a live ball with a score message.
    const interrupted={paused:'PAUSED',serve:'BALL '+game.number+' READY',over:'GAME OVER'}[game.phase];
    const raid=game.event?.kind==='raid' && game.time-game.event.time<1.1;
    if (interrupted || raid) {
      plate(ctx,116,552,138,23,5,raid?'#a4f5ce':'#14212c',raid?'#ffda90':'#9eb0ac');
      label(ctx,interrupted || 'RAID  +2,000',185,564,14,raid?ink:'#edf8e4');
    }
  }
  if(!art.complete) art.addEventListener('load',()=>{dirty=true;if(lastGame)draw(lastGame);},{once:true});
  return draw;
}
