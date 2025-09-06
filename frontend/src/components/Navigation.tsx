import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/Navigation.css';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button className="nav-logo" onClick={scrollToTop} aria-label="Scroll to top of page">
          <h2>AK + CMW</h2>
        </button>

        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <button onClick={() => scrollToSection('travel')}>Travel</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('events')}>Events</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('attire')}>Attire</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('registry')}>Registry</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('faq')}>FAQ</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('rsvp')} className="rsvp-btn">
              RSVP
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
