const ink = '#342b30';
const coat = '#dc984f';
const shadow = '#b97145';
const biscuit = '#ffce87';
const cream = '#ffe4b2';
const aqua = '#64edce';

function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

// Fill whole pixel spans so diagonals stay crisp at any display scale.
function patch(ctx, color, points) {
  const ys = points.map(point => point[1]);
  ctx.fillStyle = color;
  for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
    const edges = [];
    const scan = y + 0.5;
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 > scan) !== (y2 > scan)) edges.push(x1 + (scan - y1) * (x2 - x1) / (y2 - y1));
    }
    edges.sort((a, b) => a - b);
    for (let i = 0; i < edges.length; i += 2) {
      const left = Math.round(edges[i]);
      ctx.fillRect(left, y, Math.round(edges[i + 1]) - left, 1);
    }
  }
}

function terrier(ctx, talking, hop) {
  ctx.save();
  ctx.translate(27, 6 - hop);
  ctx.scale(2, 2);
  // Broad eyebrows, a scruffy beard and a folded ear give the host its silhouette.
  patch(ctx, ink, [[12,39],[13,32],[18,28],[29,27],[34,31],[38,39]]);
  patch(ctx, coat, [[14,39],[15,33],[20,29],[28,29],[33,32],[36,39]]);
  patch(ctx, biscuit, [[20,30],[29,30],[27,36],[24,35],[22,38],[20,35],[18,36]]);
  patch(ctx, ink, [[9,17],[7,4],[9,1],[14,3],[20,9],[27,7],[31,8],[36,3],[40,4],[42,12],
    [38,17],[38,21],[41,22],[38,24],[39,26],[35,27],[32,30],[26,32],[20,31],[16,29],[12,29],
    [13,27],[8,27],[10,24],[6,23],[9,21]]);
  patch(ctx, coat, [[10,17],[9,4],[10,3],[15,6],[19,11],[27,8],[32,10],[36,5],[39,5],[40,12],
    [36,16],[37,22],[39,22],[36,24],[37,25],[33,26],[30,29],[25,31],[20,29],[15,28],
    [16,26],[11,26],[13,24],[9,23],[11,20]]);
  patch(ctx, '#aa6552', [[10,5],[16,11],[12,14]]);
  patch(ctx, shadow, [[30,11],[37,5],[39,6],[40,12],[37,16],[34,15]]);
  patch(ctx, biscuit, [[13,15],[17,11],[23,9],[23,12],[21,14],[24,14],[21,16],[15,17]]);
  patch(ctx, biscuit, [[28,13],[31,11],[34,12],[33,15],[28,15]]);
  rect(ctx, ink, 17, 17, 3, 3);
  rect(ctx, ink, 29, 16, 3, 3);
  rect(ctx, '#fff7db', 17, 17, 1, 1);
  rect(ctx, '#fff7db', 29, 16, 1, 1);
  patch(ctx, cream, [[13,23],[18,20],[21,20],[23,18],[26,18],[29,20],[33,20],[36,22],[33,24],
    [34,26],[31,26],[28,29],[25,28],[23,30],[21,28],[18,28],[19,26],[15,26],[17,24]]);
  patch(ctx, ink, [[22,20],[28,20],[28,22],[25,24],[22,22]]);
  rect(ctx, '#7e6660', 23, 20, 2, 1);
  if (talking) {
    rect(ctx, ink, 23, 24, 6, 3);
    rect(ctx, '#ff9b91', 25, 26, 3, 2);
  } else {
    rect(ctx, ink, 24, 24, 1, 1);
    rect(ctx, shadow, 25, 25, 3, 1);
  }
  rect(ctx, shadow, 17, 23, 1, 1);
  rect(ctx, shadow, 31, 22, 1, 1);
  // Headband, cushioned ear cups, and a woven collar.
  patch(ctx, ink, [[6,17],[6,12],[9,9],[14,5],[19,3],[27,3],[34,6],[37,11],[34,12],
    [31,8],[26,6],[20,6],[15,8],[11,10],[9,14],[9,18]]);
  patch(ctx, aqua, [[7,14],[9,10],[15,6],[20,4],[26,4],[32,6],[35,9],[32,8],
    [26,5],[20,5],[15,7],[10,11],[8,15]]);
  rect(ctx, ink, 5, 15, 7, 9);
  rect(ctx, '#218e85', 5, 16, 6, 7);
  rect(ctx, aqua, 6, 16, 4, 5);
  rect(ctx, '#cefff2', 6, 16, 1, 4);
  rect(ctx, ink, 36, 13, 4, 8);
  rect(ctx, aqua, 37, 14, 2, 6);
  patch(ctx, '#27766e', [[16,29],[23,32],[31,29],[30,32],[24,34],[18,32]]);
  rect(ctx, '#ffdc78', 23, 32, 3, 3);
  ctx.restore();
}

