'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';
import Image from 'next/image';
import { smoothPath } from '@/lib/rio-motion';
import { FLIGHT_PHONE_X, FLIGHT_PHONE_Y, FLIGHT_TIMES, FLIGHT_WIDE_X, FLIGHT_WIDE_Y, PORTRAIT_MEDIA, SCENES, STORY_DURATION, sceneOpacity } from '@/lib/story-timeline';

type JourneyProps = { progress: MotionValue<number>; width: number; height: number; portrait: boolean; reduced: boolean };
const poses = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];

function spiderAt(t: number, width: number, height: number, portrait: boolean) {
  const size = portrait ? Math.min(width * .48, 210) : Math.min(width * .2, 250);
  const x = width * (portrait ? .67 : .65) + Math.sin(Math.max(0, t - 27) * 1.7) * (portrait ? 7 : 11);
  const y = smoothPath(t, [0, 26.7, 28.1, 29.1, 31.2, 32.8, 38], [-height * .9, -height * .9, height * .18, height * .145, height * .145, -height * .9, -height * .9]);
  return { x, y, size };
}

function SceneLayer({ clock, index, width, height, portrait, occlusion = false }: { clock: MotionValue<number>; index: number; width: number; height: number; portrait: boolean; occlusion?: boolean }) {
  const scene = SCENES[index];
  const enter = scene.enter;
  const opacity = useTransform(clock, t => sceneOpacity(t, index, occlusion));
  const scale = useTransform(clock, [enter, enter + 2, scene.leave], [1.07, 1.035, 1.095]);
  const x = useTransform(clock, [enter, scene.leave], [index % 2 ? '-1.5%' : '1.5%', index % 2 ? '1.5%' : '-1.5%']);
  const y = useTransform(clock, [enter, scene.leave], [index === 1 ? '-1%' : '0%', index === 1 ? '1.6%' : '-.5%']);
  return <motion.div className={'journey-scene scene-' + scene.id + (occlusion ? ' journey-occlusion' : '')} style={{ opacity, scale, x, y }} aria-hidden="true">
    <picture style={{ width: Math.max(width, height * (portrait ? 941 / 1672 : 1672 / 941)), height: Math.max(height, width * (portrait ? 1672 / 941 : 941 / 1672)) }}>
      <source media={PORTRAIT_MEDIA} srcSet={scene.portrait} />
      <img src={scene.wide} alt="" width="1672" height="941" fetchPriority={index === 0 ? 'high' : 'auto'} />
    </picture>
  </motion.div>;
}

function Bird({ name, clock, width, height, portrait }: { name: 'blu' | 'jewel'; clock: MotionValue<number>; width: number; height: number; portrait: boolean }) {
  const jewel = name === 'jewel';
  const pathX = portrait ? FLIGHT_PHONE_X : FLIGHT_WIDE_X;
  const pathY = portrait ? FLIGHT_PHONE_Y : FLIGHT_WIDE_Y;
  const x = useTransform(clock, t => (smoothPath(t, FLIGHT_TIMES, pathX) + (jewel ? .105 : 0)) * width);
  const y = useTransform(clock, t => (smoothPath(t, FLIGHT_TIMES, pathY) - (jewel ? .055 : 0)) * height);
  const scale = useTransform(clock, [0, 2, 3.8, 5.1, 6.5, 7.8, 9, 12, 15, 17.5, 20, 23, 25.8, 28, 31, 33, 35, 36, 38], [.7, .85, .75, .36, .47, .9, .76, .67, .78, .75, .93, .6, .8, .65, .58, .7, .53, .5, .5]);
  const rotate = useTransform(clock, t => smoothPath(t, FLIGHT_TIMES, [-12, -16, -18, -5, 26, 12, -18, 8, 25, -14, 16, 22, -9, -14, -18, 12, 18, -20, 7, 14, 3, 14, 3, -12, -5, -5]));
  const facing = useTransform(clock, t => {
    const velocity = smoothPath(Math.min(38, t + .09), FLIGHT_TIMES, pathX) - smoothPath(Math.max(0, t - .09), FLIGHT_TIMES, pathX);
    return Math.max(-1, Math.min(1, velocity * 420));
  });
  const opacity = useTransform(clock, [0, 1.3, 2.1, 34.6, 35.6, 38], [0, 0, 1, 1, 0, 0]);
  const zIndex = useTransform(clock, t => t > 4.3 && t < 6.15 ? 4 : 9);
  const frame = useTransform(clock, t => poses[Math.floor(t * (jewel ? 8.5 : 9)) % 4]);
  const alignY = useTransform(clock, t => jewel && Math.floor(t * 8.5) % 4 >= 2 ? '5%' : '0%');
  return <motion.div className={'journey-bird ' + name} style={{ x, y, scale, rotate, opacity, zIndex }} aria-hidden="true">
    <motion.div className="bird-facing" style={{ scaleX: facing }}><motion.div className={'bird-frames ' + name} style={{ backgroundPosition: frame, y: alignY }} /></motion.div>
  </motion.div>;
}

