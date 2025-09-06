import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ImageGallery.css';

interface ImageData {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  images?: ImageData[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const defaultImages: ImageData[] = [
  { src: '/zuri_1.jpg', alt: 'zuri 1' },
  { src: '/zuri_2.jpg', alt: 'zuri 2' },
  { src: '/zuri_3.jpg', alt: 'zuri 3' },
  { src: '/zuri_4.jpg', alt: 'zuri 4' },
  { src: '/zuri_5.jpg', alt: 'zuri 5' },
  { src: '/zuri_6.png', alt: 'zuri 6' },
];

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = defaultImages,
  className = '',
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean[]>(new Array(images.length).fill(true));
  const [imageErrors, setImageErrors] = useState<boolean[]>(new Array(images.length).fill(false));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum swipe distance for mobile
  const minSwipeDistance = 50;

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, goToNext, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Image loading handlers
  const handleImageLoad = (index: number) => {
    setIsLoading((prev) => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
    setIsLoading((prev) => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
  };

  // Preload adjacent images
  useEffect(() => {
    const preloadImage = (index: number) => {
      if (index >= 0 && index < images.length) {
        const img = new Image();
        img.src = images[index].src;
      }
    };

    // Preload next and previous images
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    
    preloadImage(nextIndex);
    preloadImage(prevIndex);
  }, [currentIndex, images]);

  if (images.length === 0) {
    return (
      <div className="image-gallery-empty">
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`image-gallery ${className}`}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div
        className="image-gallery-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="image-gallery-slide"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading[currentIndex] && !imageErrors[currentIndex] && (
              <div className="image-gallery-loading">
                <div className="loading-spinner"></div>
                <p>Loading image...</p>
              </div>
            )}
            {imageErrors[currentIndex] ? (
              <div className="image-gallery-error">
                <p>Failed to load image</p>
              </div>
            ) : (
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
                loading="lazy"
                aria-current="true"
                className={isLoading[currentIndex] ? 'loading' : ''}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="image-gallery-nav image-gallery-nav-prev"
              onClick={goToPrevious}
              aria-label="Previous image"
              tabIndex={0}
            >
              <ChevronLeft size={30} />
            </button>
            <button
              className="image-gallery-nav image-gallery-nav-next"
              onClick={goToNext}
              aria-label="Next image"
              tabIndex={0}
            >
              <ChevronRight size={30} />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {images.length > 1 && (
          <div 
            className="image-gallery-indicators"
            role="tablist"
            aria-label="Image navigation"
          >
            {images.map((_, index) => (
              <button
                key={index}
                className={`image-gallery-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Go to image ${index + 1} of ${images.length}`}
                tabIndex={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Accessibility Information */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Viewing image {currentIndex + 1} of {images.length}: {images[currentIndex].alt}
      </div>
    </div>
  );
};

export default ImageGallery;