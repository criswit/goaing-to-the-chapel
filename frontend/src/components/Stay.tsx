import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel,
  MapPin,
  Star,
  Waves,
  Mountain,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from 'lucide-react';
import HotelInfoHeader from './HotelInfoHeader';
import GoogleMapWidget from './GoogleMapWidget';
import { accommodations, regionVibes } from '../data/accommodations';
import { AccommodationOption, RegionVibe } from '../types/accommodation';
import '../styles/Stay.css';

const Stay: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'south' | 'north' | 'comparison'>('south');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedVibe, setSelectedVibe] = useState<'all' | 'luxury' | 'family' | 'party'>('all');

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filterAccommodations = (region: 'South Goa' | 'North Goa') => {
    return accommodations.filter((acc) => {
      if (acc.region !== region) return false;
      if (selectedVibe === 'all') return true;
      return acc.type === selectedVibe;
    });
  };

  const renderAccommodationCard = (accommodation: AccommodationOption) => {
    const isExpanded = expandedCards.has(accommodation.id);
    const isVenue = accommodation.id === 'zuri-white-sands';

    return (
      <motion.div
        key={accommodation.id}
        className={`accommodation-card ${isVenue ? 'venue-card' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {isVenue && <div className="venue-badge">Wedding Venue</div>}
        <div className="card-header">
          <div className="card-title-row">
            <h4>{accommodation.name}</h4>
            {accommodation.type === 'luxury' && <Star className="luxury-icon" size={20} />}
            {accommodation.type === 'party' && <Waves className="party-icon" size={20} />}
            {accommodation.type === 'family' && <Mountain className="family-icon" size={20} />}
          </div>
          <div className="card-location">
            <MapPin size={16} />
            <span>{accommodation.location}</span>
            <span className="distance-badge">{accommodation.distance}</span>
          </div>
        </div>

        <div className="card-vibe">{accommodation.vibe}</div>

        <div className="card-highlights">
          {accommodation.highlights.slice(0, 3).map((highlight, idx) => (
            <span key={idx} className="highlight-tag">
              {highlight}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="card-expanded-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="expanded-section">
                <h5>Amenities</h5>
                <ul className="amenities-list">
                  {accommodation.amenities.map((amenity, idx) => (
                    <li key={idx}>{amenity}</li>
                  ))}
                </ul>
              </div>

              {accommodation.roomTypes && (
                <div className="expanded-section">
                  <h5>Room Types</h5>
                  <ul className="room-types-list">
                    {accommodation.roomTypes.map((room, idx) => (
                      <li key={idx}>{room}</li>
                    ))}
                  </ul>
                </div>
              )}

              {accommodation.specialFeatures && (
                <div className="expanded-section">
                  <h5>Special Features</h5>
                  <ul className="features-list">
                    {accommodation.specialFeatures.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="expanded-section">
                <h5>Best For</h5>
                <div className="suitable-for">
                  {accommodation.suitableFor.map((suit, idx) => (
                    <span key={idx} className="suitable-tag">
                      {suit}
                    </span>
                  ))}
                </div>
              </div>

              {accommodation.bookingUrl && (
                <a
                  href={accommodation.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="booking-link"
                >
                  <span>Book Now</span>
                  <ExternalLink size={16} />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button className="expand-button" onClick={() => toggleCardExpansion(accommodation.id)}>
          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </motion.div>
    );
  };

  const renderVibeComparison = () => {
    return (
      <div className="vibe-comparison">
        {regionVibes.map((vibe) => (
          <motion.div
            key={vibe.name}
            className="vibe-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h4 className="vibe-title">{vibe.name}</h4>
            <div className="vibe-character">{vibe.character}</div>

            <div className="vibe-section">
              <h5>Atmosphere</h5>
              <ul>
                {vibe.atmosphere.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="vibe-section">
              <h5>Activities</h5>
              <div className="vibe-tags">
                {vibe.activities.map((activity, idx) => (
                  <span key={idx} className="activity-tag">
                    {activity}
                  </span>
                ))}
              </div>
            </div>

            <div className="vibe-section">
              <h5>Best For</h5>
              <div className="vibe-tags">
                {vibe.crowd.map((crowd, idx) => (
                  <span key={idx} className="crowd-tag">
                    {crowd}
                  </span>
                ))}
              </div>
            </div>

            <div className="vibe-details">
              <div className="vibe-detail-item">
                <strong>Beaches:</strong> {vibe.beaches}
              </div>
              <div className="vibe-detail-item">
                <strong>Nightlife:</strong> {vibe.nightlife}
              </div>
              <div className="vibe-detail-item">
                <strong>Dining:</strong> {vibe.dining}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section className="stay" id="stay">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Where You're Staying
        </motion.h2>

        <div className="stay-layout-container">
          {/* Your Accommodations Are Arranged Section */}
          <motion.div
            className="stay-main-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="stay-content">
              <div className="stay-header">
                <Hotel className="stay-icon" />
                <div className="stay-header-content">
                  <h3>Your Accommodations Are Arranged</h3>
                  <p>
                    We've taken care of your stay at the beautiful Zuri White Sands resort. No
                    booking required – just arrive and enjoy!
                  </p>
                </div>
              </div>

              <HotelInfoHeader showAsInfo={true} />

              <GoogleMapWidget className="venue-map" />

              <div className="stay-section-separator">
                <div className="separator-line"></div>
                <div className="separator-content">
                  <span className="separator-icon">✈️</span>
                  <span className="separator-text">Planning Extra Days in Goa?</span>
                </div>
                <div className="separator-line"></div>
              </div>
            </div>
          </motion.div>

          {/* Extended Stay Options Section */}
          <motion.div
            className="extended-stay-section-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="extended-stay-section">
              <h3 className="extended-stay-title">Extended Stay Options</h3>
              <p className="extended-stay-subtitle">
                Planning to explore Goa before or after the wedding? Here are our top
                recommendations for accommodations, each offering unique experiences based on your
                preferences.
              </p>

              {/* Tab Navigation */}
              <div className="stay-tabs">
                <button
                  className={`tab-button ${activeTab === 'south' ? 'active' : ''}`}
                  onClick={() => setActiveTab('south')}
                >
                  <Mountain size={18} />
                  <span>South Goa</span>
                  <span className="tab-subtitle">Tranquil & Luxurious</span>
                </button>
                <button
                  className={`tab-button ${activeTab === 'north' ? 'active' : ''}`}
                  onClick={() => setActiveTab('north')}
                >
                  <Waves size={18} />
                  <span>North Goa</span>
                  <span className="tab-subtitle">Vibrant & Energetic</span>
                </button>
                <button
                  className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comparison')}
                >
                  <Info size={18} />
                  <span>Vibe Comparison</span>
                  <span className="tab-subtitle">Choose Your Style</span>
                </button>
              </div>

              {/* Filter Options */}
              {activeTab !== 'comparison' && (
                <div className="filter-options">
                  <span className="filter-label">Filter by type:</span>
                  <button
                    className={`filter-button ${selectedVibe === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedVibe('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-button ${selectedVibe === 'luxury' ? 'active' : ''}`}
                    onClick={() => setSelectedVibe('luxury')}
                  >
                    <Star size={14} /> Luxury
                  </button>
                  <button
                    className={`filter-button ${selectedVibe === 'family' ? 'active' : ''}`}
                    onClick={() => setSelectedVibe('family')}
                  >
                    <Mountain size={14} /> Family
                  </button>
                  <button
                    className={`filter-button ${selectedVibe === 'party' ? 'active' : ''}`}
                    onClick={() => setSelectedVibe('party')}
                  >
                    <Waves size={14} /> Party
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'south' && (
                  <motion.div
                    key="south"
                    className="tab-content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="region-description">
                      <p>
                        South Goa offers a tranquil escape with pristine beaches, luxury resorts,
                        and a peaceful atmosphere perfect for relaxation. Just minutes from the
                        wedding venue, these properties provide easy access while maintaining the
                        serene South Goa charm.
                      </p>
                    </div>
                    <div className="accommodations-grid">
                      {filterAccommodations('South Goa').map(renderAccommodationCard)}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'north' && (
                  <motion.div
                    key="north"
                    className="tab-content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="region-description">
                      <p>
                        North Goa pulses with energy, offering vibrant nightlife, bustling beaches,
                        and endless entertainment options. About 1.5 hours from the wedding venue,
                        these properties are perfect for guests who want to experience Goa's famous
                        party scene.
                      </p>
                    </div>
                    <div className="accommodations-grid">
                      {filterAccommodations('North Goa').map(renderAccommodationCard)}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'comparison' && (
                  <motion.div
                    key="comparison"
                    className="tab-content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="region-description">
                      <p>
                        Not sure which vibe suits you best? Compare the unique characteristics of
                        South and North Goa to find your perfect match. The drive between regions is
                        only 1-1.5 hours, so you can easily experience both!
                      </p>
                    </div>
                    {renderVibeComparison()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Stay;
