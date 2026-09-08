export type FilmSize = { width: number; height: number; portrait: boolean };
export type FilmRenderer = { resize: (size: FilmSize) => void; render: (seconds: number) => void; setPlaying: (playing: boolean) => void; dispose: () => void };
export const BACKGROUNDS = [
  ['/rio/rio-night.webp', '/journey/rio-portrait.webp'],
  ['/journey/hogwarts-wide.webp', '/journey/hogwarts-portrait.webp'],
  ['/film/ocean-wide.webp', '/film/ocean-portrait.webp'],
  ['/journey/newyork-wide.webp', '/journey/newyork-portrait.webp'],
];

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
