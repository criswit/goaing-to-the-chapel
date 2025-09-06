import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { CompassState, CultureType, CULTURAL_COLORS } from './types';
import { siteNavigationData, getMainSections, getEventsSections } from './siteNavigationData';
import { useScrollSpy } from './ScrollSpy';
import { useResponsiveMode } from './useResponsiveMode';
import EventPreview from './EventPreview';
import TimelineIndicator from './TimelineIndicator';
import './CulturalCompass.css';

const CulturalCompass: React.FC = () => {
  const [state, setState] = useState<CompassState>({
    visibility: 'dormant',
    activeEvent: '',
    culturalContext: 'American',
    scrollProgress: 0
  });
  const [manuallyClosedAt, setManuallyClosedAt] = useState<number>(0);

  const responsiveMode = useResponsiveMode();
  const { activeSection, scrollVelocity, scrollProgress, isInEventsSection } = useScrollSpy(siteNavigationData);

  // Find current section/event and culture
  const currentItemIndex = useMemo(() => {
    return siteNavigationData.findIndex(item => item.id === activeSection);
  }, [activeSection]);

  const currentItem = currentItemIndex >= 0 ? siteNavigationData[currentItemIndex] : null;
  const currentCulture = currentItem?.culture || 'Fusion';
  
  // Determine if we're in an event or main section
  const isEventItem = currentItem?.time ? true : false;

  // Update state based on scroll
  useEffect(() => {
    setState(prev => ({
      ...prev,
      activeEvent: activeSection,
      culturalContext: currentCulture as CultureType,
      scrollProgress
    }));
  }, [activeSection, currentCulture, scrollProgress]);

  // Ambient visibility logic - show after stopping scroll anywhere
  useEffect(() => {
    const timeSinceClose = Date.now() - manuallyClosedAt;
    
    if (scrollVelocity < 50) {
      // Don't show immediately after manual close (wait at least 5 seconds)
      if (timeSinceClose < 5000) return;
      
      const timer = setTimeout(() => {
        setState(prev => {
          // Only show if currently dormant
          if (prev.visibility === 'dormant') {
            return { ...prev, visibility: 'hover' };
          }
          return prev;
        });
      }, 2000);
      return () => clearTimeout(timer);
    } else if (scrollVelocity > 200 && state.visibility === 'hover') {
      // Hide during fast scrolling if in hover state
      setState(prev => ({ ...prev, visibility: 'dormant' }));
    }
  }, [scrollVelocity, state.visibility, manuallyClosedAt]);

  // Handle interactions
  const handleMouseEnter = useCallback(() => {
    if (state.visibility === 'dormant') {
      setState(prev => ({ ...prev, visibility: 'hover' }));
    }
  }, [state.visibility]);

  const handleMouseLeave = useCallback(() => {
    if (state.visibility === 'hover') {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, visibility: 'dormant' }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.visibility]);

  const handleClick = useCallback(() => {
    setState(prev => ({
      ...prev,
      visibility: prev.visibility === 'expanded' ? 'hover' : 'expanded'
    }));
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, visibility: 'dormant' }));
    setManuallyClosedAt(Date.now());
  }, []);

  const navigateToSection = useCallback((sectionId: string) => {
    // First try to find event element
    let element = document.querySelector(`[data-event-id="${sectionId}"]`);
    
    // If not found, try to find section by ID
    if (!element) {
      element = document.getElementById(sectionId);
    }
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setState(prev => ({ ...prev, visibility: 'hover' }));
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.visibility === 'dormant') return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowUp':
          if (currentItemIndex > 0) {
            navigateToSection(siteNavigationData[currentItemIndex - 1].id);
          }
          break;
        case 'ArrowDown':
          if (currentItemIndex < siteNavigationData.length - 1) {
            navigateToSection(siteNavigationData[currentItemIndex + 1].id);
          }
          break;
        case 'Enter':
        case ' ':
          if (state.visibility === 'hover') {
            handleClick();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.visibility, currentItemIndex, handleClose, handleClick, navigateToSection]);

  // Progressive disclosure variants
  const compassVariants = {
    dormant: {
      width: responsiveMode.mode === 'mobile' ? 48 : 40,
      height: responsiveMode.mode === 'mobile' ? 48 : 40,
      opacity: 0.9,
      borderRadius: '50%'
    },
    hover: {
      width: responsiveMode.mode === 'mobile' ? 240 : 200,
      height: 'auto',
      opacity: 1,
      borderRadius: '16px'
    },
    expanded: {
      width: responsiveMode.mode === 'mobile' ? '90vw' : 320,
      height: 'auto',
      maxHeight: responsiveMode.mode === 'mobile' ? '70vh' : '80vh',
      opacity: 1,
      borderRadius: '16px'
    }
  };

  // Position based on responsive mode
  const positionStyles = useMemo(() => {
    switch (responsiveMode.position) {
      case 'sidebar':
        return {
          position: 'fixed' as const,
          left: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 9999
        };
      case 'floating':
        return {
          position: 'fixed' as const,
          left: '24px',
          bottom: '24px',
          zIndex: 9999
        };
      case 'drawer':
        return {
          position: 'fixed' as const,
          bottom: state.visibility === 'dormant' ? '24px' : '0',
          left: state.visibility === 'expanded' ? '50%' : '24px',
          right: state.visibility === 'expanded' ? 'auto' : 'auto',
          transform: state.visibility === 'expanded' ? 'translateX(-50%)' : 'none',
          zIndex: 9999
        };
      default:
        return {};
    }
  }, [responsiveMode.position, state.visibility]);

  // Get visible items based on state and context
  const visibleItems = useMemo(() => {
    if (state.visibility === 'dormant') return [];
    
    // In hover state, show contextual items
    if (state.visibility === 'hover') {
      // If we're in events section, show nearby events
      if (isInEventsSection && isEventItem) {
        const eventItems = getEventsSections();
        const eventIndex = eventItems.findIndex(e => e.id === activeSection);
        const startIdx = Math.max(0, eventIndex);
        return eventItems.slice(startIdx, Math.min(startIdx + 3, eventItems.length));
      }
      // Otherwise show main sections around current
      const mainSections = getMainSections();
      const currentMainIndex = mainSections.findIndex(s => s.id === activeSection);
      if (currentMainIndex >= 0) {
        const startIdx = Math.max(0, currentMainIndex - 1);
        return mainSections.slice(startIdx, Math.min(startIdx + 3, mainSections.length));
      }
      // Default to first 3 main sections
      return mainSections.slice(0, 3);
    }
    
    // In expanded state, show appropriate full list
    if (isInEventsSection) {
      return siteNavigationData.filter(item => 
        item.id === 'events' || item.time // Show events header and all timed events
      );
    }
    return getMainSections();
  }, [state.visibility, activeSection, isInEventsSection, isEventItem]);

  return (
    <motion.div
      className={`cultural-compass cultural-compass--${state.visibility} cultural-compass--${responsiveMode.mode}`}
      variants={compassVariants}
      initial="dormant"
      animate={state.visibility}
      transition={{ 
        duration: 0.3,
        ease: 'easeInOut'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={state.visibility === 'dormant' ? handleClick : undefined}
      style={{
        ...positionStyles,
        background: state.visibility === 'dormant' 
          ? CULTURAL_COLORS[currentCulture as keyof typeof CULTURAL_COLORS] || '#DC143C'
          : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: state.visibility !== 'dormant' ? 'blur(20px)' : 'none',
        boxShadow: state.visibility !== 'dormant' 
          ? '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)'
          : state.visibility === 'dormant'
          ? '0 2px 8px rgba(0, 0, 0, 0.2)'
          : 'none',
        overflow: state.visibility === 'expanded' ? 'auto' : 'hidden',
        cursor: state.visibility === 'dormant' ? 'pointer' : 'default',
        border: state.visibility === 'dormant' ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
      }}
      role="navigation"
      aria-label="Wedding events timeline navigation"
      aria-expanded={state.visibility !== 'dormant'}
    >
      <AnimatePresence mode="wait">
        {state.visibility === 'dormant' && (
          <motion.div
            key="dormant"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {responsiveMode.mode === 'mobile' ? (
              <Menu size={20} color="white" />
            ) : null}
          </motion.div>
        )}

        {(state.visibility === 'hover' || state.visibility === 'expanded') && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '16px' }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TimelineIndicator
                  progress={scrollProgress}
                  currentCulture={currentCulture as keyof typeof CULTURAL_COLORS}
                  totalEvents={siteNavigationData.length}
                  currentEventIndex={currentItemIndex >= 0 ? currentItemIndex : 0}
                />
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333'
                  }}>
                    {isInEventsSection ? 'Wedding Timeline' : 'Site Navigation'}
                  </h3>
                  {currentItem && (
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '11px',
                      opacity: 0.7
                    }}>
                      {currentItem.title}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
                aria-label="Close timeline"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Items */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: state.visibility === 'expanded' ? '400px' : 'auto',
              overflowY: state.visibility === 'expanded' ? 'auto' : 'visible'
            }}>
              {visibleItems.map((item) => (
                <EventPreview
                  key={item.id}
                  event={item}
                  isActive={item.id === activeSection}
                  isExpanded={state.visibility === 'expanded'}
                  onClick={() => navigateToSection(item.id)}
                />
              ))}
            </div>

            {/* Navigation hints */}
            {state.visibility === 'hover' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  marginTop: '12px',
                  cursor: 'pointer'
                }}
                onClick={handleClick}
              >
                Click for full {isInEventsSection ? 'timeline' : 'navigation'}
              </motion.div>
            )}

            {/* Next section preview */}
            {currentItemIndex >= 0 && currentItemIndex < siteNavigationData.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: `linear-gradient(135deg, ${currentItem?.culture ? CULTURAL_COLORS[currentItem.culture] : '#fff'}20, ${siteNavigationData[currentItemIndex + 1]?.culture ? CULTURAL_COLORS[siteNavigationData[currentItemIndex + 1].culture] : '#fff'}20)`,
                  borderRadius: '8px',
                  fontSize: '11px',
                  textAlign: 'center'
                }}
              >
                <>Next: {siteNavigationData[currentItemIndex + 1].title}</>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CulturalCompass;