function testCard(ctx) {
  const bars = ['#decba0','#dbac65','#70bdb4','#75a484','#ba86ad','#b66c65','#617896','#4b5668'];
  bars.forEach((color, i) => rect(ctx, color, i * 20, 0, 20, 90));
  for (let i = 0; i < 16; i++) rect(ctx, i % 2 ? '#314454' : '#b5b8ab', i * 10, 66, 10, 5);
  rect(ctx, '#172a32', 0, 71, 160, 19);
  rect(ctx, '#22343a', 35, 31, 90, 21);
  ctx.fillStyle = '#f8ebc9';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CAMERA OFFLINE', 80, 45);
}

function studio(ctx, stage, frame) {
  const live = stage === 3;
  rect(ctx, live ? '#3f5250' : '#304451', 0, 0, 160, 90);
  for (let i = 0; i < 10; i++) {
    const x = i * 18 - 4;
    patch(ctx, '#394b56', [[x,0],[x+6,0],[x-6,62],[x-12,62]]);
  }
  rect(ctx, '#24393d', 0, 60, 160, 30);
  terrier(ctx, stage >= 2 && frame % 4 !== 1, live && frame % 4 === 1 ? 2 : 0);
  rect(ctx, '#1d2a30', 0, 79, 160, 11);
  rect(ctx, '#b7815f', 0, 78, 160, 2);
  // A desktop mic switches on with the voice channel.
  rect(ctx, ink, 115, 54, 3, 24);
  rect(ctx, '#a4b4a8', 116, 63, 1, 14);
  rect(ctx, '#172a30', 110, 77, 13, 2);
  rect(ctx, '#192a32', 110, 42, 10, 20);
  rect(ctx, '#8da5a5', 111, 43, 8, 14);
  for (let y = 45; y < 56; y += 3) rect(ctx, '#516a70', 111, y, 8, 1);
  rect(ctx, stage >= 2 ? aqua : '#5a6965', 111, 58, 8, 2);
  if (stage >= 2) {
    const heights = [5, 10, 14, 8, 12, 6];
    heights.forEach((_, i) => {
      const height = heights[(i + frame) % heights.length];
      rect(ctx, i === 2 ? '#ffcf81' : aqua, 132 + i*3, 67-height, 2, height);
    });
  }
  rect(ctx, live ? '#a44153' : '#1e3037', 114, 5, 41, 12);
  ctx.fillStyle = '#fff4d5';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(live ? 'ON AIR' : 'CAM 1', 134, 14);
  if (live) {
    const bits = [[10,12],[28,24],[18,45],[45,7],[104,13],[145,31],[130,25],[151,58]];
    bits.forEach(([x,y], i) => {
      const drop = frame ? (i + frame) % 5 : 0;
      rect(ctx, [aqua,'#feb778','#f59dac'][i % 3], x, y+drop, i % 2 + 1, 3);
    });
  }
}

function yip(audio) {
  const now = audio.currentTime;
  const voice = audio.createOscillator();
  const gain = audio.createGain();
  voice.type = 'triangle';
  voice.frequency.setValueAtTime(380, now);
  voice.frequency.exponentialRampToValueAtTime(760, now + 0.045);
  voice.frequency.exponentialRampToValueAtTime(275, now + 0.17);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  voice.connect(gain).connect(audio.destination);
  voice.onended = () => { voice.disconnect(); gain.disconnect(); };
  voice.start(now);
  voice.stop(now + 0.19);
}

export function studioMonitor(canvas, soundButton) {
  const ctx = canvas.getContext('2d');
  const labels = ['Camera offline. Test pattern.', 'Camera connected. A terrier in aqua headphones is ready at the mic.',
    'Microphone connected. The terrier is speaking.', 'On air! The terrier is broadcasting.'];
  canvas.width = 160;
  canvas.height = 90;
  canvas.setAttribute('role', 'img');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const Audio = window.AudioContext || window.webkitAudioContext;
  let stage = -1;
  let timer;
  let audio;
  soundButton.disabled = !Audio;
  function soundLabel() {
    soundButton.setAttribute('aria-pressed', String(Boolean(audio)));
    soundButton.textContent = audio ? 'Sound on' : 'Sound off';
  }
  soundLabel();
  soundButton.addEventListener('click', async () => {
    if (audio) {
      const current = audio;
      audio = undefined;
      soundLabel();
      await current.close().catch(() => {});
      return;
    }
    let current;
    try {
      current = new Audio();
      audio = current;
      soundLabel();
      await current.resume();
      if (audio === current) yip(current);
    } catch {
      if (audio === current) {
        audio = undefined;
        soundLabel();
      }
      if (current && current.state !== 'closed') await current.close().catch(() => {});
    }
  });
  function update(count) {
    if (stage === count) return;
    window.clearTimeout(timer);
    stage = count;
    canvas.setAttribute('aria-label', labels[stage]);
    if (!ctx) return;
    if (stage === 0) { testCard(ctx); return; }
    if (stage === 2 && audio?.state === 'running') yip(audio);
    function draw(frame) {
      studio(ctx, stage, frame);
      if (stage >= 2 && frame < 7 && !reducedMotion.matches && !document.hidden) {
        timer = window.setTimeout(() => draw(frame + 1), 150);
      }
    }
    draw(0);
  }
  update(0);
  return update;
}
