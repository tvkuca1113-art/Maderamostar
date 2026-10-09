/** Putanje do optimiziranih izvedenica (scripts/optimize-images.mjs). Original ostaje za lightbox. */
export function baseName(webPath: string): string {
  const file = webPath.split('/').pop() ?? webPath;
  return file.replace(/\.[a-z]+$/i, '');
}

export function optSrcSet(webPath: string, widths: number[], format: 'avif' | 'webp'): string {
  const b = baseName(webPath);
  return widths.map((w) => `/images/madera/opt/${b}-${w}.${format} ${w}w`).join(', ');
}

export const PRODUCT_WIDTHS = [480, 960];
