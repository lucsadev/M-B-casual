/**
 * OptimizedImage — Responsive image with WebP, lazy loading, skeleton, and error state.
 *
 * Features:
 * - <picture> element with WebP source and original fallback
 * - Automatic lazy loading (except for priority images)
 * - Skeleton placeholder while image loads
 * - Error fallback icon when image fails to load
 *
 * @example
 * <OptimizedImage src="/product.jpg" alt="Product" className="w-full" />
 * <OptimizedImage src="/hero.jpg" alt="Hero" priority className="w-full" />
 */
import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an image URL to its WebP equivalent by replacing the extension.
 * Falls back to the original src when the extension is not jpg/jpeg/png.
 */
function toWebpSrc(src: string): string {
  return src.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2');
}

/**
 * Extract the base URL (without query params) for the fallback img.
 */
function toBaseSrc(src: string): string {
  return src.split('?')[0];
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#1A1A1A]/20"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ImageErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#1A1A1A]/30"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  /** Skip lazy loading for above-the-fold / LCP images */
  priority?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  ...imgProps
}: OptimizedImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const webpSrc = toWebpSrc(src);
  const baseSrc = toBaseSrc(src);
  const isWebpSupported = webpSrc !== src; // Only add webp source if extension was replaced

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Skeleton placeholder while loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F0]">
          <ImagePlaceholderIcon />
        </div>
      )}

      {/* Error fallback */}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#F5F5F0]">
          <ImageErrorIcon />
          <span className="text-xs text-[#1A1A1A]/40">Sin imagen</span>
        </div>
      ) : (
        <picture>
          {isWebpSupported && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <img
            src={baseSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? undefined : 'lazy'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              status === 'loading' ? 'opacity-0' : 'opacity-100',
            )}
            {...imgProps}
          />
        </picture>
      )}
    </div>
  );
}
