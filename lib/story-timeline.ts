export const STORY_DURATION = 38;
export const INVITATION_AT = 36;
export const PORTRAIT_MEDIA = '(max-width: 700px) and (orientation: portrait)';

export const SCENES = [
  { id: 'rio', wide: '/rio/rio-night.webp', portrait: '/journey/rio-portrait.webp', enter: 0, leave: 8.8 },
  { id: 'hogwarts', wide: '/journey/hogwarts-wide.webp', portrait: '/journey/hogwarts-portrait.webp', enter: 8.2, leave: 17.3 },
  { id: 'odyssey', wide: '/journey/odyssey-wide.webp', portrait: '/journey/odyssey-portrait.webp', enter: 16.6, leave: 25.3 },
  { id: 'newyork', wide: '/journey/newyork-wide.webp', portrait: '/journey/newyork-portrait.webp', enter: 24.6, leave: 39 },
] as const;

export const STORY_ASSETS = [
  '/rio/blu-sprite.webp', '/rio/jewel-sprite.webp', '/rio/curtains.webp',
  '/journey/snitch.webp', '/journey/spiderman.webp', '/journey/envelope.webp', '/journey/clouds.webp',
] as const;

export const FLIGHT_TIMES = [0, 2, 3.8, 5.1, 6.5, 7.8, 9, 10.3, 11.8, 13, 14.7, 16.2, 17.5, 19, 21, 22.8, 24.4, 25.8, 27, 28.5, 30, 31.4, 32.7, 34, 36, 38];
export const FLIGHT_WIDE_X = [-.2, -.05, .16, .33, .40, .27, .42, .56, .43, .61, .73, .60, .43, .25, .42, .62, .78, .62, .38, .28, .44, .40, .35, .21, .13, .13];
export const FLIGHT_WIDE_Y = [.55, .42, .24, .14, .26, .38, .24, .20, .38, .30, .45, .57, .55, .48, .28, .26, .39, .25, .26, .34, .29, .43, .42, .33, .24, .24];
export const FLIGHT_PHONE_X = [-.25, -.08, .14, .32, .55, .39, .25, .53, .27, .53, .75, .62, .45, .25, .40, .64, .72, .58, .37, .28, .44, .40, .35, .24, .14, .14];
export const FLIGHT_PHONE_Y = [.54, .43, .30, .20, .29, .40, .30, .24, .38, .31, .40, .53, .51, .41, .26, .30, .38, .25, .28, .34, .29, .43, .42, .34, .23, .23];

// A new scene dissolves over a fully opaque previous frame, avoiding a dark dip.
export function sceneOpacity(seconds: number, index: number, occlusion = false): number {
  const fadeIn = index === 0 ? 1 : Math.max(0, Math.min(1, (seconds - SCENES[index].enter) / .65));
  const next = SCENES[index + 1];
  if (!next) return fadeIn;
  const covered = Math.max(0, Math.min(1, (seconds - next.enter) / .65));
  return occlusion ? fadeIn * (1 - covered) : covered >= 1 ? 0 : fadeIn;
}

export function storyBeat(seconds: number): number {
  if (seconds >= INVITATION_AT) return 6;
  if (seconds >= 31.7) return 5;
  if (seconds >= 24.8) return 4;
  if (seconds >= 16.9) return 3;
  if (seconds >= 8.5) return 2;
  if (seconds >= 2.2) return 1;
  return 0;
}

export function assetsForViewport(portrait: boolean): string[] {
  return [...STORY_ASSETS, ...SCENES.map(scene => portrait ? scene.portrait : scene.wide)];
}
