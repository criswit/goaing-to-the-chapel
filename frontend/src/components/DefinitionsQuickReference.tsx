import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import '../styles/DefinitionsQuickReference.css';

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
    definition: 'A pre-wedding ceremony where turmeric paste is applied to the bride and groom for good luck and glowing skin.',
    culturalSignificance: 'Turmeric is considered auspicious in Indian culture, symbolizing purity, fertility, and warding off evil spirits.',
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies'
  },
  {
    id: 'mehndi',
    term: 'Mehndi',
    pronunciation: 'MEHN-dee',
    definition: 'The application of intricate henna designs on the bride\'s hands and feet, often accompanied by music and dancing.',
    culturalSignificance: 'The darkness of the mehndi is said to represent the depth of love between the couple. The bride\'s partner\'s name is often hidden in the design.',
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies'
  },
  {
    id: 'sangeet',
    term: 'Sangeet',
    pronunciation: 'SAN-geet',
    definition: 'A musical celebration with performances by family and friends, featuring traditional and contemporary songs and dances.',
    culturalSignificance: 'Celebrates the union of two families through music and dance, traditionally a ladies-only event but now includes all guests.',
    origin: 'Indian',
    category: 'Pre-Wedding Ceremonies'
  },
  {
    id: 'baraat',
    term: 'Baraat',
    pronunciation: 'bah-RAHT',
    definition: 'The groom\'s wedding procession, traditionally arriving on a decorated horse or elephant, accompanied by music and dancing.',
    culturalSignificance: 'Represents the groom\'s journey to claim his bride, symbolizing joy and celebration as he arrives to marry.',
    origin: 'Indian',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'jaimala',
    term: 'Jaimala/Varmala',
    pronunciation: 'JAI-maa-la / VAR-maa-la',
    definition: 'The exchange of flower garlands between bride and groom, symbolizing acceptance and respect for one another.',
    culturalSignificance: 'The garland exchange signifies the bride and groom accepting each other as life partners and showing mutual respect.',
    origin: 'Indian',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'mandap',
    term: 'Mandap',
    pronunciation: 'MAN-dap',
    definition: 'A sacred, decorated canopy under which the Hindu wedding ceremony takes place, typically with four pillars.',
    culturalSignificance: 'The four pillars represent the four parents and their blessings. It\'s considered a sacred space where divine witness occurs.',
    origin: 'Indian',
    category: 'Wedding Setup'
  },
  {
    id: 'pandit',
    term: 'Pandit/Pundit',
    pronunciation: 'PAN-dit',
    definition: 'A Hindu priest who officiates the wedding ceremony and performs the sacred rituals.',
    culturalSignificance: 'The spiritual guide who ensures all religious rites are performed correctly according to Vedic traditions.',
    origin: 'Indian',
    category: 'Wedding Participants'
  },
  {
    id: 'saptapadi',
    term: 'Saptapadi',
    pronunciation: 'sap-ta-PA-dee',
    definition: 'The seven sacred steps taken by the couple around the holy fire, each step representing a vow.',
    culturalSignificance: 'These seven vows cover all aspects of married life including prosperity, happiness, children, and spiritual growth.',
    origin: 'Indian',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'vidaai',
    term: 'Vidaai',
    pronunciation: 'vi-DAA-ee',
    definition: 'The emotional farewell ceremony where the bride leaves her parental home to start a new life with her husband.',
    culturalSignificance: 'Symbolizes the bride\'s transition from daughter to wife, often accompanied by tears of joy and sadness.',
    origin: 'Indian',
    category: 'Post-Wedding Ceremonies'
  },
  {
    id: 'lehenga',
    term: 'Lehenga',
    pronunciation: 'leh-HEN-gah',
    definition: 'A traditional Indian outfit consisting of a long skirt, fitted blouse (choli), and dupatta (scarf).',
    culturalSignificance: 'The bridal lehenga is often red or pink, symbolizing prosperity and fertility in Indian culture.',
    origin: 'Indian',
    category: 'Attire'
  },
  {
    id: 'sherwani',
    term: 'Sherwani',
    pronunciation: 'sher-WAH-nee',
    definition: 'A formal knee-length coat worn by the groom, often paired with churidar pajamas or trousers.',
    culturalSignificance: 'Represents royal heritage and is the traditional formal wear for Indian grooms.',
    origin: 'Indian',
    category: 'Attire'
  },
  
  // Western Wedding Terms
  {
    id: 'cocktail-hour',
    term: 'Cocktail Hour',
    definition: 'A social hour between the ceremony and reception where guests enjoy drinks and appetizers.',
    culturalSignificance: 'Allows time for the wedding party to take photos while guests socialize and celebrate.',
    origin: 'Western',
    category: 'Reception'
  },
  {
    id: 'first-dance',
    term: 'First Dance',
    definition: 'The newlyweds\' first dance together as a married couple, often to a meaningful song.',
    culturalSignificance: 'Symbolizes the couple\'s first act together as husband and wife, often followed by parent dances.',
    origin: 'Western',
    category: 'Reception'
  },
  {
    id: 'reception',
    term: 'Reception',
    definition: 'The celebration following the ceremony, typically including dinner, dancing, and toasts.',
    culturalSignificance: 'The party celebrating the newly married couple with family and friends.',
    origin: 'Western',
    category: 'Reception'
  },
  {
    id: 'processional',
    term: 'Processional',
    definition: 'The formal entrance of the wedding party at the beginning of the ceremony.',
    culturalSignificance: 'Sets the tone for the ceremony as the wedding party enters in a specific order.',
    origin: 'Western',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'recessional',
    term: 'Recessional',
    definition: 'The exit of the wedding party after the ceremony, led by the newly married couple.',
    culturalSignificance: 'The joyful exit marking the couple\'s first walk together as married partners.',
    origin: 'Western',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'unity-ceremony',
    term: 'Unity Ceremony',
    definition: 'A symbolic ritual (like candle lighting or sand ceremony) representing the joining of two lives.',
    culturalSignificance: 'Visual representation of two becoming one, often involving both families.',
    origin: 'Western',
    category: 'Wedding Ceremonies'
  },
  {
    id: 'bouquet-toss',
    term: 'Bouquet Toss',
    definition: 'Tradition where the bride tosses her bouquet to unmarried female guests.',
    culturalSignificance: 'Legend says whoever catches it will be the next to marry.',
    origin: 'Western',
    category: 'Reception'
  },
  {
    id: 'garter-toss',
    term: 'Garter Toss',
    definition: 'The groom removes and tosses the bride\'s garter to unmarried male guests.',
    culturalSignificance: 'Counterpart to the bouquet toss, with similar marriage prediction folklore.',
    origin: 'Western',
    category: 'Reception'
  },
  {
    id: 'rehearsal-dinner',
    term: 'Rehearsal Dinner',
    definition: 'A dinner held the night before the wedding for the wedding party and close family.',
    culturalSignificance: 'Allows the wedding party to practice and celebrates the couple before the big day.',
    origin: 'Western',
    category: 'Pre-Wedding Events'
  }
];

