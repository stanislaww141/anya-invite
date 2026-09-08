export async function prepareHogwartsVideo(portrait: boolean): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto';
  video.src = portrait ? '/film/hogwarts-mobile.mp4' : '/film/hogwarts-wide.mp4';
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('The Hogwarts video did not load.')), 20000);
    const loaded = () => finish();
    const error = () => finish(new Error('The Hogwarts video is unavailable.'));
    function finish(failure?: Error) {
      clearTimeout(timeout); video.removeEventListener('loadeddata', loaded); video.removeEventListener('error', error);
      if (failure) { video.removeAttribute('src'); video.load(); reject(failure); } else resolve();
    }
    video.addEventListener('loadeddata', loaded, { once: true }); video.addEventListener('error', error, { once: true }); video.load();
  });
  return video;
}
