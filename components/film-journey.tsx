'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { directFilm, FILM_LENGTH } from '@/lib/cinematic-director';
import { BACKGROUNDS, type FilmRenderer } from '@/lib/film-assets';

type Props = { progress: MotionValue<number>; width: number; height: number; portrait: boolean; reduced: boolean; playing: boolean; retry: number; onReady: () => void; onError: () => void };

export function FilmJourney({ progress, width, height, portrait, reduced, playing, retry, onReady, onError }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const controller = useRef<FilmRenderer | null>(null);
  const currentSize = useRef({ width, height, portrait });
  const currentPlaying = useRef(playing);
  const [location, setLocation] = useState(0);
  useMotionValueEvent(progress, 'change', value => setLocation(directFilm(value * FILM_LENGTH, portrait).index));

  useEffect(() => {
    currentSize.current = { width, height, portrait };
    controller.current?.resize(currentSize.current);
  }, [width, height, portrait]);
  useEffect(() => { currentPlaying.current = playing; controller.current?.setPlaying(playing); }, [playing]);

  useEffect(() => {
    if (!surface.current) return;
    const element = surface.current;
    const measuredWidth = element.clientWidth, measuredHeight = element.clientHeight;
    if (measuredWidth && measuredHeight) currentSize.current = { width: measuredWidth, height: measuredHeight, portrait: measuredWidth <= 700 && measuredHeight > measuredWidth };
    let active = true;
    let generation = 0;
    let removeLostListener: (() => void) | undefined;
    async function startEngine(useCanvas: boolean) {
      const ownGeneration = ++generation;
      removeLostListener?.();
      controller.current?.dispose(); controller.current = null;
      // Each async mount owns a fresh canvas, including React's development remount.
      const canvas = document.createElement('canvas');
      canvas.className = 'cinematic-canvas';
      let film: FilmRenderer | undefined;
      try {
        if (useCanvas) {
          const module = await import('@/lib/canvas-film-renderer');
          if (!active || ownGeneration !== generation) return;
          film = await module.createCanvasFilmRenderer(canvas, currentSize.current, reduced);
        } else {
          const module = await import('@/lib/cinematic-renderer');
          if (!active || ownGeneration !== generation) return;
          film = await module.createCinematicRenderer(canvas, currentSize.current);
        }
        if (!active || ownGeneration !== generation) { film.dispose(); return; }
        film.resize(currentSize.current);
        film.render(progress.get() * FILM_LENGTH);
        film.setPlaying(currentPlaying.current);
        controller.current = film;
        element.replaceChildren(canvas);
        const lost = (event: Event) => {
          event.preventDefault();
          if (active) void startEngine(true);
        };
        canvas.addEventListener('webglcontextlost', lost);
        removeLostListener = () => canvas.removeEventListener('webglcontextlost', lost);
        onReady();
      } catch (error) {
        film?.dispose();
        if (!active || ownGeneration !== generation) return;
        if (!useCanvas) {
          console.warn('The film is switching to Canvas rendering.', error);
          void startEngine(true);
        } else {
          console.error('The film could not be loaded.', error);
          element.replaceChildren(); onError();
        }
      }
    }
    const unsubscribe = progress.on('change', value => controller.current?.render(value * FILM_LENGTH));
    void startEngine(reduced);
    return () => {
      active = false; generation++; unsubscribe(); removeLostListener?.();
      controller.current?.dispose(); controller.current = null; element.replaceChildren();
    };
  }, [progress, reduced, retry, onReady, onError]);

  return <div className="film-journey" aria-hidden="true">
    <picture className="film-fallback">
      <source media="(max-width:700px) and (orientation:portrait)" srcSet={BACKGROUNDS[location][1]} />
      <img src={BACKGROUNDS[location][0]} width="1672" height="941" alt="" />
    </picture>
    <div ref={surface} className="cinematic-surface" style={{ position: 'absolute', inset: 0 }} />
  </div>;
}
