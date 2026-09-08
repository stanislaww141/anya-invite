const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Public assets also need the repository prefix on GitHub Pages. */
export function assetUrl(path: string) {
  if (!basePath || !path.startsWith('/') || path.startsWith('//') || path.startsWith(basePath + '/')) return path;
  return basePath + path;
}
