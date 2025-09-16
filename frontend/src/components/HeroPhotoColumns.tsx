import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/HeroPhotoColumns.css';

// Configure your photos here - add your photo filenames to this array
// Place your photos in: frontend/public/images/hero-columns/
// Photos should be square or portrait orientation for best results
const HERO_PHOTOS = [
  'PXL_20221229_204111613.jpg',
  'PXL_20230308_194403181.jpg',
  'PXL_20230308_233928609.jpg',
  'PXL_20230729_220947191.MP.jpg',
  'PXL_20230731_210834535.jpg',
  'PXL_20231029_082129469.jpg',
];

// Fallback photos if custom photos aren't available yet
const FALLBACK_PHOTOS = [
  '/images/hero-columns/PXL_20221229_204111613.jpg',
  '/images/hero-columns/PXL_20230308_194403181.jpg',
  '/images/hero-columns/PXL_20230308_233928609.jpg',
  '/images/hero-columns/PXL_20230729_220947191.MP.jpg',
  '/images/hero-columns/PXL_20230731_210834535.jpg',
  '/images/hero-columns/PXL_20231029_082129469.jpg',
];

interface PhotoData {
  id: string;
  url: string;
}

const HeroPhotoColumns: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [currentLeftPhotos, setCurrentLeftPhotos] = useState<PhotoData[]>([]);
  const [currentRightPhotos, setCurrentRightPhotos] = useState<PhotoData[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Load photos
  useEffect(() => {
    // Check if we have custom photos in hero-columns directory
    const testImage = new Image();
    testImage.onload = () => {
      // Custom photos exist, use them
      const photoData: PhotoData[] = HERO_PHOTOS.map((filename, index) => ({
        id: `hero-${index}`,
        url: `/images/hero-columns/${filename}`,
      }));
      setPhotos(photoData);
    };
    testImage.onerror = () => {
      // No custom photos yet, use fallback
      const photoData: PhotoData[] = FALLBACK_PHOTOS.map((path, index) => ({
        id: `fallback-${index}`,
        url: path,
      }));
      setPhotos(photoData);
    };
    // Test if first photo exists
    testImage.src = `/images/hero-columns/${HERO_PHOTOS[0]}`;
  }, []);

  // Initialize and rotate photos
  useEffect(() => {
    if (photos.length === 0) return;

    // Initialize with first 6 photos
    const updatePhotos = () => {
      const shuffled = [...photos].sort(() => Math.random() - 0.5);
      setCurrentLeftPhotos(shuffled.slice(0, 3));
      setCurrentRightPhotos(shuffled.slice(3, 6));
    };

    // Initial set
    updatePhotos();

    // Rotate photos every 5 seconds
    const interval = setInterval(() => {
      updatePhotos();
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [photos]);

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Left Column */}
      <div className="hero-photo-column hero-photo-column-left">
        <AnimatePresence mode="wait">
          {currentLeftPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${photoIndex}-left-${index}`}
              className={`hero-photo-frame photo-${index + 1}`}
              initial={{ opacity: 0, x: -50, rotate: -5 }}
              animate={{
                opacity: 1,
                x: 0,
                rotate: index === 1 ? 3 : index === 2 ? -2 : 5,
              }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                zIndex: 10,
                transition: { duration: 0.3 },
              }}
            >
              <img src={photo.url} alt={`Memory ${index + 1}`} loading="lazy" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Right Column */}
      <div className="hero-photo-column hero-photo-column-right">
        <AnimatePresence mode="wait">
          {currentRightPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${photoIndex}-right-${index}`}
              className={`hero-photo-frame photo-${index + 4}`}
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              animate={{
                opacity: 1,
                x: 0,
                rotate: index === 1 ? -4 : index === 2 ? 2 : -5,
              }}
              exit={{ opacity: 0, x: 50 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                zIndex: 10,
                transition: { duration: 0.3 },
              }}
            >
              <img src={photo.url} alt={`Memory ${index + 4}`} loading="lazy" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default HeroPhotoColumns;
