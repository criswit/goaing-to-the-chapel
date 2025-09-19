import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/HeroPhotoColumns.css';

// All photos from ~/Downloads/tmp - now randomly shuffled on each rotation
const HERO_PHOTOS = [
  'DSC05992.JPG',
  'PICT_20250614_153816.JPG',
  'PXL_20220827_034159938.jpg',
  'PXL_20221025_042336782.jpg',
  'PXL_20221229_204111613.jpg',
  'PXL_20230308_194403181.jpg',
  'PXL_20230308_194439048.jpg',
  'PXL_20230308_201352818.jpg',
  'PXL_20230308_233928609.jpg',
  'PXL_20230308_233930791.jpg',
  'PXL_20230327_022104224.jpg',
  'PXL_20230627_004545954.jpg',
  'PXL_20230729_220947191.MP.jpg',
  'PXL_20230731_210834535.jpg',
  'PXL_20231029_082129469.jpg',
  'PXL_20231103_011911086.MP.jpg',
  'PXL_20231103_012105507.jpg',
  'PXL_20231105_070013575.jpg',
  'PXL_20231105_143317022.MP.jpg',
  'PXL_20231106_073921958-01-01.jpeg',
  'PXL_20240513_011222198.MP.jpg',
  'PXL_20240605_023237445.MP~2.jpg',
  'PXL_20240630_013935165.MP.jpg',
  'PXL_20240630_021149566.jpg',
  'PXL_20240810_025326400.jpg',
  'PXL_20240825_173802344.MP.jpg',
  'PXL_20240831_020525291.MP.jpg',
  'PXL_20240909_203441130.MP.jpg',
  'PXL_20240909_211951281.jpg',
  'PXL_20240915_211656449.MP~2.jpg',
  'PXL_20240919_022001433.jpg',
  'PXL_20241130_210140681.jpg',
  'PXL_20241201_232706261.MP.jpg',
  'PXL_20241208_003149827.MP.jpg',
  'PXL_20250223_203252471.MP.jpg',
  'PXL_20250309_225013220.jpg',
  'PXL_20250315_010426574.MP.jpg',
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
    // Create photo data from the complete list
    const photoData: PhotoData[] = HERO_PHOTOS.map((filename, index) => ({
      id: `photo-${index}`,
      url: `/images/hero-columns/${filename}`,
    }));
    setPhotos(photoData);
  }, []);

  // Initialize and rotate photos with complete randomization
  useEffect(() => {
    if (photos.length === 0) return;

    // Fisher-Yates shuffle for true randomness
    const shuffleArray = (array: PhotoData[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Update photos with fresh random selection each time
    const updatePhotos = () => {
      const shuffled = shuffleArray(photos);
      // Always pick 6 random photos from the full set
      setCurrentLeftPhotos(shuffled.slice(0, 3));
      setCurrentRightPhotos(shuffled.slice(3, 6));
    };

    // Initial set
    updatePhotos();

    // Rotate photos every 5 seconds with new random selection
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
