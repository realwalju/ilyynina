export const WIDTH = 420;
export const HEIGHT = 602;
export const BALL_RADIUS = 7;
export const BALLS = 3;
export const JACKPOT = 2000;
export const MOUTH = { x: 186, y: 79, halfWidth: 32 };

export const BUMPERS = [
  { x: 94, y: 152, r: 25, label: 'HI', color: '#a4f5ce' },
  { x: 266, y: 154, r: 25, label: 'GG', color: '#bfadff' },
  { x: 187, y: 236, r: 23, label: 'W', color: '#ffc078' },
];

// Center lines of physical rubbers and steel guides, in table units.
// The back wall bends the vertical launch into the playfield.
export const RAILS = [
  [[12,441],[12,119],[18,88],[34,60],[60,37],[95,20],[142,13],[276,13],
   [315,19],[348,33],[373,54],[391,82],[402,115],[402,574]],
  [[12,439],[22,461],[41,478],[104,514]],
  [[362,438],[353,457],[332,478],[265,514]],
  [[362,573],[362,119],[354,95]],
];
export const SLINGS = [
  [[42,365],[48,428],[101,473],[42,365]],
  [[333,365],[327,428],[274,473],[333,365]],
];
export const FLIPPERS = [
  { x: 106, y: 515, direction: 1 },
  { x: 263, y: 515, direction: -1 },
];
export const FLIP_LENGTH = 69;
export const FLIP_RADIUS = 7;
export function flipperTip(index, lift) {
  const pivot = FLIPPERS[index];
  const angle = .48 - 1.06 * lift;
  return { x: pivot.x + pivot.direction * Math.cos(angle) * FLIP_LENGTH,
    y: pivot.y + Math.sin(angle) * FLIP_LENGTH };
}

export const POSTS = [
  {x: 145, y: 80, r: 5}, {x: 227, y: 80, r: 5},
  {x: 40, y: 276, r: 7}, {x: 334, y: 276, r: 7},
];
