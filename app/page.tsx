'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, animate, cubicBezier, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Heart, MapPin, Music2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { smoothPath } from '@/lib/rio-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const TRACK = 'https://soundcloud.com/interscope/04-hot-wings-i-wanna-party';
const PLAYER = 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F12744132&color=%23ffb66d&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false';
const MAP = 'https://yandex.ru/maps/?text=' + encodeURIComponent('Ресторан SOMA Москва Петровский бульвар 14');
const DURATION = 20;
const ease = cubicBezier(.65, 0, .35, 1);
const poses = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];
const cues = [0, .10, .18, .25, .31, .38, .45, .54, .63, .73, .84, 1];
const assets = ['rio-night', 'blu-sprite', 'jewel-sprite', 'curtains'];

type Widget = { bind: (name: string, fn: () => void) => void; unbind: (name: string) => void; play: () => void; pause: () => void; seekTo: (time: number) => void; setVolume: (volume: number) => void; };
type SoundCloud = { Widget: ((frame: HTMLIFrameElement) => Widget) & { Events: Record<string, string> } };
declare global { interface Window { SC?: SoundCloud } }

function FlyingBird({ name, progress, width, height }: { name: 'blu' | 'jewel'; progress: MotionValue<number>; width: number; height: number }) {
  const jewel = name === 'jewel';
  const xPath = jewel
    ? [-.12, .03, .19, .37, .44, .30, .24, .49, .69, .84, 1.05, 1.05]
    : [-.20, -.06, .12, .29, .38, .38, .28, .43, .62, .77, 1.10, 1.10];
  const yPath = jewel
    ? [.52, .44, .26, .17, .26, .38, .26, .22, .48, .34, .12, .12]
    : [.64, .53, .31, .17, .16, .31, .39, .28, .41, .47, .21, .21];
  const x = useTransform(progress, v => smoothPath(v, cues, xPath) * width);
  const y = useTransform(progress, v => smoothPath(v, cues, yPath) * height);
  const scale = useTransform(progress, cues, [.72, .9, .72, .38, .32, .76, 1.10, .93, 1.04, .7, .45, .45]);
  const rotate = useTransform(progress, cues, [-14, -9, -20, -10, 12, 28, 12, -14, 18, -12, -22, -22]);
  const facing = useTransform(progress, [.31, .34, .45, .48], [1, -1, -1, 1]);
  const zIndex = useTransform(progress, v => v > .20 && v < .34 ? 2 : 6);
  const opacity = useTransform(progress, [0, .045, .075, .81, .85, 1], [0, 0, 1, 1, 0, 0]);
  const position = useTransform(progress, v => poses[Math.floor(v * DURATION * (jewel ? 7.5 : 8)) % 4]);
  const alignY = useTransform(progress, v => {
    const frame = Math.floor(v * DURATION * (jewel ? 7.5 : 8)) % 4;
    return jewel && frame >= 2 ? '5%' : '0%';
  });
  return <motion.div className={'flying-bird ' + name} style={{ x, y, scale, rotate, zIndex, opacity }} aria-hidden="true">
    <motion.div className="bird-facing" style={{ scaleX: facing }}>
      <motion.div className={'bird-frames ' + name} style={{ backgroundPosition: position, y: alignY }} />
    </motion.div>
  </motion.div>;
}

const confetti = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 67 + 13) % 100,
  delay: (i % 12) * .13,
  duration: 3.6 + (i % 7) * .3,
  color: ['#ffd879', '#ff748c', '#60e3ef', '#ba96ff', '#fff2c6'][i % 5],
  rotate: i * 37,
}));

