import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../styles/Navigation.css';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => {
    setIsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu} aria-label="Go to home page">
          <h2>goa'ing to the chapel</h2>
        </Link>

        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={closeMenu} className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/travel"
              onClick={closeMenu}
              className={location.pathname === '/travel' ? 'active' : ''}
            >
              Travel
            </Link>
          </li>
          <li>
            <Link
              to="/stay"
              onClick={closeMenu}
              className={location.pathname === '/stay' ? 'active' : ''}
            >
              Stay
            </Link>
          </li>
          <li>
            <Link
              to="/events"
              onClick={closeMenu}
              className={location.pathname === '/events' ? 'active' : ''}
            >
              Events
            </Link>
          </li>
          <li>
            <Link
              to="/attire"
              onClick={closeMenu}
              className={location.pathname === '/attire' ? 'active' : ''}
            >
              Attire
            </Link>
          </li>
          <li>
            <Link
              to="/registry"
              onClick={closeMenu}
              className={location.pathname === '/registry' ? 'active' : ''}
            >
              Registry
            </Link>
          </li>
          <li>
            <Link
              to="/faq"
              onClick={closeMenu}
              className={location.pathname === '/faq' ? 'active' : ''}
            >
              FAQ
            </Link>
          </li>
          <li>
            <Link
              to="/rsvp"
              onClick={closeMenu}
              className={`rsvp-btn ${location.pathname === '/rsvp' ? 'active' : ''}`}
            >
              RSVP
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
