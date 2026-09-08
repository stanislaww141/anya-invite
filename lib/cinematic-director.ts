import { smoothPath } from './rio-motion';

export const FILM_LENGTH = 44;
export const LETTER_OPENS = 40.8;
export const INVITE_REVEAL = 42;
export const CUTS = [9.4, 20.2, 29.6] as const;
export type Location = 'rio' | 'hogwarts' | 'odyssey' | 'newyork';
export const LOCATIONS: Location[] = ['rio', 'hogwarts', 'odyssey', 'newyork'];
export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const settle = (v: number) => { const u = clamp(v); return u * u * (3 - 2 * u); };
export const between = (t: number, start: number, end: number) => settle((t - start) / (end - start));
const path = (t: number, times: number[], values: number[]) => smoothPath(t, times, values);

/** One director owns the camera, actors and concealed cuts. Nothing advances independently. */
export function directFilm(seconds: number, portrait: boolean) {
  const t = clamp(seconds, 0, FILM_LENGTH);
  const index = t < CUTS[0] ? 0 : t < CUTS[1] ? 1 : t < CUTS[2] ? 2 : 3;
  const location = LOCATIONS[index];
  let panX = 0, panY = 0, zoom = 1.12, roll = 0, yaw = 0;
  let birdX = .38, birdY = .4, birdSize = 1, bank = 0;
  let towers = 0, facade = 0;

  if (index === 0) {
    const times = [0, 2.2, 4, 5.8, 7.2, 8.6, 9.4];
    panX = path(t, times, [0, 0, -.28, .18, .4, .5, .5]);
    panY = path(t, times, [0, 0, .55, .35, .25, 1.55, 1.8]);
    zoom = path(t, times, [1.12, 1.12, 1.3, 1.4, 1.25, 1.62, 1.7]);
    roll = path(t, times, [0, 0, -.045, .055, .015, -.12, -.12]);
    birdX = path(t, times, [-.3, .16, .36, .53, .43, .55, .58]);
    birdY = path(t, times, [.6, .47, .29, .36, .43, .3, .28]);
    birdSize = path(t, times, [.7, 1, .67, .59, .88, .65, .58]);
    bank = path(t, times, [-.1, -.1, .24, -.24, -.1, .23, .23]);
  } else if (index === 1) {
    const times = [9.4, 10.4, 12.5, 14.4, 16.2, 18.3, 19.5, 20.2];
    panX = path(t, times, [-.3, -.3, -.5, .32, .56, .05, 0, 0]);
    panY = path(t, times, [-1, -.75, .32, 1.02, .8, -.48, -2.1, -2.45]);
    zoom = path(t, times, [1.2, 1.15, 1.5, 2.25, 1.9, 1.2, 2.4, 3]);
    roll = path(t, times, [-.1, -.05, .02, -.12, .12, .025, 0, 0]);
    yaw = path(t, times, [0, 0, .08, -.1, .07, 0, 0, 0]);
    birdX = path(t, times, [.58, .46, .42, .48, .5, .43, .48, .48]);
    birdY = path(t, times, [.28, .46, .42, .35, .37, .45, .65, .69]);
    birdSize = path(t, times, [.58, .82, .68, .5, .61, .86, .65, .55]);
    bank = path(t, times, [.23, .08, -.13, .22, -.24, -.05, -.25, -.25]);
    towers = Math.sin(between(t, 12.6, 16.9) * Math.PI);
  } else if (index === 2) {
    const times = [20.2, 21, 22.7, 25, 26.8, 28.5, 29.6];
    panX = path(t, times, [0, 0, -.25, .42, .55, .1, .1]);
    panY = path(t, times, [-2.45, -1.65, -.15, -.1, .45, 1.95, 2.2]);
    zoom = path(t, times, [3, 2.4, 1.15, 1.28, 1.4, 1.7, 1.8]);
    roll = path(t, times, [0, .02, .02, -.07, -.02, .12, .12]);
    birdX = path(t, times, [.48, .42, .32, .43, .48, .53, .55]);
    birdY = path(t, times, [.69, .51, .43, .46, .34, .22, .23]);
    birdSize = path(t, times, [.55, .72, 1, .85, .65, .53, .53]);
    bank = path(t, times, [-.25, .05, .05, -.14, .15, .25, .25]);
  } else {
    const times = [29.6, 30.6, 32.5, 34, 35.5, 37, 38.2, 40, 42, 44];
    panX = path(t, times, [.1, .1, -.1, .72, .95, .8, .6, .15, 0, 0]);
    panY = path(t, times, [1.2, .9, -.7, -1.85, -1.7, -1.7, -1.65, -.8, -.35, -.35]);
    zoom = path(t, times, [1.18, 1.08, 1.5, 1.9, 1.8, 1.8, 1.7, 1.35, 1.2, 1.2]);
    roll = path(t, times, [.12, .03, -.025, -.15, -.035, -.02, 0, 0, 0, 0]);
    yaw = path(t, times, [0, 0, .02, .19, .12, .12, .06, 0, 0, 0]);
    birdX = path(t, times, [.55, .42, .37, .4, .37, .4, .45, .32, .18, .18]);
    birdY = path(t, times, [.23, .4, .56, .53, .4, .36, .42, .4, .22, .22]);
    birdSize = path(t, times, [.53, .85, .92, .75, .83, .7, .8, .7, .45, .45]);
    bank = path(t, times, [.25, -.06, -.2, .28, .08, .04, .1, .23, .2, .2]);
    facade = between(t, 32.2, 34.8) * (1 - between(t, 38.5, 41));
  }

  const cutIndex = CUTS.findIndex(cut => Math.abs(t - cut) <= 1.15);
  const cover = cutIndex < 0 ? 0 : 1 - settle(Math.abs(t - CUTS[cutIndex]) / 1.15);
  return {
    time: t, index, location,
    camera: { x: panX * (portrait ? .55 : 1.5), y: panY, zoom, roll, yaw },
    birds: { x: birdX, y: birdY, size: birdSize, bank, visible: t > 1.5 && t < 41.6 },
    towers, facade,
    passage: { cover, kind: cutIndex === 1 ? 'water' : 'cloud', cutIndex },
    ship: { x: portrait ? .6 : .67, y: .67, rock: Math.sin(t * 1.65) * .025, heave: Math.sin(t * 1.65) * .025 },
  };
}

export function wingPose(seconds: number, phase = 0) {
  const cycle = seconds * Math.PI * 2 * 2.15 + phase;
  return { flap: Math.sin(cycle), flex: Math.sin(cycle - .48), body: Math.sin(cycle - .2) * .008 };
}

export function deliveryAt(t: number, portrait: boolean) {
  const entry = between(t, 34.9, 36.5);
  const exit = between(t, 38.6, 40.1);
  const angle = -1.9 * (1 - entry) + Math.sin((t - 36.5) * 2) * .025 * entry + exit * 1.95;
  const rope = portrait ? .38 : .32;
  const x = .69 + Math.sin(angle) * rope;
  const y = -.13 + Math.cos(angle) * rope;
  return { x, y, angle, visible: t >= 34.9 && t < 40.1, anchorX: .69, anchorY: -.13 };
}
