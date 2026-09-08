import { smoothPath } from './rio-motion';

export const FILM_LENGTH = 38;
export const LETTER_OPENS = 34.8;
export const INVITE_REVEAL = 36;
export const CUTS = [8.5, 17, 25] as const;
export type Location = 'rio' | 'hogwarts' | 'odyssey' | 'newyork';
export const LOCATIONS: Location[] = ['rio', 'hogwarts', 'odyssey', 'newyork'];
export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const settle = (v: number) => { const u = clamp(v); return u * u * (3 - 2 * u); };
export const between = (t: number, start: number, end: number) => settle((t - start) / (end - start));

/** A location changes only after both birds have flown completely off screen. */
export function directFilm(seconds: number, portrait: boolean) {
  const t = clamp(seconds, 0, FILM_LENGTH);
  const index = t < CUTS[0] ? 0 : t < CUTS[1] ? 1 : t < CUTS[2] ? 2 : 3;
  const start = index === 0 ? 0 : CUTS[index - 1];
  const end = index === 3 ? FILM_LENGTH : CUTS[index];
  const local = t - start;
  const duration = end - start;
  const u = local / duration;
  const times = index === 0
    ? [0, 1.4, 2.8, 4.2, 5.5, 6.35, 7, 8, 8.5]
    : index === 3
      ? [0, .35, 1.5, 3, 4.5, 6, 8, 10.3, 13]
      : [0, .35, 1.5, 3, 4.3, 5.5, duration - 1.5, duration - .5, duration];
  const x = index === 3
    ? [-.75, -.75, .17, .37, .46, .35, .27, .16, .16]
    : [-.75, -.75, .16, .33, .47, .34, .64, 1.65, 1.65];
  const y = index === 0
    ? [.55, .55, .39, portrait ? .24 : .21, .32, .44, .37, .31, .31]
    : index === 1
      ? [.31, .31, .4, .31, .43, .35, .4, .38, .38]
      : index === 2
        ? [.38, .38, .42, .31, .38, .45, .4, .32, .32]
        : [.32, .32, .39, .33, .4, .32, .26, .24, .24];
  const bank = [0, 0, -.08, .14, -.12, .09, -.04, 0, 0];
  const scale = [ .8, .8, .88, .65, .7, .9, .85, .8, .8 ];
  return {
    time: t, index, location: LOCATIONS[index],
    // The original illustrated scenes have only a quiet drift, with no camera dives.
    camera: { x: (index % 2 ? -1 : 1) * (u - .5) * (portrait ? .045 : .1), y: (u - .5) * .06, zoom: 1.035 + u * .045, roll: 0, yaw: 0 },
    birds: { x: smoothPath(local, times, x), y: smoothPath(local, times, y), size: smoothPath(local, times, scale), bank: smoothPath(local, times, bank), visible: t > 1.4 && t < 35.6 },
  };
}

export function wingPose(seconds: number, phase = 0) {
  const cycle = seconds * Math.PI * 2 * 2.15 + phase;
  return { flap: Math.sin(cycle), flex: Math.sin(cycle - .48), body: Math.sin(cycle - .2) * .008 };
}

export function deliveryAt(t: number, portrait: boolean) {
  t += 6;
  const entry = between(t, 34.9, 36.5);
  const exit = between(t, 38.6, 40.1);
  const angle = -1.9 * (1 - entry) + Math.sin((t - 36.5) * 2) * .025 * entry + exit * 1.95;
  const rope = portrait ? .38 : .32;
  const x = .69 + Math.sin(angle) * rope;
  const y = -.13 + Math.cos(angle) * rope;
  return { x, y, angle, visible: t >= 34.9 && t < 40.1, anchorX: .69, anchorY: -.13 };
}
