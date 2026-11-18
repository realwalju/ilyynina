export const COURSE = Object.freeze({
  length: 1000,
  lives: 3,
  crystalPoints: 100,
  firstGate: 65,
  spacing: 36,
  sight: 145,
});

// Distances are metres. The renderer and input handlers never resolve collisions.
export function newRun(random = Math.random) {
  const gates = [];
  for (let at = COURSE.firstGate; at < COURSE.length; at += COURSE.spacing) {
    const tree = Math.floor(random() * 3);
    const crystal = (tree + 1 + Math.floor(random() * 2)) % 3;
    gates.push({ at, tree: tree - 1, crystal: crystal - 1 });
  }
  return { phase: 'ready', lane: 0, distance: 0, lives: COURSE.lives, crystals: 0,
    gates, nextGate: 0, lastEvent: null };
}

export function move(run, direction) {
  if (run.phase === 'riding') run.lane = Math.max(-1, Math.min(1, run.lane + Math.sign(direction)));
}

export function score(run) {
  return Math.floor(run.distance) + run.crystals * COURSE.crystalPoints;
}

export function advance(run, seconds) {
  if (run.phase !== 'riding' || !Number.isFinite(seconds) || seconds <= 0) return;
  const speed = 18 + 10 * run.distance / COURSE.length;
  const destination = Math.min(COURSE.length, run.distance + speed * seconds);
  while (run.nextGate < run.gates.length && run.gates[run.nextGate].at <= destination) {
    const gate = run.gates[run.nextGate++];
    if (run.lane === gate.crystal) {
      run.crystals++;
      run.lastEvent = { kind: 'crystal', at: gate.at };
    } else if (run.lane === gate.tree) {
      run.lives--;
      run.lastEvent = { kind: 'hit', at: gate.at };
      if (!run.lives) {
        run.distance = gate.at;
        run.phase = 'crashed';
        return;
      }
    }
  }
  run.distance = destination;
  if (run.distance === COURSE.length) run.phase = 'finished';
}
