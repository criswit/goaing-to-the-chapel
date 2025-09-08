import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import DefinitionsPopup from './DefinitionsPopup';
import '../styles/FloatingTraditionsButton.css';

const FloatingTraditionsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Keyboard shortcut (T key) to toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (e.key === 't' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Hide button when popup is open
  useEffect(() => {
    setIsVisible(!isOpen);
  }, [isOpen]);

  return (
    <>
      {isVisible && (
        <button
          className="floating-traditions-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open wedding traditions and terms guide (Press T)"
          title="Wedding Traditions & Terms (Press T)"
        >
          <BookOpen size={24} />
          <span className="floating-traditions-label">Traditions</span>
        </button>
      )}

      <DefinitionsPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FloatingTraditionsButton;
