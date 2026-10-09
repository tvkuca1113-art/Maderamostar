import { assetFor } from '../data';
import { optSrcSet, PRODUCT_WIDTHS } from '../lib/images';

interface Props {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/** Originalna fotografija proizvoda s AVIF/WebP izvedenicama; prikaz bez rezanja (contain) rješava CSS. */
export function ProductPicture({ src, alt, sizes, className, loading = 'lazy' }: Props) {
  const meta = assetFor(src);
  return (
    <picture>
      <source type="image/avif" srcSet={optSrcSet(src, PRODUCT_WIDTHS, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={optSrcSet(src, PRODUCT_WIDTHS, 'webp')} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        width={meta?.width}
        height={meta?.height}
        loading={loading}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
