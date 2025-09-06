import { useState, useEffect, useCallback, useRef } from 'react';
import { CulturalEvent } from './types';

interface ScrollSpyResult {
  activeSection: string;
  scrollVelocity: number;
  scrollProgress: number;
  isInEventsSection: boolean;
}

export const useScrollSpy = (events: CulturalEvent[]): ScrollSpyResult => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollVelocity, setScrollVelocity] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isInEventsSection, setIsInEventsSection] = useState<boolean>(false);
  
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());

  const handleScroll = useCallback(() => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastScrollTime.current;
    
    // Calculate velocity
    if (timeDiff > 0) {
      const velocity = Math.abs((currentScrollTop - lastScrollTop.current) / timeDiff) * 1000;
      setScrollVelocity(velocity);
    }
    
    // Calculate overall page scroll progress
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (currentScrollTop / documentHeight) * 100;
    setScrollProgress(Math.min(100, Math.max(0, scrollPercentage)));
    
    // Find events section
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
      const rect = eventsSection.getBoundingClientRect();
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;
      setIsInEventsSection(isInView);
    }
    
    // Find active section - check all possible sections
    const allSections = [
      'hero',
      'heartfelt-note', 
      'travel',
      'events',
      'definitions',
      'attire',
      'registry',
      'faq'
    ];
    
    // First check main sections
    let currentActive = '';
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    
    for (const sectionId of allSections) {
      const section = document.getElementById(sectionId);
      if (section) {
        const rect = section.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const absoluteBottom = absoluteTop + rect.height;
        
        if (scrollPosition >= absoluteTop && scrollPosition <= absoluteBottom) {
          currentActive = sectionId;
          break;
        }
      }
    }
    
    // If in events section, check for specific event
    if (currentActive === 'events' || isInEventsSection) {
      const eventSections = document.querySelectorAll('[data-event-id]');
      eventSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        
        if (absoluteTop <= scrollPosition) {
          const eventId = section.getAttribute('data-event-id');
          if (eventId) {
            currentActive = eventId;
          }
        }
      });
    }
    
    // Special case for hero section at top
    if (currentScrollTop < 100) {
      currentActive = 'hero';
    }
    
    if (currentActive !== activeSection) {
      setActiveSection(currentActive);
    }
    
    lastScrollTop.current = currentScrollTop;
    lastScrollTime.current = currentTime;
  }, [activeSection, isInEventsSection]);

  useEffect(() => {
    // Debounce function
    let timeoutId: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    window.addEventListener('scroll', debouncedScroll);
    window.addEventListener('resize', debouncedScroll);
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      window.removeEventListener('resize', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return {
    activeSection,
    scrollVelocity,
    scrollProgress,
    isInEventsSection
  };
};