function Snitch({ clock, width, height, portrait }: { clock: MotionValue<number>; width: number; height: number; portrait: boolean }) {
  const times = [0, 6.4, 7.1, 8.4, 9.5, 10.7, 11.9, 13.2, 14.3, 15.3, 16.2, 17.2, 38];
  const x = useTransform(clock, t => smoothPath(t, times, [1.2, 1.2, .78, .35, .66, .35, .71, .8, .55, .77, .97, 1.25, 1.25]) * width);
  const y = useTransform(clock, t => smoothPath(t, times, [.23, .23, .3, .22, .18, .32, .2, .37, .32, .42, .35, .17, .17]) * height);
  const rotate = useTransform(clock, t => Math.sin(t * 3.6) * 13);
  const scale = useTransform(clock, [0, 6.4, 8, 10, 13, 16, 17.2, 38], [.7, .7, 1, .72, 1.03, .8, .55, .55]);
  const opacity = useTransform(clock, [0, 6.4, 7, 16.3, 17.2, 38], [0, 0, 1, 1, 0, 0]);
  const pulse = useTransform(clock, t => .6 + Math.sin(t * 5) * .16);
  const flutter = useTransform(clock, t => 1 + Math.sin(t * 52) * .065);
  return <motion.div className="golden-snitch" style={{ x, y, rotate, scale, opacity, width: portrait ? 87 : 108 }} aria-hidden="true">
    <motion.span className="snitch-glow" style={{ opacity: pulse }} />
    <motion.img src="/journey/snitch.webp" alt="" width="1254" height="1254" style={{ scaleY: flutter, originY: .7 }} />
  </motion.div>;
}

function SpiderDelivery({ clock, width, height, portrait }: { clock: MotionValue<number>; width: number; height: number; portrait: boolean }) {
  const actorWidth = spiderAt(0, width, height, portrait).size;
  const x = useTransform(clock, t => spiderAt(t, width, height, portrait).x);
  const y = useTransform(clock, t => spiderAt(t, width, height, portrait).y);
  const rotate = useTransform(clock, t => Math.sin(Math.max(0, t - 27) * 1.7) * 3);
  const opacity = useTransform(clock, [0, 26.5, 27, 31.6, 32.5, 38], [0, 0, 1, 1, 0, 0]);
  const threadHeight = useTransform(y, value => Math.max(0, value + 3));
  const threadX = useTransform(x, value => value + actorWidth * .035);
  return <>
    <motion.div className="spider-thread" style={{ x: threadX, height: threadHeight, opacity }} aria-hidden="true" />
    <motion.div className="spider-actor" style={{ x, y, rotate, opacity, width: actorWidth }} aria-hidden="true"><Image src="/journey/spiderman.webp" alt="" width={604} height={1026} unoptimized /></motion.div>
  </>;
}

