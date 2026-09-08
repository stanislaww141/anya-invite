import { BACKGROUNDS, loadImage, type FilmRenderer, type FilmSize } from './film-assets';
import { between, birdFormation, deliveryAt, directFilm, wingPose } from './cinematic-director';
import { neutralMatte } from './film-matte';

/** The same story and clock, available on devices without WebGL. */
export async function createCanvasFilmRenderer(canvas: HTMLCanvasElement, initial: FilmSize, reduced = false): Promise<FilmRenderer> {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas rendering is unavailable.');
  const context = ctx;
  const images = await Promise.all([
    ...BACKGROUNDS.map(pair => pair[initial.portrait ? 1 : 0]),
    '/film/bird-parts.webp', '/journey/snitch.webp',
    '/journey/spiderman.webp', '/journey/envelope.webp',
  ].map(loadImage));
  function keyed(image: HTMLImageElement) {
    const result = document.createElement('canvas'); result.width = image.width; result.height = image.height;
    const c = result.getContext('2d', { willReadFrequently: true })!;
    c.drawImage(image, 0, 0);
    const data = c.getImageData(0, 0, result.width, result.height);
    neutralMatte(data.data, result.width, result.height); c.putImageData(data, 0, 0);
    return result;
  }
  const birds = keyed(images[4]);
  let backgrounds = images.slice(0, 4), size = initial, time = 0, disposed = false;
  let orientationRequest = 0, activePortrait = initial.portrait;
  const cache = new Map([[activePortrait, backgrounds]]);
  const birdParts = [
    [[0, 504, 515, 360, .62, .445], [536, 441, 350, 398, .88, .766], [943, 477, 379, 356, .895, .737]],
    [[0, 73, 515, 356, .585, .477], [519, 0, 369, 411, .88, .765], [944, 43, 380, 367, .884, .737]],
  ];
  function sprite(source: CanvasImageSource, x: number, y: number, width: number, height: number, rotation = 0) {
    context.save(); context.translate(x, y); context.rotate(rotation);
    context.drawImage(source, -width / 2, -height / 2, width, height); context.restore();
  }
  function render(seconds: number) {
    if (disposed) return;
    time = seconds;
    const shot = directFilm(seconds, size.portrait), { width: w, height: h } = size;
    canvas.dataset.scene = shot.location;
    context.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    context.fillStyle = '#09233e'; context.fillRect(0, 0, w, h);
    const source = backgrounds[shot.index];
    const sw = source.width, sh = source.height;
    const roll = reduced ? 0 : shot.camera.roll;
    const cover = Math.max((w * Math.abs(Math.cos(roll)) + h * Math.abs(Math.sin(roll))) / sw, (h * Math.abs(Math.cos(roll)) + w * Math.abs(Math.sin(roll))) / sh);
    const scale = cover * (reduced ? 1 : shot.camera.zoom);
    const dw = sw * scale, dh = sh * scale;
    const px = reduced ? 0 : Math.max(-(dw - w) / 2, Math.min((dw - w) / 2, -shot.camera.x * h / 10));
    const py = reduced ? 0 : Math.max(-(dh - h) / 2, Math.min((dh - h) / 2, shot.camera.y * h / 10));
    context.save(); context.translate(w / 2, h / 2); context.rotate(-roll);
    context.drawImage(source, px - dw / 2, py - dh / 2, dw, dh);
    context.restore();
    const formation = birdFormation(w, h, size.portrait, reduced ? .9 : shot.birds.size);
    if (shot.birds.visible) birdParts.forEach((parts, i) => {
      const pose = wingPose(reduced ? 0 : seconds, i * .85), b = shot.birds;
      const unit = h / 2 * formation.scale / 400;
      context.save();
      context.translate(((reduced ? .45 : b.x + formation.centerOffset) + (i - .5) * formation.step) * w, ((reduced ? .4 : b.y + pose.body) + i * .035) * h);
      context.rotate(reduced ? 0 : -b.bank);
      function part(index: number, rotation: number, factor = 1) {
        const [sx, sy, sw, sh, pivotX, pivotY] = parts[index];
        context.save(); context.rotate(rotation); context.scale(unit * factor, unit * factor);
        context.drawImage(birds, sx, sy, sw, sh, -pivotX * sw, -pivotY * sh, sw, sh); context.restore();
      }
      part(2, -.22 - pose.flap * .74, .86); part(0, 0); part(1, -.47 - pose.flap * .8);
      context.restore();
    });
    if (shot.index === 1 && seconds > 9.2 && seconds < 16.3) sprite(images[5], w * (reduced ? .62 : shot.birds.x + .19), h * (reduced ? .32 : shot.birds.y - .11), h * .09, h * .09);
    const delivery = deliveryAt(seconds, size.portrait), spiderSize = h / 2 * (size.portrait ? .48 : .59);
    const angle = reduced ? 0 : delivery.angle;
    const tetherX = (reduced ? .69 : delivery.x) * w, tetherY = (reduced ? .2 : delivery.y) * h;
    if (delivery.visible) {
      context.strokeStyle = '#edf4fa'; context.lineWidth = 1.2; context.beginPath(); context.moveTo(delivery.anchorX * w, delivery.anchorY * h); context.lineTo(tetherX, tetherY); context.stroke();
      sprite(images[6], tetherX - Math.sin(angle) * 1026 / 604 * spiderSize / 2, tetherY + Math.cos(angle) * 1026 / 604 * spiderSize / 2, spiderSize, spiderSize * 1026 / 604, angle);
    }
    const letterTime = seconds + 6;
    if (letterTime >= 36.8 && letterTime < 42.5) {
      const flight = reduced ? 1 : between(letterTime, 37.6, 40.3), release = deliveryAt(Math.min(seconds, 31.6), size.portrait);
      const x = release.x * w - Math.sin(release.angle) * 403 / 604 * spiderSize;
      const y = release.y * h + Math.cos(release.angle) * 403 / 604 * spiderSize;
      const letterSize = h / 2 * (.14 + flight * (size.portrait ? .79 : 1.05));
      context.save(); context.globalAlpha = between(letterTime, 36.8, 37.05) * (1 - between(letterTime, 41.8, 42.5));
      context.drawImage(images[7], letterTime >= 40.8 ? 887 : 0, 0, 887, 887, x + (w * .5 - x) * flight - letterSize / 2, y + (h * .47 - y) * flight - letterSize / 2, letterSize, letterSize); context.restore();
    }
  }
  function resize(next: FilmSize) {
    size = next;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(next.width * ratio); canvas.height = Math.round(next.height * ratio);
    if (activePortrait !== next.portrait) {
      const existing = cache.get(next.portrait);
      if (existing) { backgrounds = existing; activePortrait = next.portrait; }
      else {
        const request = ++orientationRequest;
        void Promise.all(BACKGROUNDS.map(pair => loadImage(pair[next.portrait ? 1 : 0]))).then(loaded => {
          if (disposed || request !== orientationRequest) return;
          cache.set(next.portrait, loaded);
          if (size.portrait === next.portrait) { backgrounds = loaded; activePortrait = next.portrait; render(time); }
        }).catch(() => {});
      }
    }
    render(time);
  }
  canvas.dataset.engine = 'canvas2d';
  resize(initial);
  return { render, resize, setPlaying() { render(time); }, dispose() { disposed = true; } };
}
