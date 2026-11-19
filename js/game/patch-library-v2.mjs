// Ordered by mission. The tier lengths cycle through 60 different combinations.
// Ranked version 2 depends on this catalog's order, wiring and scramble rules.
const camera = [
  {name:'Camera one', route:[3,4,1,2,5]},
  {name:'Desk camera', route:[0,3,4,7,8]},
  {name:'Wide shot', route:[6,7,4,1,2]},
];
const audio = [
  {name:'Mic preamp', route:[4,0,1,5,6,10,11,7]},
  {name:'Guest microphone', route:[8,4,5,1,2,6,7,3]},
  {name:'Monitor mix', route:[0,1,5,4,8,9,10,6,7]},
  {name:'Talkback', route:[4,8,9,5,1,2,3,7]},
];
const broadcast = [
  {name:'Master bus', route:[8,9,5,4,0,1,2,6,10,11]},
  {name:'Control room', route:[12,8,4,5,9,13,14,10,6,2,3,7]},
  {name:'Stream encoder', route:[0,4,8,12,13,9,5,1,2,6,10,14,15]},
  {name:'Satellite uplink', route:[4,0,1,5,9,8,12,13,14,10,6,7]},
  {name:'Transmitter', route:[8,12,13,9,5,4,0,1,2,6,10,11]},
];

export function selectRoutes(day) {
  const ordinal = Date.parse(day + 'T00:00:00Z') / 86400000;
  return [
    {...camera[ordinal % camera.length], cols:3, rows:3, difficulty:'Easy'},
    {...audio[ordinal % audio.length], cols:4, rows:3, difficulty:'Medium'},
    {...broadcast[ordinal % broadcast.length], cols:4, rows:4, difficulty:'Hard'},
  ];
}
