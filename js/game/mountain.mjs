import { COURSE } from './run.mjs';

// A low-resolution framebuffer gives the mountain and rider the same pixel scale.
const HEIGHT = 224;
const HORIZON = 108;
const RIDER_Y = 195;

function shape(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function ridge(ctx, width, points, light, shade, snow) {
  const vertices = points.map(([x, y]) => [x * width, y]);
  shape(ctx, light, [[0, HORIZON + 2], ...vertices, [width, HORIZON + 2]]);
  for (let i = 1; i < vertices.length - 1; i += 2) {
    const [x, y] = vertices[i];
    const [left, bottomL] = vertices[i - 1];
    const [right, bottomR] = vertices[i + 1];
    const dx = (right - x) * .36;
    shape(ctx, shade, [[x,y], [right,bottomR], [right,HORIZON+2],
      [x+dx,HORIZON+2], [x+dx*.8,y+22], [x+dx*.28,y+13]]);
    shape(ctx, snow, [[x+(left-x)*.54, y+(bottomL-y)*.54], [x,y],
      [x+dx,y+(bottomR-y)*.36], [x+dx*.3,y+6], [x+dx*.55,y+14],
      [x-2,y+9], [x-5,y+14], [x-5,y+10]]);
  }
}

function backdrop(width) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = HEIGHT;
  const ctx = surface.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#52669a');
  sky.addColorStop(.55, '#e1a3b3');
  sky.addColorStop(1, '#ffe4c6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, HORIZON + 2);
  ctx.fillStyle = '#ffe9bb';
  ctx.beginPath();
  ctx.arc(width * .7, 37, 20, 0, Math.PI * 2);
  ctx.fill();
  for (const [x,y,w] of [[.04,29,.13],[.13,26,.06],[.37,17,.13],[.43,15,.06],[.75,40,.15],[.81,38,.05]]) {
    ctx.fillStyle = '#f4cfcd';
    ctx.fillRect(Math.floor(x*width), y, Math.ceil(w*width), 2);
  }
  ridge(ctx, width, [[0,84],[.12,48],[.22,68],[.33,39],[.46,76],[.55,52],
    [.68,75],[.84,49],[1,82]], '#c2abbe', '#9c93b2', '#ffe3d7');
  ridge(ctx, width, [[0,77],[.14,37],[.25,70],[.32,51],[.48,91],[.58,67],
    [.67,88],[.83,34],[1,82]], '#a7adc9', '#757f9f', '#f2e1e2');
  ridge(ctx, width, [[0,81],[.05,63],[.23,95],[.31,75],[.48,104],[.63,83],
    [.70,94],[.91,58],[1,81]], '#7892a4', '#526e87', '#c9d7df');
  for (let x = -2; x < width + 3; x += 3) {
    const h = 3 + 6 * Math.abs(Math.sin(x*1.7)) + 9 * Math.abs(x/width - .5);
    shape(ctx, '#426375', [[x-3,109], [x,107-h], [x+3,109]]);
  }
  return surface;
}

function pine(ctx, x, y, height) {
  const w = height * .28;
  ctx.fillStyle = '#6c6070';
  ctx.fillRect(x-w*.17, y-height*.25, Math.max(1,w*.34), height*.25);
  for (const k of [1, .76, .52]) {
    const base = y-height*(1-k+.1);
    shape(ctx, '#255363', [[x-w*k,base], [x,y-height*(1.04-.34*k)], [x+w*k,base]]);
    shape(ctx, '#4d8b91', [[x-w*k,base-1], [x,y-height*(1.04-.34*k)], [x+w*k*.14,base-3]]);
    shape(ctx, '#d8f4ed', [[x-w*k*.52,base-height*k*.25], [x,y-height*(1.04-.34*k)],
      [x+w*k*.42,base-height*k*.28], [x,base-height*k*.32]]);
  }
}

function crystal(ctx, x, y, size) {
  ctx.fillStyle = '#88a8bb';
  ctx.fillRect(x-size*.45, y, size*.9, Math.max(1,size*.16));
  const mid = y-size*.95, top = y-size*1.75, bottom = y-size*.22;
  shape(ctx, '#26685e', [[x,top-1],[x+size*.63,mid],[x,bottom+1],[x-size*.63,mid]]);
  shape(ctx, '#baffd3', [[x,top],[x, bottom],[x-size*.51,mid]]);
  shape(ctx, '#35c791', [[x,top],[x+size*.51,mid],[x,bottom]]);
  ctx.fillStyle = 'white';
  ctx.fillRect(x-size*.17,mid-size*.32,Math.max(1,size*.16),Math.max(1,size*.2));
}

function rider(ctx, x, y, hit) {
  ctx.save();
  ctx.translate(Math.round(x), y);
  shape(ctx,'#a1b4c9',[[-15,1],[-7,-1],[15,-1],[18,2],[6,4],[-12,4]]);
  shape(ctx,'#293f52',[[-15,-2],[-12,0],[14,-4],[17,-7],[16,-2],[-10,3],[-15,1]]);
  shape(ctx,'#64e4bb',[[-15,-3],[-10,-1],[12,-5],[16,-8],[16,-5],[-10,1],[-15,-1]]);
  shape(ctx,'#243448',[[-6,-16],[5,-17],[8,-12],[6,-7],[10,-7],[10,-4],[2,-4],
    [1,-8],[2,-12],[-3,-10],[-5,-4],[-11,-3],[-11,-6],[-8,-7]]);
  shape(ctx,hit?'#ffe7a3':'#e87988',[[-4,-27],[3,-28],[7,-22],[6,-13],[-6,-12],[-7,-21],
    [-11,-18],[-14,-20],[-9,-25]]);
  shape(ctx,'#a44d72',[[3,-26],[7,-24],[10,-20],[14,-22],[16,-19],[10,-16],[5,-18],[4,-14],[1,-14]]);
  ctx.fillStyle='#263c50';
  ctx.fillRect(-15,-21,4,3); ctx.fillRect(13,-23,4,4);
  shape(ctx,'#293547',[[-6,-35],[-4,-38],[2,-39],[6,-36],[6,-29],[3,-26],[-5,-27],[-7,-31]]);
  ctx.fillStyle='#8be5dc'; ctx.fillRect(0,-33,7,3);
  ctx.fillStyle='#f6dfce'; ctx.fillRect(2,-30,3,2);
  ctx.fillStyle='#456174'; ctx.fillRect(-4,-36,7,2);
  ctx.restore();
}

function lodge(ctx, x, y, depth) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(depth, depth);
  ctx.fillStyle = '#975e5e';
  ctx.fillRect(-21, -16, 42, 16);
  ctx.fillStyle = '#604957';
  ctx.fillRect(9, -30, 5, 14);
  shape(ctx, '#5e536c', [[-26,-15], [-4,-34], [23,-19], [26,-14]]);
  shape(ctx, '#e9f5ef', [[-27,-16], [-4,-36], [27,-17], [19,-18], [-4,-30], [-22,-15]]);
  ctx.fillStyle = '#ffe3a0';
  ctx.fillRect(-14,-12,7,6);
  ctx.fillRect(8,-12,7,6);
  ctx.fillStyle = '#443f52';
  ctx.fillRect(-2,-10,6,10);
  ctx.restore();
}

