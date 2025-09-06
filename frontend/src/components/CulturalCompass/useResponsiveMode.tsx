import { useState, useEffect } from 'react';
import { ResponsiveConfig } from './types';

export const useResponsiveMode = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>({
    mode: 'desktop',
    position: 'sidebar',
    gestures: false
  });

  useEffect(() => {
    const updateMode = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        setConfig({
          mode: 'desktop',
          position: 'sidebar',
          gestures: false
        });
      } else if (width >= 768) {
        setConfig({
          mode: 'tablet',
          position: 'floating',
          gestures: true
        });
      } else {
        setConfig({
          mode: 'mobile',
          position: 'drawer',
          gestures: true
        });
      }
    };

    updateMode();
    window.addEventListener('resize', updateMode);
    
    return () => window.removeEventListener('resize', updateMode);
  }, []);

  return config;
};