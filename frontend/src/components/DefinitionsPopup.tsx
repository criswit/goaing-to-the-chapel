import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import '../styles/DefinitionsPopup.css';

interface WeddingTerm {
  id: string;
  term: string;
  pronunciation?: string;
  definition: string;
  culturalSignificance?: string;
  origin: 'Indian' | 'Western';
  category: string;
}

const weddingTerms: WeddingTerm[] = [
  // Indian Wedding Terms
  {
    id: 'haldi',
    term: 'Haldi',
    pronunciation: 'HAL-dee',
    definition:
      'A pre-wedding ceremony where turmeric paste is applied to the bride and groom for good luck and glowing skin.',
    culturalSignificance:
      'Turmeric is considered auspicious in Indian culture, symbolizing purity, fertility, and warding off evil spirits.',
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies',
  },
  {
    id: 'mehndi',
    term: 'Mehndi',
    pronunciation: 'MEHN-dee',
    definition:
      "The application of intricate henna designs on the bride's hands and feet, often accompanied by music and dancing.",
    culturalSignificance:
      "The darkness of the mehndi is said to represent the depth of love between the couple. The bride's partner's name is often hidden in the design.",
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies',
  },
  {
    id: 'sangeet',
    term: 'Sangeet',
    pronunciation: 'SAN-geet',
    definition:
      'A musical celebration with performances by family and friends, featuring traditional and contemporary songs and dances.',
    culturalSignificance:
      'Celebrates the union of two families through music and dance, traditionally a ladies-only event but now includes all guests.',
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies',
  },
  {
    id: 'baraat',
    term: 'Baraat',
    pronunciation: 'ba-RAAT',
    definition:
      "The groom's wedding procession, traditionally involving the groom arriving on a decorated horse, accompanied by family and friends with music and dancing.",
    culturalSignificance:
      'Symbolizes the groom coming to claim his bride, with the celebration representing the joy and excitement of the union.',
    origin: 'Indian',
    category: 'Wedding Ceremony',
  },
  {
    id: 'mandap',
    term: 'Mandap',
    pronunciation: 'MAN-dup',
    definition:
      'A sacred canopy or pavilion where the Hindu wedding ceremony takes place, typically decorated with flowers and fabric.',
    culturalSignificance:
      'Represents the cosmos and the sacred space where the couple will take their vows, often facing east for prosperity.',
    origin: 'Indian',
    category: 'Wedding Ceremony',
  },
  {
    id: 'saat-phere',
    term: 'Saat Phere',
    pronunciation: 'SAHT FEH-ray',
    definition:
      'The seven circles around the sacred fire that the couple takes together, each representing a vow and aspect of married life.',
    culturalSignificance:
      'Each circle represents a promise: nourishment, strength, prosperity, happiness, progeny, longevity, and harmony.',
    origin: 'Indian',
    category: 'Wedding Ceremony',
  },
  {
    id: 'sindoor',
    term: 'Sindoor',
    pronunciation: 'sin-DOOR',
    definition:
      "A red powder applied to the bride's hair parting by the groom, symbolizing her married status.",
    culturalSignificance:
      'One of the most significant moments in a Hindu wedding, marking the transition from single to married life.',
    origin: 'Indian',
    category: 'Wedding Ceremony',
  },
  {
    id: 'mangalsutra',
    term: 'Mangalsutra',
    pronunciation: 'MAN-gul-soo-tra',
    definition:
      "A sacred necklace tied around the bride's neck by the groom, symbolizing their marital bond.",
    culturalSignificance:
      'Considered the most important piece of jewelry for a married Hindu woman, representing love, respect, and commitment.',
    origin: 'Indian',
    category: 'Wedding Ceremony',
  },
  {
    id: 'joota-chupai',
    term: 'Joota Chupai',
    pronunciation: 'JOO-ta chu-PIE',
    definition:
      "A playful tradition where the bride's sisters and female cousins steal the groom's shoes and demand a ransom for their return.",
    culturalSignificance:
      "A fun ice-breaker between the two families, symbolizing the playful relationship between the bride and groom's families.",
    origin: 'Indian',
    category: 'Wedding Traditions',
  },
  {
    id: 'vidaai',
    term: 'Vidaai',
    pronunciation: 'vi-DA-eye',
    definition:
      'The emotional farewell ceremony where the bride leaves her parental home to start her new life with her husband.',
    culturalSignificance:
      "A bittersweet moment symbolizing the bride's transition from daughter to wife, often accompanied by tears and blessings.",
    origin: 'Indian',
    category: 'Post-Wedding',
  },

  // Western Wedding Terms
  {
    id: 'processional',
    term: 'Processional',
    definition:
      'The formal entrance of the wedding party and bride down the aisle to begin the ceremony.',
    origin: 'Western',
    category: 'Wedding Ceremony',
  },
  {
    id: 'recessional',
    term: 'Recessional',
    definition:
      'The celebratory exit of the newly married couple and wedding party after the ceremony concludes.',
    origin: 'Western',
    category: 'Wedding Ceremony',
  },
  {
    id: 'cocktail-hour',
    term: 'Cocktail Hour',
    definition:
      'A social gathering between the ceremony and reception where guests enjoy drinks and appetizers.',
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'first-dance',
    term: 'First Dance',
    definition:
      'The traditional first dance between the newly married couple, often to a meaningful song.',
    culturalSignificance:
      "Symbolizes the couple's first act as a married pair and their unity in front of family and friends.",
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'father-daughter-dance',
    term: 'Father-Daughter Dance',
    definition:
      'A special dance between the bride and her father, symbolizing his blessing and support.',
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'mother-son-dance',
    term: 'Mother-Son Dance',
    definition: 'A dance between the groom and his mother, honoring their special relationship.',
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'bouquet-toss',
    term: 'Bouquet Toss',
    definition: 'A tradition where the bride throws her bouquet to unmarried female guests.',
    culturalSignificance: 'Legend says whoever catches the bouquet will be the next to marry.',
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'garter-toss',
    term: 'Garter Toss',
    definition:
      "A tradition where the groom removes and tosses the bride's garter to unmarried male guests.",
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'cake-cutting',
    term: 'Cake Cutting',
    definition: 'The ceremonial cutting of the wedding cake by the bride and groom together.',
    culturalSignificance:
      "Represents the couple's first joint task as a married pair and sharing their first meal together.",
    origin: 'Western',
    category: 'Reception',
  },
  {
    id: 'unity-candle',
    term: 'Unity Candle',
    definition:
      'A ceremony where the couple lights a single candle together from two separate candles, symbolizing the joining of their lives.',
    origin: 'Western',
    category: 'Wedding Ceremony',
  },

  // Fusion/Modern Terms
  {
    id: 'fusion-wedding',
    term: 'Fusion Wedding',
    definition:
      'A wedding that blends traditions, customs, and elements from different cultures or religions.',
    culturalSignificance:
      'Celebrates the diverse backgrounds of the couple and creates new traditions that honor both families.',
    origin: 'Indian',
    category: 'Modern Concepts',
  },
  {
    id: 'destination-wedding',
    term: 'Destination Wedding',
    definition:
      "A wedding held in a location away from the couple's hometown, often in a scenic or exotic location.",
    origin: 'Western',
    category: 'Modern Concepts',
  },
  {
    id: 'welcome-dinner',
    term: 'Welcome Dinner',
    definition:
      'An informal dinner or party held the night before the wedding to welcome out-of-town guests.',
    origin: 'Western',
    category: 'Pre-Wedding Events',
  },
];

