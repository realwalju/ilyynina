import { mountain } from './mountain.mjs';
import { newRun } from './run.mjs';

const poster = document.querySelector('.arcade-poster');
const draw = mountain(poster);
if (draw) {
  const scene = newRun(() => .2);
  scene.distance = 40;
  draw(scene);
  window.addEventListener('resize', () => draw(scene));
}
