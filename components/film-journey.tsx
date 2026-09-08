'use client';

import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'motion/react';
import { FILM_LENGTH } from '@/lib/cinematic-director';
import type { FilmRenderer } from '@/lib/cinematic-renderer';

type Props = { progress: MotionValue<number>; width: number; height: number; portrait: boolean; reduced: boolean; playing: boolean; onReady: () => void; onError: () => void };

export function FilmJourney({ progress, width, height, portrait, reduced, playing, onReady, onError }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<FilmRenderer | null>(null);
  const currentSize = useRef({ width, height, portrait });
  const currentPlaying = useRef(playing);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    currentSize.current = { width, height, portrait };
    controller.current?.resize(currentSize.current);
  }, [width, height, portrait]);
  useEffect(() => { currentPlaying.current = playing; controller.current?.setPlaying(playing); }, [playing]);

  useEffect(() => {
    if (reduced) { const id = requestAnimationFrame(onReady); return () => cancelAnimationFrame(id); }
    if (!canvas.current) return;
    const element = canvas.current;
    const measuredWidth = element.clientWidth, measuredHeight = element.clientHeight;
    if (measuredWidth && measuredHeight) currentSize.current = { width: measuredWidth, height: measuredHeight, portrait: measuredWidth <= 700 && measuredHeight > measuredWidth };
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const fail = () => { if (active) { setFailed(true); onError(); } };
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    element.addEventListener('webglcontextlost', lost);
    import('@/lib/cinematic-renderer').then(module => module.createCinematicRenderer(element, currentSize.current)).then(film => {
      if (!active) { film.dispose(); return; }
      controller.current = film;
      film.resize(currentSize.current);
      film.render(progress.get() * FILM_LENGTH);
      film.setPlaying(currentPlaying.current);
      setFailed(false);
      unsubscribe = progress.on('change', value => film.render(value * FILM_LENGTH));
      onReady();
    }).catch(fail);
    return () => { active = false; unsubscribe?.(); controller.current?.dispose(); controller.current = null; element.removeEventListener('webglcontextlost', lost); };
  }, [progress, reduced, onReady, onError]);

  return <div className="film-journey" aria-hidden="true">
    <picture className="film-fallback">
      <source media="(max-width:700px) and (orientation:portrait)" srcSet="/journey/newyork-portrait.webp" />
      <img src="/journey/newyork-wide.webp" width="1672" height="941" alt="" />
    </picture>
    {!reduced && <canvas ref={canvas} className="cinematic-canvas" style={{ visibility: failed ? 'hidden' : 'visible' }} />}
  </div>;
}
