import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string;
  mediumSrc?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
}

export function ProgressiveImage({ 
  src, 
  thumbnailSrc, 
  mediumSrc, 
  alt, 
  className = '',
  onClick,
  loading = 'lazy'
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'thumbnail' | 'medium' | 'original'>('thumbnail');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Progressive loading: thumbnail -> medium -> original
    const loadImage = (imageSrc: string, stage: 'thumbnail' | 'medium' | 'original') => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setCurrentSrc(imageSrc);
          setLoadingStage(stage);
          if (stage === 'original') {
            setIsLoaded(true);
          }
          resolve();
        };
        img.onerror = reject;
        img.src = imageSrc;
      });
    };

    const loadProgressive = async () => {
      try {
        // Start with thumbnail if available
        if (thumbnailSrc && thumbnailSrc !== src) {
          await loadImage(thumbnailSrc, 'thumbnail');
        }
        
        // Load medium quality if available and different
        if (mediumSrc && mediumSrc !== src && mediumSrc !== thumbnailSrc) {
          await loadImage(mediumSrc, 'medium');
        }
        
        // Finally load original
        if (src !== currentSrc) {
          await loadImage(src, 'original');
        } else {
          setIsLoaded(true);
        }
      } catch (error) {
        console.warn('Error loading progressive image:', error);
        setHasError(true);
        // Fallback to original
        setCurrentSrc(src);
        setIsLoaded(true);
      }
    };

    loadProgressive();
  }, [src, thumbnailSrc, mediumSrc]);

  return (
    <div className="relative overflow-hidden">
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-all duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        } ${className}`}
        onClick={onClick}
        loading={loading}
        onError={() => setHasError(true)}
        decoding="async"
        fetchpriority={loading === 'eager' ? 'high' : 'auto'}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-500 text-xs">Завантаження...</div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-500 text-sm">Помилка завантаження</span>
        </div>
      )}
    </div>
  );
}