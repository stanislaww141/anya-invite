'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, cubicBezier, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { ArrowDownToLine, ArrowUpRight, Heart, MapPin, Music2, Pause, Play, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { FilmJourney } from '@/components/film-journey';
import { STORY_DURATION, storyBeat } from '@/lib/story-timeline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { assetUrl } from '@/lib/asset-url';

const MAP = 'https://yandex.ru/maps/?text=' + encodeURIComponent('Ресторан SOMA Москва Петровский бульвар 14');
const ease = cubicBezier(.65, 0, .35, 1);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Link-preview crawlers must not extract the invitation from the static HTML.
  // Mount the complete experience in the browser, with its original effects.
  return mounted ? <Invitation /> : null;
}

function Invitation() {
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const [started, setStarted] = useState(false);
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [filmRetry, setFilmRetry] = useState(0);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const [soundWanted, setSoundWanted] = useState(true);
  const stageRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<{ stop: () => void; pause: () => void; play: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioWanted = useRef(false);
  const audioRequest = useRef(0);
  const beatRef = useRef(0);

  const portrait = viewport.width <= 700 && viewport.height > viewport.width;
  const leftCurtain = useTransform(progress, v => -106 * ease(Math.min(v * STORY_DURATION / 2.2, 1)) + '%');
  const rightCurtain = useTransform(progress, v => 106 * ease(Math.min(v * STORY_DURATION / 2.2, 1)) + '%');
  const curtainOpacity = useTransform(progress, [0, 2.1 / STORY_DURATION, 2.3 / STORY_DURATION, 1], [1, 1, 0, 0]);
  const openingOpacity = useTransform(progress, [0, .3 / STORY_DURATION, 1.1 / STORY_DURATION, 1], [1, 1, 0, 0]);

  useMotionValueEvent(progress, 'change', value => {
    const next = storyBeat(value * STORY_DURATION);
    if (next !== beatRef.current) { beatRef.current = next; setBeat(next); }
  });

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const handleFilmReady = useCallback(() => { setAssetError(false); setReady(true); }, []);
  const handleFilmError = useCallback(() => {
    setAssetError(true);
    setReady(false);
    audioWanted.current = false;
    audioRef.current?.pause();
    timeline.current?.stop();
    setStarted(false);
    setPaused(false);
    progress.set(0);
  }, [progress]);

  const playMusic = useCallback((rewind = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++audioRequest.current;
    audioWanted.current = true;
    setMusicError(false);
    if (audio.error) audio.load();
    audio.volume = .45;
    if (rewind) audio.currentTime = 0;
    // Call play in the original click handler, preserving mobile user activation.
    void audio.play().then(() => {
      if (!audioWanted.current) audio.pause();
    }).catch(() => {
      if (request !== audioRequest.current || !audioWanted.current) return;
      setMusicPlaying(false);
      setMusicError(true);
      setMusicOpen(true);
    });
  }, []);

  const stopMusic = useCallback(() => {
    audioRequest.current++;
    audioWanted.current = false;
    audioRef.current?.pause();
  }, []);

  function startStory() {
    timeline.current?.stop();
    progress.set(0);
    setStarted(true);
    setPaused(false);
    if (soundWanted) playMusic(true);
    timeline.current = animate(progress, 1, { duration: reduce ? 16 : STORY_DURATION, ease: 'linear' });
  }

  function retryFilm() {
    setAssetError(false);
    setReady(false);
    setFilmRetry(value => value + 1);
  }

  function togglePause() {
    if (paused) { timeline.current?.play(); if (soundWanted) playMusic(); }
    else { timeline.current?.pause(); stopMusic(); }
    setPaused(value => !value);
  }

  useEffect(() => {
    if (beat === 6) headingRef.current?.focus({ preventScroll: true });
  }, [beat]);

  useEffect(() => {
    const hidden = () => {
      if (!document.hidden) return;
      if (progress.get() > 0 && progress.get() < 1) { timeline.current?.pause(); setPaused(true); }
      stopMusic();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      timeline.current?.stop();
      stopMusic();
    };
  }, [progress, stopMusic]);

  const invite = beat === 6;
  const cinematic = started && !invite;

  return (
    <Collapsible open={musicOpen} onOpenChange={setMusicOpen}>
    <main ref={stageRef} className={'theater' + (invite ? ' is-invitation' : '')} data-paused={paused} data-reduced={reduce || undefined}>
      <FilmJourney progress={progress} width={viewport.width} height={viewport.height} portrait={portrait} reduced={!!reduce} playing={cinematic && !paused} retry={filmRetry} onReady={handleFilmReady} onError={handleFilmError} />
      <div className="scene-vignette" aria-hidden="true" />

      <motion.div className="curtain curtain-left" style={{ x: reduce ? 0 : leftCurtain, opacity: curtainOpacity }} aria-hidden="true" />
      <motion.div className="curtain curtain-right" style={{ x: reduce ? 0 : rightCurtain, opacity: curtainOpacity }} aria-hidden="true" />

      <header className="scene-header">
        <div className="scene-controls">
          {cinematic && <Button className="round-control" onClick={togglePause} aria-label={paused ? 'Продолжить анимацию' : 'Поставить анимацию на паузу'} title={paused ? 'Продолжить' : 'Пауза'}>{paused ? <Play /> : <Pause />}</Button>}
          {started && <CollapsibleTrigger render={<Button className="round-control" />} aria-label="Музыка из Рио" title="Музыка из Рио">{musicPlaying ? <Volume2 /> : <Music2 />}</CollapsibleTrigger>}
        </div>
      </header>

      {beat === 0 && <motion.section className="opening" style={{ opacity: openingOpacity, pointerEvents: started ? 'none' : 'auto' }} inert={started} aria-labelledby="opening-title">
        <h1 id="opening-title"><span>Аня,</span>полетели?</h1>
        <p className="opening-copy">У меня для тебя маленькое приключение.<br />И одно очень особенное приглашение.</p>
        <Button className="gold-button start-button" disabled={!ready && !assetError} onClick={assetError ? retryFilm : startStory}>
          {assetError ? 'Попробовать ещё раз' : ready ? 'Открыть' : 'Готовим путешествие…'}
        </Button>
        {assetError && <p role="status" className="opening-copy">Путешествие не загрузилось. Давай попробуем ещё раз.</p>}
      </motion.section>}

      <AnimatePresence>
        {invite && <motion.section className="invitation-wrap" aria-labelledby="date-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? .16 : .7 }}>
          <motion.article className="date-card" initial={{ y: reduce ? 0 : 22, scale: reduce ? 1 : .97 }} animate={{ y: 0, scale: 1 }} transition={{ duration: reduce ? .16 : .8, ease: [.22, 1, .36, 1] }}>
            <div className="card-birds" aria-hidden="true"><span className="perched blu" /><Heart size={20} /><span className="perched jewel" /></div>
            <p className="card-eyebrow">ПРОДОЛЖЕНИЕ НАШЕЙ ИСТОРИИ</p>
            <h2 id="date-title" tabIndex={-1} ref={headingRef}><span>Аня,</span>у нас свидание.</h2>
            <p className="card-copy">Приглашаю тебя на ужин.<br />Ты, я и целый вечер друг для друга.</p>
            <div className="date-details">
              <div><strong>13</strong><span>сентября · воскресенье</span></div>
              <span className="detail-divider" aria-hidden="true" />
              <div><strong>18:00</strong></div>
            </div>
            <div className="restaurant"><span>SOMA</span><p>РЕСТОРАН · МОСКВА</p></div>
            <p className="address"><MapPin size={15} aria-hidden="true" />Петровский бульвар, 14</p>
            <div className="date-actions">
              <a className={buttonVariants({ size: 'lg' }) + ' gold-button'} href={assetUrl('/date-with-you.ics')} download="Свидание-с-Аней.ics">Сохранить свидание<ArrowDownToLine size={17} aria-hidden="true" /></a>
              <a href={MAP} target="_blank" rel="noopener noreferrer" className="map-link">Место нашей встречи<ArrowUpRight size={16} /><span className="sr-only"> — карта в новой вкладке</span></a>
            </div>
          </motion.article>
          <Button className="replay-button" onClick={startStory} disabled={!ready}><RotateCcw size={15} />Полетаем ещё раз?</Button>
        </motion.section>}
      </AnimatePresence>

      <CollapsibleContent keepMounted render={<aside />} id="rio-music" className={'music-dock' + (musicOpen ? ' is-open' : '')} aria-label="Музыка из мультфильма Рио" inert={!musicOpen}>
        <div className="music-header"><span><Music2 size={15} /> МУЗЫКА ИЗ «РИО»</span><Button className="close-music" onClick={() => setMusicOpen(false)} aria-label="Закрыть плеер"><X size={18} /></Button></div>
        <p>Hot Wings (I Wanna Party)</p>
        <p className="music-help">will.i.am · Jamie Foxx</p>
        <div className="music-actions"><Button className="music-toggle" onClick={() => { if (musicPlaying) { stopMusic(); setSoundWanted(false); } else { setSoundWanted(true); playMusic(); } }}>{musicPlaying ? <Pause size={15} /> : <Play size={15} />}{musicPlaying ? 'Пауза' : 'Включить музыку'}</Button></div>
        {musicError && <p className="music-help" role="status">Не получилось включить звук. Нажми «Включить музыку» ещё раз.</p>}
      </CollapsibleContent>

      <audio ref={audioRef} src={assetUrl('/audio/hot-wings.mp3')} preload="auto" loop
        onPlaying={() => { setMusicPlaying(true); setMusicError(false); }}
        onPause={() => setMusicPlaying(false)}
        onError={() => { setMusicPlaying(false); setMusicError(true); }}
      />
      <footer className="scene-footer"><span>{invite ? '13 СЕНТЯБРЯ · ТЫ + Я' : ''}</span><span className="footer-love"><Sparkles size={13} />с любовью, для Ани</span></footer>
      <noscript><div className="no-script"><h1>Аня, у нас свидание.</h1><p>Ресторан SOMA · 13 сентября 2026, 18:00 (Москва).</p><p>Петровский бульвар, 14.</p><a href={assetUrl('/date-with-you.ics')} download>Сохранить в календарь</a></div></noscript>
    </main>
    </Collapsible>
  );
}