export function mountain(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let background;
  return function draw(run) {
    const width = Math.max(180, Math.min(840, Math.round(HEIGHT * canvas.clientWidth / (canvas.clientHeight || 1))));
    if (!background || background.width !== width) {
      canvas.width = width;
      canvas.height = HEIGHT;
      background = backdrop(width);
    }
    ctx.drawImage(background, 0, 0);
    const drift = Math.sin(run.distance / 110) * width * .085;
    const project = (lane, depth) => ({
      x: width * .5 + drift * (1-depth) + lane * depth * width * .215,
      y: HORIZON + depth * (RIDER_Y-HORIZON),
    });
    ctx.fillStyle = '#e8eff3';
    ctx.fillRect(0,HORIZON+1,width,HEIGHT-HORIZON);
    // The three tracks converge at the same vanishing point as every gate.
    for (const lane of [-1.52,-.5,.5,1.52]) {
      const a = project(lane,0), b = project(lane,1.45);
      shape(ctx, '#c1d4e0', [[a.x,a.y],[b.x-1,b.y],[b.x+1,b.y]]);
    }
    const objects = [];
    // Keep scenery moving past the board until it leaves the bottom of the canvas.
    const firstMark = Math.ceil((run.distance - 28) / 14) * 14;
    for (let mark = firstMark; mark <= run.distance+COURSE.sight; mark += 14) {
      const depth = Math.pow(1-(mark-run.distance)/COURSE.sight, 2);
      for (const side of [-1,1]) {
        const p = project(side*(1.66+.38*Math.abs(Math.sin(mark+side))),depth);
        objects.push({ depth, draw: () => pine(ctx,p.x,p.y,3+depth*57) });
      }
    }
    for (let i = Math.max(0, run.nextGate - 1); i < run.gates.length; i++) {
      const gate = run.gates[i];
      const ahead = gate.at-run.distance;
      if (ahead > COURSE.sight) break;
      const depth = (1-ahead/COURSE.sight)**2;
      const tree = project(gate.tree,depth), gem = project(gate.crystal,depth);
      objects.push({ depth, draw: () => {
        pine(ctx,tree.x,tree.y,2+depth*35);
        const collected = run.lastEvent?.kind === 'crystal' && run.lastEvent.at === gate.at;
        if (!collected) crystal(ctx,gem.x,gem.y,1+depth*13);
      }});
    }
    const remaining = COURSE.length - run.distance;
    if (remaining < COURSE.sight) {
      const depth = (1 - remaining / COURSE.sight) ** 2;
      const p = project(1.55, depth);
      objects.push({ depth, draw: () => lodge(ctx, p.x, p.y, depth) });
    }
    const hit = run.lastEvent?.kind === 'hit' && run.distance - run.lastEvent.at < 9;
    objects.push({ depth: 1, draw: () => rider(ctx, project(run.lane, 1).x, RIDER_Y, hit) });
    objects.sort((a, b) => a.depth - b.depth).forEach(obj => obj.draw());
  };
}
