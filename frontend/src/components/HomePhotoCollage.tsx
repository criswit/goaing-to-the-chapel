import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Camera, RefreshCw } from 'lucide-react';
import '../styles/HomePhotoCollage.css';

// Sample photos from the our-story category - picking a diverse set
const PHOTO_IDS = [
  'our-story-PXL_20220303_151528676',
  'our-story-PXL_20220620_003911445',
  'our-story-PXL_20220710_230333159',
  'our-story-PXL_20220827_041223797',
  'our-story-PXL_20221025_042347247',
  'our-story-PXL_20221123_223340394',
  'our-story-PXL_20221124_032215702',
  'our-story-PXL_20221225_172722390',
  'our-story-PXL_20221226_014002643',
  'our-story-PXL_20230308_030846454',
  'our-story-IMG_0431',
  'our-story-IMG_0433',
  'our-story-PXL_20221113_021314423',
  'our-story-PXL_20221120_190423345',
  'our-story-PXL_20221123_213949076',
  'our-story-PXL_20221124_212059618',
  'our-story-PXL_20221125_023232110',
  'our-story-PXL_20221126_003117025',
  'our-story-PXL_20221127_211405255',
  'our-story-PXL_20221228_192049739',
];

interface PhotoData {
  id: string;
  url: string;
  thumbnail: string;
}

interface CollageLayout {
  name: string;
  className: string;
  description: string;
  photoCount: number;
  icon: React.ReactNode;
}

const LAYOUTS: CollageLayout[] = [
  {
    name: 'Polaroid Scatter',
    className: 'polaroid-scatter',
    description: 'Romantic scattered polaroids',
    photoCount: 8,
    icon: <Camera />,
  },
  {
    name: 'Heart Mosaic',
    className: 'heart-mosaic',
    description: 'Photos arranged in a heart shape',
    photoCount: 12,
    icon: <Heart />,
  },
  {
    name: 'Spiral Galaxy',
    className: 'spiral-galaxy',
    description: 'Swirling memories in motion',
    photoCount: 10,
    icon: <Sparkles />,
  },
  {
    name: 'Memory Grid',
    className: 'memory-grid',
    description: 'Modern asymmetric grid',
    photoCount: 9,
    icon: <RefreshCw />,
  },
  {
    name: 'Love Timeline',
    className: 'love-timeline',
    description: 'Chronological wave of memories',
    photoCount: 7,
    icon: <Heart />,
  },
];

const HomePhotoCollage: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState(0);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch('/photo-manifest.json');
        const manifest = await response.json();
        const cdnUrl = manifest.cdnUrl || 'https://d3hox7jthyu409.cloudfront.net';

        // Create photo objects with CDN URLs
        const photoData: PhotoData[] = PHOTO_IDS.map((id) => ({
          id,
          url: `${cdnUrl}/photos/${id}.jpg`,
          thumbnail: `${cdnUrl}/thumbnails/${id}.jpg`,
        }));

        setPhotos(photoData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading photos:', error);
        // Fallback to local images
        const fallbackPhotos: PhotoData[] = [
          { id: '1', url: '/images/engagement1.jpg', thumbnail: '/images/thumb_engagement1.jpg' },
          { id: '2', url: '/images/engagement2.jpg', thumbnail: '/images/thumb_engagement2.jpg' },
          { id: '3', url: '/images/venue1.jpg', thumbnail: '/images/thumb_venue1.jpg' },
          { id: '4', url: '/images/venue2.jpg', thumbnail: '/images/thumb_venue2.jpg' },
          { id: '5', url: '/images/celebration1.jpg', thumbnail: '/images/thumb_celebration1.jpg' },
          {
            id: '6',
            url: '/images/venue-preview1.jpg',
            thumbnail: '/images/thumb_venue-preview1.jpg',
          },
        ];
        setPhotos(fallbackPhotos);
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // Auto-rotate layouts
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setCurrentLayout((prev) => (prev + 1) % LAYOUTS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [autoRotate]);

  // Get random photos for current layout
  const layoutPhotos = useMemo(() => {
    if (photos.length === 0) return [];
    const layout = LAYOUTS[currentLayout];
    const shuffled = [...photos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, layout.photoCount);
  }, [currentLayout, photos]);

  const handleLayoutChange = (index: number) => {
    setAutoRotate(false);
    setCurrentLayout(index);
  };

  if (isLoading) {
    return (
      <div className="photo-collage-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Heart size={48} />
        </motion.div>
      </div>
    );
  }

  const layout = LAYOUTS[currentLayout];

  return (
    <div className="home-photo-collage">
      {/* Layout Selector */}
      <div className="collage-controls">
        <div className="layout-selector">
          {LAYOUTS.map((layout, index) => (
            <motion.button
              key={layout.name}
              className={`layout-btn ${currentLayout === index ? 'active' : ''}`}
              onClick={() => handleLayoutChange(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {layout.icon}
              <span className="layout-name">{layout.name}</span>
            </motion.button>
          ))}
        </div>
        <button
          className={`auto-rotate-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
        >
          <RefreshCw size={18} />
          Auto
        </button>
      </div>

      {/* Photo Collage Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={layout.name}
          className={`photo-collage ${layout.className}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          {layoutPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${index}`}
              className={`collage-photo photo-${index + 1}`}
              initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 30 - 15 }}
              animate={{
                opacity: 1,
                scale: hoveredPhoto === index ? 1.1 : 1,
                rotate: hoveredPhoto === index ? 0 : Math.random() * 30 - 15,
                zIndex: hoveredPhoto === index ? 10 : 1,
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                type: 'spring',
                stiffness: 200,
              }}
              onMouseEnter={() => setHoveredPhoto(index)}
              onMouseLeave={() => setHoveredPhoto(null)}
            >
              <div className="photo-frame">
                <img
                  src={photo.thumbnail}
                  alt={`Memory ${index + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to full image if thumbnail fails
                    (e.target as HTMLImageElement).src = photo.url;
                  }}
                />
                {layout.className === 'polaroid-scatter' && (
                  <div className="polaroid-caption">
                    <Heart size={12} />
                    <span>Love</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Center decoration for certain layouts */}
          {layout.className === 'heart-mosaic' && (
            <motion.div
              className="center-decoration"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Heart size={48} fill="currentColor" />
            </motion.div>
          )}

          {layout.className === 'spiral-galaxy' && (
            <motion.div
              className="center-decoration"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Sparkles size={36} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Layout Description */}
      <motion.div
        className="layout-description"
        key={layout.description}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p>{layout.description}</p>
      </motion.div>
    </div>
  );
};

export default HomePhotoCollage;
