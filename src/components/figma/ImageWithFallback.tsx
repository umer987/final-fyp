import React, { useEffect, useState } from 'react';

const BUILT_IN_FALLBACK = '/images/lawyer-avatar-default.svg';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Shown when `src` fails to load (defaults to local lawyer avatar SVG). */
  fallbackSrc?: string;
};

export function ImageWithFallback({
  src,
  alt,
  style,
  className,
  fallbackSrc = BUILT_IN_FALLBACK,
  ...rest
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setUsePlaceholder(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setUsePlaceholder(true);
  };

  if (usePlaceholder || !currentSrc) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-[#E8F5ED] ${className ?? ''}`}
        style={style}
        role="img"
        aria-label={alt || 'Lawyer avatar'}
      >
        <img
          src={BUILT_IN_FALLBACK}
          alt={alt || 'Lawyer avatar'}
          className="w-full h-full object-cover"
          {...rest}
        />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
