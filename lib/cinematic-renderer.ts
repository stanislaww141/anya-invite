import * as THREE from 'three';
import { between, deliveryAt, directFilm, wingPose } from './cinematic-director';
import { neutralMatte } from './film-matte';
import { BACKGROUNDS, loadImage, type FilmSize as Size, type FilmRenderer } from './film-assets';
import { sailFragment, wingVertex } from './film-shaders';

type Wing = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
type Rig = { root: THREE.Group; body: THREE.Mesh; near: Wing; far: Wing };
export type { FilmRenderer } from './film-assets';
function canvasFor(img: HTMLImageElement, keyed = false) {
  const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
  const context = canvas.getContext('2d', { willReadFrequently: keyed });
  if (!context) throw new Error('Image preparation is unavailable.');
  context.drawImage(img, 0, 0);
  if (keyed) { const data = context.getImageData(0, 0, canvas.width, canvas.height); neutralMatte(data.data, canvas.width, canvas.height); context.putImageData(data, 0, 0); }
  return canvas;
}

export async function createCinematicRenderer(canvas: HTMLCanvasElement, initial: Size): Promise<FilmRenderer> {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  renderer.setClearColor('#09233e');
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const world = new THREE.Scene(), actors = new THREE.Scene(), front = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, initial.width / initial.height, .1, 100);
  const hud = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20); hud.position.z = 10;
  let size = initial, lastTime = 0, disposed = false, activePortrait = initial.portrait;
  let orientationRequest = 0;
  const trackMaterial = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };
  const plane = (w: number, h: number, x = 1, y = 1) => { const g = new THREE.PlaneGeometry(w, h, x, y); geometries.push(g); return g; };
  const texture = (source: HTMLCanvasElement | HTMLImageElement) => {
    const t = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
    t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4); textures.push(t); return t;
  };
  const crop = (source: HTMLCanvasElement | HTMLImageElement, rect: number[]) => {
    const c = document.createElement('canvas'); c.width = rect[2]; c.height = rect[3];
    c.getContext('2d')!.drawImage(source, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]); return texture(c);
  };
  const basic = (map: THREE.Texture, opacity = 1) => trackMaterial(new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
  const images = await Promise.all([
    ...BACKGROUNDS.map(pair => pair[initial.portrait ? 1 : 0]),
    '/film/bird-parts.webp', '/journey/snitch.webp', '/journey/spiderman.webp', '/journey/envelope.webp',
  ].map(loadImage)).catch(error => { renderer.dispose(); throw error; });
  let maps: THREE.Texture[] = images.slice(0, 4).map(texture);
  const mapCache = new Map<boolean, THREE.Texture[]>([[activePortrait, maps]]);
  const birdSheet = canvasFor(images[4], true);
  const snitchTexture = texture(images[5]), spiderTexture = texture(images[6]);
  const landscapeMaterial = trackMaterial(new THREE.MeshBasicMaterial({ map: maps[0], depthWrite: false, side: THREE.DoubleSide }));
  const landscape = new THREE.Mesh(plane(1, 1), landscapeMaterial); world.add(landscape);

  const makeRig = (jewel: boolean): Rig => {
    const root = new THREE.Group(); actors.add(root);
    const specs = jewel
      ? [{ rect: [0, 504, 515, 360], pivot: [.62, .445] }, { rect: [536, 441, 350, 398], pivot: [.88, .766] }, { rect: [943, 477, 379, 356], pivot: [.895, .737] }]
      : [{ rect: [0, 73, 515, 356], pivot: [.585, .477] }, { rect: [519, 0, 369, 411], pivot: [.88, .765] }, { rect: [944, 43, 380, 367], pivot: [.884, .737] }];
    const geometryFor = (i: number) => {
      const s = specs[i], w = s.rect[2] / 400, h = s.rect[3] / 400;
      const g = plane(w, h, i ? 18 : 1, i ? 14 : 1); g.translate((.5 - s.pivot[0]) * w, (s.pivot[1] - .5) * h, 0); return g;
    };
    const body = new THREE.Mesh(geometryFor(0), basic(crop(birdSheet, specs[0].rect))); body.renderOrder = 11;
    const wing = (i: number) => {
      const mat = trackMaterial(new THREE.ShaderMaterial({ vertexShader: wingVertex, fragmentShader: sailFragment, uniforms: { uMap: { value: crop(birdSheet, specs[i].rect) }, uFlex: { value: 0 } }, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false }));
      return new THREE.Mesh(geometryFor(i), mat);
    };
    const near = wing(1), far = wing(2); near.renderOrder = 12; far.renderOrder = 10; far.scale.set(.86, .86, .86);
    near.position.set(.015, -.015, .02); far.position.set(.06, .05, -.02);
    root.add(far, body, near); return { root, body, near, far };
  };
  const rigs = [makeRig(false), makeRig(true)];
  const snitch = new THREE.Mesh(plane(.24, .24), basic(snitchTexture)); actors.add(snitch); snitch.renderOrder = 13;

  const spider = new THREE.Mesh(plane(1, 1026 / 604), basic(spiderTexture)); front.add(spider); spider.renderOrder = 3;
  const ropeGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); geometries.push(ropeGeometry);
  const rope = new THREE.Line(ropeGeometry, trackMaterial(new THREE.LineBasicMaterial({ color: '#edf4fa', transparent: true, opacity: .8, depthTest: false }))); front.add(rope);
  const envelopeClosed = new THREE.Mesh(plane(1, 1), basic(crop(images[7], [0, 0, 887, 887])));
  const envelopeOpened = new THREE.Mesh(plane(1, 1), basic(crop(images[7], [887, 0, 887, 887])));
  const letter = new THREE.Group(); letter.add(envelopeClosed, envelopeOpened); letter.renderOrder = 8; envelopeClosed.renderOrder = 8; envelopeOpened.renderOrder = 9; front.add(letter);

  const dustGeometry = new THREE.BufferGeometry(), dustPositions = new Float32Array(60 * 3);
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3)); geometries.push(dustGeometry);
  const dust = new THREE.Points(dustGeometry, trackMaterial(new THREE.PointsMaterial({ color: '#ffe0a0', size: .007, transparent: true, opacity: .65, depthTest: false }))); front.add(dust);
  const screenPoint = (x: number, y: number) => new THREE.Vector3((x * 2 - 1) * (size.width / size.height), 1 - y * 2, 0);
  function render(seconds: number) {
    if (disposed) return; lastTime = seconds;
    const shot = directFilm(seconds, size.portrait), t = shot.time, aspect = size.width / size.height;
    canvas.dataset.scene = shot.location;
    const cam = shot.camera;
    camera.position.set(cam.x, cam.y, 11 / cam.zoom);
    camera.lookAt(cam.x + Math.sin(cam.yaw) * 5, cam.y, 0); camera.rotateZ(cam.roll); camera.updateMatrixWorld();
    const backdrop = maps[shot.index].image as HTMLImageElement;
    const artRatio = backdrop.width / backdrop.height;
    const artHeight = 2 * Math.tan(THREE.MathUtils.degToRad(21)) * 11 * Math.max(1, aspect / artRatio);
    landscape.scale.set(artHeight * artRatio, artHeight, 1);
    landscapeMaterial.map = maps[shot.index];

    rigs.forEach((rig, i) => {
      const pose = wingPose(t, i * .85), b = shot.birds;
      rig.root.visible = b.visible;
      rig.root.position.copy(screenPoint(b.x + i * (size.portrait ? .18 : .125), b.y - i * .067 + pose.body));
      rig.root.scale.setScalar((size.portrait ? .28 : .39) * b.size);
      rig.root.rotation.z = b.bank + i * .025;
      rig.near.rotation.z = .47 + pose.flap * .8;
      rig.near.rotation.x = pose.flap * .18;
      rig.far.rotation.z = .22 + Math.sin(t * Math.PI * 4.3 + i * .85 + .4) * .74;
      rig.far.rotation.y = -.25 + pose.flap * .22;
      rig.near.material.uniforms.uFlex.value = pose.flex;
      rig.far.material.uniforms.uFlex.value = -pose.flex * .8;
    });
    snitch.visible = shot.index === 1 && t > 9.2 && t < 16.3;
    snitch.position.copy(screenPoint(shot.birds.x + .19 + Math.sin(t * 1.7) * .04, shot.birds.y - .11 + Math.sin(t * 2.1) * .032));
    snitch.rotation.z = Math.sin(t * 3) * .15; snitch.scale.y = 1 + Math.sin(t * 46) * .055;

    const delivery = deliveryAt(t, size.portrait), spiderSize = size.portrait ? .48 : .59;
    const anchor = screenPoint(delivery.anchorX, delivery.anchorY), tether = screenPoint(delivery.x, delivery.y);
    spider.visible = rope.visible = delivery.visible;
    spider.scale.setScalar(spiderSize); spider.rotation.z = -delivery.angle;
    const halfHeight = 1026 / 604 * spiderSize / 2;
    spider.position.set(tether.x - Math.sin(delivery.angle) * halfHeight, tether.y - Math.cos(delivery.angle) * halfHeight, 0);
    const positions = ropeGeometry.attributes.position;
    positions.setXYZ(0, anchor.x, anchor.y, 0); positions.setXYZ(1, tether.x + .035 * spiderSize, tether.y, 0); positions.needsUpdate = true;
    const handPoint = (pose: ReturnType<typeof deliveryAt>) => {
      const point = screenPoint(pose.x, pose.y);
      point.x -= Math.sin(pose.angle) * 403 / 604 * spiderSize;
      point.y -= Math.cos(pose.angle) * 403 / 604 * spiderSize;
      return point;
    };
    const hand = handPoint(delivery);
    const letterTime = t + 6;
    const handAtRelease = deliveryAt(31.6, size.portrait);
    const releasePoint = handPoint(handAtRelease);
    const flight = between(letterTime, 37.6, 40.3);
    const letterPoint = letterTime < 37.6 ? hand : releasePoint.lerp(screenPoint(.5, .47), flight);
    letter.position.copy(letterPoint);
    const letterSize = (.14 + flight * (size.portrait ? .79 : 1.05)) * (1 + between(letterTime, 40.8, 42.2) * .05);
    letter.scale.setScalar(letterSize); letter.rotation.z = (1 - flight) * .12 + Math.sin(flight * Math.PI * 2) * .07;
    letter.visible = letterTime >= 36.8 && letterTime < 42.5;
    const opened = between(letterTime, 40.8, 41.25), vanished = between(letterTime, 36.8, 37.05) * (1 - between(letterTime, 41.8, 42.5));
    envelopeClosed.material.opacity = (1 - opened) * vanished; envelopeOpened.material.opacity = opened * vanished;

    dust.visible = (shot.index === 1 && t < 16.3) || (letterTime > 39.7 && letterTime < 42.3);
    for (let i = 0; i < 60; i++) {
      dustPositions[i * 3] = ((i * .618033 + t * .012) % 1 * 2 - 1) * aspect;
      dustPositions[i * 3 + 1] = ((i * .371 + t * .019) % 1 * 1.7 - .7) + Math.sin(t * .8 + i) * .02;
    }
    dustGeometry.attributes.position.needsUpdate = true;
    renderer.clear(); renderer.render(world, camera); renderer.clearDepth(); renderer.render(actors, hud);
    renderer.clearDepth(); renderer.render(front, hud);
  }
  function resize(next: Size) {
    size = next;
    if (activePortrait !== next.portrait) {
      const cached = mapCache.get(next.portrait);
      if (cached) { maps = cached; activePortrait = next.portrait; }
      else {
        const request = ++orientationRequest;
        Promise.all(BACKGROUNDS.map(pair => loadImage(pair[next.portrait ? 1 : 0]))).then(loaded => {
          if (disposed || request !== orientationRequest) return;
          const nextMaps = loaded.map(texture); mapCache.set(next.portrait, nextMaps);
          if (size.portrait === next.portrait) { maps = nextMaps; activePortrait = next.portrait; render(lastTime); }
        }).catch(() => { /* Keep the current framing if a rotated viewport's art is unavailable. */ });
      }
    }
    renderer.setSize(next.width, next.height, false);
    const aspect = next.width / next.height; camera.aspect = aspect; camera.updateProjectionMatrix();
    hud.left = -aspect; hud.right = aspect; hud.updateProjectionMatrix();
    render(lastTime);
  }
  resize(initial);
  return { resize, render, setPlaying() { render(lastTime); }, dispose() { disposed = true; textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose()); renderer.dispose(); } };
}