function Envelope({ clock, width, height, portrait }: { clock: MotionValue<number>; width: number; height: number; portrait: boolean }) {
  const letterWidth = portrait ? Math.min(width * .95, 405) : 475;
  const x = useTransform(clock, t => {
    const hand = spiderAt(t, width, height, portrait);
    const release = spiderAt(30.2, width, height, portrait);
    return t <= 30.2 ? hand.x : smoothPath(t, [30.2, 31.4, 32.8, 34.1, 38], [release.x, width * .51, width * .48, width * .5, width * .5]);
  });
  const y = useTransform(clock, t => {
    const hand = spiderAt(Math.min(t, 30.2), width, height, portrait);
    const handY = hand.y + hand.size * (403 / 604) - letterWidth * .28 * .11;
    return t <= 30.2 ? handY : smoothPath(t, [30.2, 31.4, 32.8, 34.1, 38], [handY, height * .4, height * .46, height * .46, height * .46]);
  });
  const scale = useTransform(clock, [0, 29.2, 30.2, 31.4, 33, 34.2, 35.4, 36.4, 38], [.28, .28, .28, .39, .67, 1, 1.05, 1.1, 1.1]);
  const rotate = useTransform(clock, [0, 29.2, 30.7, 31.8, 33.4, 34.5, 38], [-12, -12, 5, -6, 3, 0, 0]);
  const opacity = useTransform(clock, [0, 29.2, 29.7, 35.8, 36.4, 38], [0, 0, 1, 1, 0, 0]);
  const closed = useTransform(clock, [0, 34.45, 34.8, 38], [1, 1, 0, 0]);
  const opened = useTransform(clock, [0, 34.45, 34.8, 38], [0, 0, 1, 1]);
  const letterLift = useTransform(clock, [34.45, 35.6], ['5%', '0%']);
  return <motion.div className="letter-delivery" style={{ x, y, scale, rotate, opacity, width: letterWidth }} aria-hidden="true">
    <motion.div className="envelope-frame envelope-closed" style={{ opacity: closed }} />
    <motion.div className="envelope-frame envelope-opened" style={{ opacity: opened, y: letterLift }} />
  </motion.div>;
}

function CloudPassage({ clock }: { clock: MotionValue<number> }) {
  const opacity = useTransform(clock, [0, 23.65, 24.45, 24.8, 26.1, 38], [0, 0, .95, .95, 0, 0]);
  const left = useTransform(clock, [23.65, 24.55, 26.1], ['6%', '0%', '-110%']);
  const right = useTransform(clock, [23.65, 24.55, 26.1], ['-6%', '0%', '110%']);
  return <motion.div className="cloud-passage" style={{ opacity }} aria-hidden="true">
    <motion.div className="cloud-panel cloud-left" style={{ x: left }} />
    <motion.div className="cloud-panel cloud-right" style={{ x: right }} />
  </motion.div>;
}

function MagicDust({ clock }: { clock: MotionValue<number> }) {
  const opacity = useTransform(clock, [0, 6.5, 8.5, 15.5, 17, 33, 34, 36, 38], [0, 0, .8, .7, 0, 0, .7, .3, 0]);
  return <motion.div className="magic-dust" style={{ opacity }} aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <Mote key={i} clock={clock} index={i} />)}</motion.div>;
}

function Mote({ clock, index }: { clock: MotionValue<number>; index: number }) {
  const y = useTransform(clock, t => Math.sin(t * .38 + index * 2.3) * 22 + 'px');
  const opacity = useTransform(clock, t => .2 + Math.max(0, Math.sin(t * 1.1 + index)) * .7);
  return <motion.i style={{ left: ((index * 43 + 7) % 100) + '%', top: ((index * 37 + 13) % 78) + '%', y, opacity }} />;
}

export function FilmJourney({ progress, width, height, portrait, reduced }: JourneyProps) {
  const clock = useTransform(progress, v => v * STORY_DURATION);
  return <div className="film-journey" aria-hidden="true">
    {SCENES.map((scene, index) => <SceneLayer key={scene.id} clock={clock} index={index} width={width} height={height} portrait={portrait} />)}
    {!reduced && <>
      <SceneLayer clock={clock} index={0} width={width} height={height} portrait={portrait} occlusion />
      <Bird name="blu" clock={clock} width={width} height={height} portrait={portrait} />
      <Bird name="jewel" clock={clock} width={width} height={height} portrait={portrait} />
      <Snitch clock={clock} width={width} height={height} portrait={portrait} />
      <SpiderDelivery clock={clock} width={width} height={height} portrait={portrait} />
      <Envelope clock={clock} width={width} height={height} portrait={portrait} />
      <MagicDust clock={clock} />
      <CloudPassage clock={clock} />
    </>}
  </div>;
}
