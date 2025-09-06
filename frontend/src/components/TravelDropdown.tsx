import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plane, DollarSign, Shield, Hotel, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/TravelDropdown.css';

interface TravelDropdownProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

interface TravelSection {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  targetId: string;
}

const travelSections: TravelSection[] = [
  {
    id: 'getting-to-goa',
    label: 'Getting to Goa',
    icon: Plane,
    targetId: 'getting-to-goa-section'
  },
  {
    id: 'booking-strategy',
    label: 'Booking Strategy',
    icon: DollarSign,
    targetId: 'booking-strategy-section'
  },
  {
    id: 'visa-documentation',
    label: 'Visa & Documentation',
    icon: Shield,
    targetId: 'visa-documentation-section'
  },
  {
    id: 'accommodations',
    label: 'Accommodations',
    icon: Hotel,
    targetId: 'accommodations-section'
  },
  {
    id: 'being-here',
    label: 'Being Here',
    icon: MapPin,
    targetId: 'being-here-section'
  }
];

const TravelDropdown: React.FC<TravelDropdownProps> = ({ isMobile = false, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (targetId: string) => {
    // First scroll to the main travel section
    const travelSection = document.getElementById('travel');
    if (travelSection) {
      travelSection.scrollIntoView({ behavior: 'smooth' });
      
      // Wait for scroll to complete, then look for the specific subsection
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-section="${targetId}"]`) || 
                             document.querySelector(`#${targetId}`) ||
                             document.querySelector(`.${targetId}`);
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
    
    setIsOpen(false);
    onNavigate?.();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`travel-dropdown ${isMobile ? 'mobile' : 'desktop'}`} ref={dropdownRef}>
      <button
        className={`travel-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Travel navigation menu"
      >
        <span>Travel</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="travel-dropdown-menu"
            initial={{ opacity: 0, y: isMobile ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="menu"
            aria-label="Travel sections"
          >
            {travelSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  className="travel-dropdown-item"
                  onClick={() => scrollToSection(section.targetId)}
                  role="menuitem"
                  aria-label={`Navigate to ${section.label}`}
                >
                  <IconComponent size={16} className="dropdown-item-icon" aria-hidden="true" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TravelDropdown;