const DefinitionsQuickReference: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Indian' | 'Western'>('All');

  const filteredTerms = useMemo(() => {
    return weddingTerms.filter(term => {
      const matchesSearch = searchTerm === '' || 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (term.culturalSignificance && term.culturalSignificance.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = selectedFilter === 'All' || 
        (selectedFilter === 'Indian' && term.origin === 'Indian') ||
        (selectedFilter === 'Western' && term.origin === 'Western');
      
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, selectedFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <section className="definitions-reference" id="definitions">
      <div className="definitions-container">
        <motion.div 
          className="definitions-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="definitions-title">Wedding Traditions & Terms</h2>
          <p className="definitions-subtitle">
            Understanding the beautiful blend of Indian and Western wedding customs
          </p>
        </motion.div>

        <motion.div 
          className="definitions-controls"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search wedding terms"
            />
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          <div className="filter-buttons" role="group" aria-label="Filter wedding terms by origin">
            <button
              className={`filter-btn ${selectedFilter === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('All')}
              aria-pressed={selectedFilter === 'All'}
            >
              All Traditions ({weddingTerms.length})
            </button>
            <button
              className={`filter-btn ${selectedFilter === 'Indian' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Indian')}
              aria-pressed={selectedFilter === 'Indian'}
            >
              Indian Traditions ({weddingTerms.filter(t => t.origin === 'Indian').length})
            </button>
            <button
              className={`filter-btn ${selectedFilter === 'Western' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Western')}
              aria-pressed={selectedFilter === 'Western'}
            >
              Western Traditions ({weddingTerms.filter(t => t.origin === 'Western').length})
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="terms-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {filteredTerms.length > 0 ? (
            filteredTerms.map((term, index) => (
              <motion.article
                key={term.id}
                className={`term-card ${term.origin.toLowerCase()}-origin`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <div className="term-header">
                  <h3 className="term-name">{term.term}</h3>
                  {term.pronunciation && (
                    <span className="term-pronunciation">{term.pronunciation}</span>
                  )}
                  <span className={`term-badge ${term.origin.toLowerCase()}`}>
                    {term.origin} Tradition
                  </span>
                </div>
                
                <p className="term-definition">{term.definition}</p>
                
                {term.culturalSignificance && (
                  <div className="term-significance">
                    <strong>Cultural Significance:</strong>
                    <p>{term.culturalSignificance}</p>
                  </div>
                )}
                
                <div className="term-category">
                  <span className="category-label">{term.category}</span>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="no-results">
              <p>No terms found matching your search criteria.</p>
              <p>Try adjusting your filters or search term.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default DefinitionsQuickReference;