export default function Home() {
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const [started, setStarted] = useState(false);
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
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

  const width = Math.max(viewport.width, viewport.height * 1672 / 941);
  const height = Math.max(viewport.height, viewport.width * 941 / 1672);
  const overflow = width - viewport.width;
  const cameraX = useTransform(progress, v => -overflow * smoothPath(v, [0, .16, .36, .59, .76, .86, 1], [.24, .24, .24, .59, .80, .38, .38]));
  const cameraScale = useTransform(progress, [0, .15, .39, .61, .84, 1], [1.035, 1.035, 1.08, 1.025, 1, 1]);
  const leftCurtain = useTransform(progress, v => -106 * ease(Math.min(v / .11, 1)) + '%');
  const rightCurtain = useTransform(progress, v => 106 * ease(Math.min(v / .11, 1)) + '%');
  const curtainOpacity = useTransform(progress, [0, .10, .115, 1], [1, 1, 0, 0]);
  const openingOpacity = useTransform(progress, [0, .015, .055, 1], [1, 1, 0, 0]);

  useMotionValueEvent(progress, 'change', value => {
    const next = value >= .84 ? 4 : value >= .62 ? 3 : value >= .37 ? 2 : value >= .10 ? 1 : 0;
    if (next !== beatRef.current) { beatRef.current = next; setBeat(next); }
  });

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all(assets.map(name => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = '/rio/' + name + '.webp';
    }))).then(() => { if (active) setReady(true); }).catch(() => { if (active) setAssetError(true); });
    return () => { active = false; };
  }, []);

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
    setRun(v => v + 1);
    setStarted(true);
    setPaused(false);
    if (soundWanted) playMusic(true);
    if (reduce) progress.set(1);
    else timeline.current = animate(progress, 1, { duration: DURATION, ease: 'linear' });
  }

  function showInvite() {
    timeline.current?.stop();
    setStarted(true);
    setPaused(false);
    progress.set(1);
  }

  function togglePause() {
    if (paused) { timeline.current?.play(); if (soundWanted) playMusic(); }
    else { timeline.current?.pause(); stopMusic(); }
    setPaused(value => !value);
  }

  useEffect(() => {
    if (beat === 4) headingRef.current?.focus({ preventScroll: true });
  }, [beat]);

  useEffect(() => {
    if (reduce && started && progress.get() < 1) {
      timeline.current?.stop();
      progress.set(1);
      setPaused(false);
    }
  }, [reduce, started, progress]);

  useEffect(() => {
    const hidden = () => {
      if (!document.hidden) return;
      if (progress.get() > 0 && progress.get() < 1) { timeline.current?.pause(); setPaused(true); }
      pendingMusic.current = false;
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

  const invite = beat === 4;
  const cinematic = started && !invite;

  return (
    <Collapsible open={musicOpen} onOpenChange={setMusicOpen}>
    <main ref={stageRef} className={'theater' + (invite ? ' is-invitation' : '')} data-paused={paused} data-reduced={reduce || undefined}>
      <motion.div className="world" style={{ width, height, x: cameraX, scale: cameraScale }} aria-hidden="true">
        <img className="rio-background" src="/rio/rio-night.webp" width="1672" height="941" alt="" fetchPriority="high" />
        <FlyingBird name="blu" progress={progress} width={width} height={height} />
        <FlyingBird name="jewel" progress={progress} width={width} height={height} />
        <img className="landmark-occlusion" src="/rio/rio-night.webp" width="1672" height="941" alt="" />
      </motion.div>
      <div className="scene-vignette" aria-hidden="true" />
      <div className="night-glow" data-carnival={beat >= 3 || undefined} aria-hidden="true" />

      <motion.div className="curtain curtain-left" style={{ x: leftCurtain, opacity: curtainOpacity }} aria-hidden="true" />
      <motion.div className="curtain curtain-right" style={{ x: rightCurtain, opacity: curtainOpacity }} aria-hidden="true" />

      <header className="scene-header">
        <div className="small-dedication"><Heart size={17} strokeWidth={1.5} aria-hidden="true" /><span>ОДНА ИСТОРИЯ. ТОЛЬКО ДЛЯ ТЕБЯ.</span></div>
        <div className="scene-controls">
          {cinematic && <Button className="round-control" onClick={togglePause} aria-label={paused ? 'Продолжить анимацию' : 'Поставить анимацию на паузу'} title={paused ? 'Продолжить' : 'Пауза'}>{paused ? <Play /> : <Pause />}</Button>}
          <CollapsibleTrigger render={<Button className="round-control" />} aria-label="Музыка из Рио" title="Музыка из Рио">{musicPlaying ? <Volume2 /> : <Music2 />}</CollapsibleTrigger>
          {cinematic && <Button className="skip-story" onClick={showInvite}>К приглашению <ArrowRight size={15} /></Button>}
        </div>
      </header>

      {beat === 0 && <motion.section className="opening" style={{ opacity: openingOpacity, pointerEvents: started ? 'none' : 'auto' }} inert={started} aria-labelledby="opening-title">
        <p className="opening-eyebrow">СЕГОДНЯ ГЛАВНАЯ ГЕРОИНЯ — ТЫ</p>
        <h1 id="opening-title"><span>Аня,</span>полетели?</h1>
        <p className="opening-copy">У меня для тебя маленькое приключение.<br />И одно очень особенное приглашение.</p>
        <Button className="gold-button start-button" disabled={!ready} onClick={startStory}>
          {ready ? <><Play size={17} fill="currentColor" /> Открыть моё Рио</> : assetError ? 'Сцена пока не загрузилась' : 'Готовим путешествие…'}
        </Button>
        <button className="sound-choice" aria-pressed={soundWanted} onClick={() => setSoundWanted(v => !v)}>{soundWanted ? <Volume2 size={15} /> : <VolumeX size={15} />}{soundWanted ? 'С музыкой из «Рио»' : 'Без музыки'}</button>
        <button className="opening-skip" onClick={showInvite}>{reduce ? 'Открыть приглашение без анимации' : 'Сразу к приглашению'}<ArrowRight size={14} /></button>
      </motion.section>}

      <AnimatePresence mode="wait">
        {cinematic && beat > 0 && <motion.div key={beat} className={'story-caption beat-' + beat} role="status" initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6 }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}>
          <span className="caption-place">{beat === 1 ? 'РИО-ДЕ-ЖАНЕЙРО' : beat === 2 ? 'ГДЕ-ТО НАД КОПАКАБАНОЙ' : 'НАШ МАЛЕНЬКИЙ КАРНАВАЛ'}</span>
          <p>{beat === 1 ? <>У счастья есть крылья.</> : beat === 2 ? <>И тот, с кем хочется лететь.</> : <>С тобой каждый вечер — <em>праздник.</em></>}</p>
        </motion.div>}
      </AnimatePresence>

      {beat >= 3 && !reduce && <div key={run} className="confetti" aria-hidden="true">{confetti.map((piece, i) => <i key={i} style={{ '--x': piece.x + '%', '--delay': piece.delay + 's', '--duration': piece.duration + 's', '--confetti-color': piece.color, '--turn': piece.rotate + 'deg' } as CSSProperties} />)}</div>}

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
            <p className="love-note">Мой любимый маршрут — туда, где ты.</p>
          </motion.article>
          <Button className="replay-button" onClick={startStory} disabled={!ready}><RotateCcw size={15} />Полетаем ещё раз?</Button>
        </motion.section>}
      </AnimatePresence>

      <CollapsibleContent keepMounted render={<aside />} id="rio-music" className={'music-dock' + (musicOpen ? ' is-open' : '')} aria-label="Музыка из мультфильма Рио" inert={!musicOpen}>
        <div className="music-header"><span><Music2 size={15} /> МУЗЫКА ИЗ «РИО»</span><Button className="close-music" onClick={() => setMusicOpen(false)} aria-label="Закрыть плеер"><X size={18} /></Button></div>
        <p>Hot Wings (I Wanna Party)</p>
        <iframe ref={iframeRef} src={PLAYER} width="100%" height="166" scrolling="no" allow="autoplay; encrypted-media" title="Hot Wings — официальный плеер Interscope Records на SoundCloud" />
        <div className="music-actions"><Button className="music-toggle" onClick={() => { if (musicPlaying) { stopMusic(); setSoundWanted(false); } else { setSoundWanted(true); playMusic(); } }}>{musicPlaying ? <Pause size={15} /> : <Play size={15} />}{musicPlaying ? 'Пауза' : 'Включить музыку'}</Button><a href={TRACK} target="_blank" rel="noopener noreferrer">SoundCloud <ArrowUpRight size={13} /></a></div>
        {musicError && <p className="music-help">Плеер недоступен. <a href="https://www.youtube.com/watch?v=Ts2IK1mniXI" target="_blank" rel="noopener noreferrer">Открыть песню на YouTube</a></p>}
        {!musicPlaying && !musicError && <p className="music-help">Если звук не начался, нажми ▶ в плеере.</p>}
      </CollapsibleContent>

      <footer className="scene-footer"><span>{invite ? '13 СЕНТЯБРЯ · ТЫ + Я' : 'НЕМНОГО РИО. МНОГО ЛЮБВИ.'}</span><span className="footer-love"><Sparkles size={13} />с любовью, для Ани</span></footer>
      <noscript><div className="no-script"><h1>Аня, у нас свидание.</h1><p>Ресторан SOMA · 13 сентября 2026, 18:00 (Москва).</p><p>Петровский бульвар, 14.</p><a href="/date-with-you.ics">Сохранить в календарь</a></div></noscript>
    </main>
    </Collapsible>
  );
}