interface DefinitionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const DefinitionsPopup: React.FC<DefinitionsPopupProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(weddingTerms.map((term) => term.category))).sort();
    return ['All', ...cats];
  }, []);

  const filteredTerms = useMemo(() => {
    return weddingTerms.filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
      const matchesOrigin = selectedOrigin === 'All' || term.origin === selectedOrigin;
      return matchesSearch && matchesCategory && matchesOrigin;
    });
  }, [searchTerm, selectedCategory, selectedOrigin]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="definitions-popup-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="definitions-title"
      >
        <motion.div
          ref={modalRef}
          className="definitions-popup-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="definitions-popup-header">
            <div className="definitions-popup-title">
              <BookOpen size={24} aria-hidden="true" />
              <h2 id="definitions-title">Wedding Traditions & Terms</h2>
            </div>
            <button
              ref={closeButtonRef}
              className="definitions-popup-close"
              onClick={onClose}
              aria-label="Close definitions popup"
              type="button"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          <div className="definitions-popup-content">
            <div className="definitions-filters">
              <div className="filter-group">
                <label htmlFor="search-input" className="filter-label">
                  Search Terms:
                </label>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search traditions and terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="category-filter" className="filter-label">
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-select"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="origin-filter" className="filter-label">
                  Origin:
                </label>
                <select
                  id="origin-filter"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All</option>
                  <option value="Indian">Indian</option>
                  <option value="Western">Western</option>
                </select>
              </div>
            </div>

            <div className="definitions-results">
              <p className="results-count">
                {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} found
              </p>

              <div className="definitions-grid">
                {filteredTerms.map((term) => (
                  <motion.div
                    key={term.id}
                    className="definition-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="definition-header">
                      <h3 className="definition-term">
                        {term.term}
                        {term.pronunciation && (
                          <span className="pronunciation">({term.pronunciation})</span>
                        )}
                      </h3>
                      <div className="definition-badges">
                        <span className={`origin-badge ${term.origin.toLowerCase()}`}>
                          {term.origin}
                        </span>
                        <span className="category-badge">{term.category}</span>
                      </div>
                    </div>
                    <p className="definition-text">{term.definition}</p>
                    {term.culturalSignificance && (
                      <div className="cultural-significance">
                        <h4>Cultural Significance:</h4>
                        <p>{term.culturalSignificance}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredTerms.length === 0 && (
                <div className="no-results">
                  <p>No terms found matching your search criteria.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                      setSelectedOrigin('All');
                    }}
                    className="reset-filters-btn"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DefinitionsPopup;
