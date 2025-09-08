import React from 'react';
import { motion } from 'framer-motion';
import { CultureType, CULTURAL_COLORS } from './types';

interface CulturalBadgeProps {
  culture: CultureType;
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const CulturalBadge: React.FC<CulturalBadgeProps> = ({
  culture,
  isActive,
  size = 'medium',
  showLabel = false,
}) => {
  const sizeMap = {
    small: 12,
    medium: 20,
    large: 28,
  };

  const badgeSize = sizeMap[size];
  const color = CULTURAL_COLORS[culture];

  return (
    <motion.div
      className={`cultural-badge cultural-badge--${culture.toLowerCase()} cultural-badge--${size}`}
      animate={{
        backgroundColor: color,
        scale: isActive ? 1.2 : 1.0,
        boxShadow: isActive ? `0 0 20px ${color}40, 0 0 40px ${color}20` : `0 0 10px ${color}20`,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      style={{
        width: badgeSize,
        height: badgeSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {showLabel && (
        <motion.span
          className="cultural-badge__label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            position: 'absolute',
            left: badgeSize + 8,
            whiteSpace: 'nowrap',
            fontSize: '12px',
            fontWeight: 500,
            color: color,
          }}
        >
          {culture}
        </motion.span>
      )}
    </motion.div>
  );
};

export default CulturalBadge;
