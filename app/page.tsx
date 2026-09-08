'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, cubicBezier, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { ArrowDownToLine, ArrowUpRight, Heart, MapPin, Music2, Pause, Play, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { FilmJourney } from '@/components/film-journey';
import { STORY_DURATION, storyBeat } from '@/lib/story-timeline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const TRACK = 'https://soundcloud.com/interscope/04-hot-wings-i-wanna-party';
const PLAYER = 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F12744132&color=%23ffb66d&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false';
const MAP = 'https://yandex.ru/maps/?text=' + encodeURIComponent('Ресторан SOMA Москва Петровский бульвар 14');
const ease = cubicBezier(.65, 0, .35, 1);
const places = ['','Рио-де-Жанейро','Хогвартс','Одиссея','Нью-Йорк'];

type Widget = { bind: (name: string, fn: () => void) => void; unbind: (name: string) => void; play: () => void; pause: () => void; seekTo: (time: number) => void; setVolume: (volume: number) => void; };
type SoundCloud = { Widget: ((frame: HTMLIFrameElement) => Widget) & { Events: Record<string, string> } };
declare global { interface Window { SC?: SoundCloud } }

export default function Home() {
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<Widget | null>(null);
  const widgetReady = useRef(false);
  const pendingMusic = useRef(false);
  const playingRef = useRef(false);
  const soundCheck = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    timeline.current?.stop();
    setStarted(false);
    setPaused(false);
    progress.set(0);
  }, [progress]);

  useEffect(() => {
    if (!iframeRef.current) return;
    let disposed = false;
    let attached: Widget | null = null;
    const init = () => {
      if (disposed || !window.SC || !iframeRef.current) return;
      const widget = window.SC.Widget(iframeRef.current);
      const events = window.SC.Widget.Events;
      widgetRef.current = widget;
      attached = widget;
      widget.bind(events.READY, () => {
        widgetReady.current = true;
        widget.setVolume(45);
        if (pendingMusic.current) { pendingMusic.current = false; widget.play(); }
      });
      widget.bind(events.PLAY, () => { playingRef.current = true; setMusicPlaying(true); setMusicError(false); });
      widget.bind(events.PAUSE, () => { playingRef.current = false; setMusicPlaying(false); });
      widget.bind(events.FINISH, () => { playingRef.current = false; setMusicPlaying(false); });
      widget.bind(events.ERROR, () => { setMusicError(true); setMusicPlaying(false); playingRef.current = false; });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-rio-audio]');
    if (window.SC) init();
    else {
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.dataset.rioAudio = 'true';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', init);
      script.addEventListener('error', onError);
    }
    function onError() { setMusicError(true); }
    return () => {
      disposed = true;
      script?.removeEventListener('load', init);
      script?.removeEventListener('error', onError);
      if (attached && window.SC) Object.values(window.SC.Widget.Events).forEach(event => attached?.unbind(event));
      widgetReady.current = false;
    };
  }, []);

  const playMusic = useCallback((rewind = false) => {
    setMusicError(false);
    if (widgetReady.current) {
      if (rewind) widgetRef.current?.seekTo(0);
      widgetRef.current?.play();
    } else pendingMusic.current = true;
    if (soundCheck.current) clearTimeout(soundCheck.current);
    soundCheck.current = setTimeout(() => {
      if (!playingRef.current) setMusicOpen(true);
    }, 3500);
  }, []);

  function stopMusic() {
    pendingMusic.current = false;
    if (soundCheck.current) clearTimeout(soundCheck.current);
    widgetRef.current?.pause();
  }

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
      pendingMusic.current = false;
      if (soundCheck.current) clearTimeout(soundCheck.current);
      widgetRef.current?.pause();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      timeline.current?.stop();
      widgetRef.current?.pause();
      if (soundCheck.current) clearTimeout(soundCheck.current);
    };
  }, [progress]);

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
        <p className="opening-eyebrow">СЕГОДНЯ ГЛАВНАЯ ГЕРОИНЯ — ТЫ</p>
        <h1 id="opening-title"><span>Аня,</span>полетели?</h1>
        <p className="opening-copy">У меня для тебя маленькое приключение.<br />И одно очень особенное приглашение.</p>
        <Button className="gold-button start-button" disabled={!ready && !assetError} onClick={assetError ? retryFilm : startStory}>
          {assetError ? 'Попробовать ещё раз' : ready ? 'Открыть' : 'Готовим путешествие…'}
        </Button>
        {assetError && <p role="status" className="opening-copy">Путешествие не загрузилось. Давай попробуем ещё раз.</p>}
      </motion.section>}

      <AnimatePresence mode="wait">
        {cinematic && beat > 0 && beat < 5 && <motion.output key={beat} className="chapter-caption" initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25, ease: [.22, 1, .36, 1] }}>
          <span className="chapter-number" aria-hidden="true">0{beat}</span>
          <span>{places[beat]}</span>
        </motion.output>}
      </AnimatePresence>

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
              <div><strong>18:00</strong><span>по московскому времени</span></div>
            </div>
            <div className="restaurant"><span>SOMA</span><p>РЕСТОРАН · МОСКВА</p></div>
            <p className="address"><MapPin size={15} aria-hidden="true" />Петровский бульвар, 14</p>
            <div className="date-actions">
              <a className={buttonVariants({ size: 'lg' }) + ' gold-button'} href="/date-with-you.ics" download="Свидание-с-Аней.ics">Сохранить свидание<ArrowDownToLine size={17} aria-hidden="true" /></a>
              <a href={MAP} target="_blank" rel="noopener noreferrer" className="map-link">Место нашей встречи<ArrowUpRight size={16} /><span className="sr-only"> — карта в новой вкладке</span></a>
            </div>
          </motion.article>
          <Button className="replay-button" onClick={startStory} disabled={!ready}><RotateCcw size={15} />Полетаем ещё раз?</Button>
        </motion.section>}
      </AnimatePresence>

      <CollapsibleContent keepMounted render={<aside />} id="rio-music" className={'music-dock' + (musicOpen ? ' is-open' : '')} aria-label="Музыка из мультфильма Рио" inert={!musicOpen}>
        <div className="music-header"><span><Music2 size={15} /> МУЗЫКА ИЗ «РИО»</span><Button className="close-music" onClick={() => setMusicOpen(false)} aria-label="Закрыть плеер"><X size={18} /></Button></div>
        <p>Hot Wings (I Wanna Party)</p>
        <iframe ref={iframeRef} src={PLAYER} width="100%" height="166" allow="autoplay; encrypted-media" title="Hot Wings — официальный плеер Interscope Records на SoundCloud" />
        <div className="music-actions"><Button className="music-toggle" onClick={() => { if (musicPlaying) { stopMusic(); setSoundWanted(false); } else { setSoundWanted(true); playMusic(); } }}>{musicPlaying ? <Pause size={15} /> : <Play size={15} />}{musicPlaying ? 'Пауза' : 'Включить музыку'}</Button><a href={TRACK} target="_blank" rel="noopener noreferrer">SoundCloud <ArrowUpRight size={13} /></a></div>
        {musicError && <p className="music-help">Плеер недоступен. <a href="https://www.youtube.com/watch?v=Ts2IK1mniXI" target="_blank" rel="noopener noreferrer">Открыть песню на YouTube</a></p>}
        {!musicPlaying && !musicError && <p className="music-help">Если звук не начался, нажми ▶ в плеере.</p>}
      </CollapsibleContent>

      <footer className="scene-footer"><span>{invite ? '13 СЕНТЯБРЯ · ТЫ + Я' : ''}</span><span className="footer-love"><Sparkles size={13} />с любовью, для Ани</span></footer>
      <noscript><div className="no-script"><h1>Аня, у нас свидание.</h1><p>Ресторан SOMA · 13 сентября 2026, 18:00 (Москва).</p><p>Петровский бульвар, 14.</p><a href="/date-with-you.ics" download>Сохранить в календарь</a></div></noscript>
    </main>
    </Collapsible>
  );
}

