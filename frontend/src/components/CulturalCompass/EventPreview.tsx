import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Heart, Plane, Gift, HelpCircle, Palette, ScrollText, Home } from 'lucide-react';
import { CulturalEvent } from './types';
import CulturalBadge from './CulturalBadge';

interface EventPreviewProps {
  event: CulturalEvent;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

const EventPreview: React.FC<EventPreviewProps> = ({ 
  event, 
  isActive, 
  isExpanded,
  onClick 
}) => {
  // Get appropriate icon based on section
  const getIcon = () => {
    switch(event.id) {
      case 'hero': return <Home size={14} />;
      case 'heartfelt-note': return <Heart size={14} />;
      case 'travel': return <Plane size={14} />;
      case 'events': return <ScrollText size={14} />;
      case 'definitions': return <ScrollText size={14} />;
      case 'attire': return <Palette size={14} />;
      case 'registry': return <Gift size={14} />;
      case 'faq': return <HelpCircle size={14} />;
      default: return null;
    }
  };

  const isEventWithTime = !!event.time;
  
  return (
    <motion.div
      className={`event-preview ${isActive ? 'event-preview--active' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
      }}
      whileHover={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        scale: 1.02
      }}
      transition={{ duration: 0.2 }}
      style={{
        padding: isExpanded ? '12px 16px' : '8px 12px',
        marginBottom: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        borderLeft: isActive ? '3px solid currentColor' : '3px solid transparent'
      }}
    >
      {isEventWithTime ? (
        <CulturalBadge 
          culture={event.culture} 
          isActive={isActive}
          size={isExpanded ? 'medium' : 'small'}
        />
      ) : (
        <div style={{
          width: isExpanded ? 20 : 12,
          height: isExpanded ? 20 : 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
          color: '#8B5CF6'
        }}>
          {getIcon()}
        </div>
      )}
      
      <div className="event-preview__content" style={{ flex: 1 }}>
        <h4 style={{
          fontSize: isExpanded ? '14px' : '12px',
          fontWeight: isActive ? 600 : 500,
          margin: 0,
          marginBottom: isExpanded ? '4px' : 0
        }}>
          {event.title}
        </h4>
        
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: '11px',
              opacity: 0.8,
              marginTop: '4px'
            }}
          >
            {isEventWithTime ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {event.time}
                </span>
                {event.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} />
                    {event.location}
                  </span>
                )}
              </div>
            ) : (
              <div>{event.description}</div>
            )}
          </motion.div>
        )}
      </div>

      {isActive && (
        <motion.div
          className="event-preview__indicator"
          layoutId="activeIndicator"
          style={{
            position: 'absolute',
            right: '8px',
            width: '4px',
            height: '60%',
            backgroundColor: 'currentColor',
            borderRadius: '2px'
          }}
        />
      )}
    </motion.div>
  );
};

export default EventPreview;