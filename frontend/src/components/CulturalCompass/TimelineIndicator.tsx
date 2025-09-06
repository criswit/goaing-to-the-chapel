import React from 'react';
import { motion } from 'framer-motion';
import { CULTURAL_COLORS } from './types';

interface TimelineIndicatorProps {
  progress: number;
  currentCulture: keyof typeof CULTURAL_COLORS;
  totalEvents: number;
  currentEventIndex: number;
}

const TimelineIndicator: React.FC<TimelineIndicatorProps> = ({ 
  progress, 
  currentCulture,
  totalEvents,
  currentEventIndex
}) => {
  const radius = 45;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const currentColor = CULTURAL_COLORS[currentCulture];

  return (
    <div className="timeline-indicator" style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Progress circle */}
        <motion.circle
          stroke={currentColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            filter: `drop-shadow(0 0 6px ${currentColor}40)`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        <motion.div
          animate={{ color: currentColor }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            lineHeight: 1
          }}
        >
          {currentEventIndex + 1}
        </motion.div>
        <div
          style={{
            fontSize: '10px',
            opacity: 0.7,
            marginTop: '2px'
          }}
        >
          of {totalEvents}
        </div>
      </div>
    </div>
  );
};

export default TimelineIndicator;