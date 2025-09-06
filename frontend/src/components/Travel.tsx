import React, { useState } from 'react';
import {
  Plane,
  Hotel,
  Car,
  MapPin,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  Users,
  Shield,
  Clock,
  Copy,
  Check,
  Sun,
  Briefcase,
  Info,
  Phone,
  Globe,
  Navigation,
} from 'lucide-react';
import { motion } from 'framer-motion';
import HotelInfoHeader from './HotelInfoHeader';
import ImageGallery from './ImageGallery';
import GoogleMapWidget from './GoogleMapWidget';
import '../styles/Travel.css';

const Travel: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  return (
    <section className="travel" id="travel">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Stuff to Know
        </motion.h2>

        <div className="travel-intro">
          <p>
            We're so excited to celebrate with you in the paradise of Goa! February is one of the
            best times to visit, with clear skies and festive energy—but be prepared: it's still
            going to be extremely hot! We've gathered all the essential information to help make
            your journey as smooth as possible.
          </p>
        </div>

        <div className="travel-columns">
          {/* Getting to Goa - Standalone Section */}
          <motion.div
            className="standalone-section getting-to-goa"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="section-header-standalone">
              <Plane className="section-icon" />
              <h2>Getting to Goa</h2>
            </div>

            <div className="section-content-standalone">
              {/* February Travel Advisory */}
              <div className="february-advisory">
                <Sun className="advisory-icon" />
                <div className="advisory-content">
                  <h3>February Wedding Travel - Perfect Timing!</h3>
                  <p>
                    You've chosen the ideal time to visit Goa! February offers perfect weather with
                    temperatures between 20-32°C (68-90°F), minimal rainfall, and low humidity. It's
                    peak tourist season, so <strong>book your flights by October 31, 2025</strong>{' '}
                    to secure the best rates and availability.
                  </p>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="travel-info-cards">
                <div className="info-card-quick">
                  <div className="card-header">
                    <MapPin className="card-icon" />
                    <h4>Airport Code</h4>
                  </div>
                  <div className="card-content">
                    <div className="copyable-item">
                      <span className="code-text">GOI</span>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard('GOI', 'airport-code')}
                        aria-label="Copy airport code"
                      >
                        {copiedText === 'airport-code' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="card-subtitle">Dabolim Airport, Goa</p>
                  </div>
                </div>

                <div className="info-card-quick">
                  <div className="card-header">
                    <Clock className="card-icon" />
                    <h4>Flight Duration</h4>
                  </div>
                  <div className="card-content">
                    <p className="highlight-text">17-24 hours</p>
                    <p className="card-subtitle">From US West Coast</p>
                  </div>
                </div>

                <div className="info-card-quick">
                  <div className="card-header">
                    <DollarSign className="card-icon" />
                    <h4>Budget Range</h4>
                  </div>
                  <div className="card-content">
                    <p className="highlight-text">$900-$1,500</p>
                    <p className="card-subtitle">Economy Round-trip</p>
                  </div>
                </div>

                <div className="info-card-quick">
                  <div className="card-header">
                    <Calendar className="card-icon" />
                    <h4>Book By</h4>
                  </div>
                  <div className="card-content">
                    <p className="highlight-text">Oct 31, 2025</p>
                    <p className="card-subtitle">Avoid price surge</p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="travel-content-grid">
                {/* Flight Information Panel */}
                <div className="travel-panel">
                  <div className="panel-header">
                    <Plane className="panel-icon" />
                    <h3>Flight Information</h3>
                  </div>

                  <div className="airline-cards">
                    <div className="airline-card featured">
                      <div className="airline-header">
                        <h4>Air India Direct</h4>
                        <span className="badge best-value">Best Value</span>
                      </div>
                      <div className="airline-details">
                        <div className="route-info">
                          <Globe size={16} />
                          <span>SFO → DEL → GOI</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <Clock size={14} />
                            <span>17-21 hours</span>
                          </div>
                          <div className="detail-item">
                            <DollarSign size={14} />
                            <span>$900-$1,100</span>
                          </div>
                        </div>
                        <ul className="airline-features">
                          <li>Only nonstop transpacific option</li>
                          <li>Fastest overall journey time</li>
                          <li>Direct connection in Delhi</li>
                        </ul>
                      </div>
                    </div>

                    <div className="airline-card premium">
                      <div className="airline-header">
                        <h4>Qatar Airways</h4>
                        <span className="badge luxury">Best Business</span>
                      </div>
                      <div className="airline-details">
                        <div className="route-info">
                          <Globe size={16} />
                          <span>SEA/SFO → DOH → GOI</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <Clock size={14} />
                            <span>19-23 hours</span>
                          </div>
                          <div className="detail-item">
                            <DollarSign size={14} />
                            <span>$1,200-$1,500</span>
                          </div>
                        </div>
                        <ul className="airline-features">
                          <li>Qsuites business class with doors</li>
                          <li>Business: $4,200-$5,900</li>
                          <li>Award-winning service</li>
                        </ul>
                      </div>
                    </div>

                    <div className="airline-card">
                      <div className="airline-header">
                        <h4>Emirates</h4>
                        <span className="badge">Premium Option</span>
                      </div>
                      <div className="airline-details">
                        <div className="route-info">
                          <Globe size={16} />
                          <span>SEA/SFO → DXB → GOI</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <Clock size={14} />
                            <span>20-24 hours</span>
                          </div>
                          <div className="detail-item">
                            <DollarSign size={14} />
                            <span>$1,100-$1,400</span>
                          </div>
                        </div>
                        <ul className="airline-features">
                          <li>A380 First Class available</li>
                          <li>Onboard shower & bar (First)</li>
                          <li>First: $12,000-$19,000</li>
                        </ul>
                      </div>
                    </div>

                    <div className="airline-card">
                      <div className="airline-header">
                        <h4>Turkish Airlines</h4>
                        <span className="badge">Seattle Best</span>
                      </div>
                      <div className="airline-details">
                        <div className="route-info">
                          <Globe size={16} />
                          <span>SEA → IST → GOI</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <Clock size={14} />
                            <span>19 hours</span>
                          </div>
                          <div className="detail-item">
                            <DollarSign size={14} />
                            <span>$1,050-$1,300</span>
                          </div>
                        </div>
                        <ul className="airline-features">
                          <li>Excellent Istanbul lounge</li>
                          <li>Business: $4,000-$5,500</li>
                          <li>Great Seattle connections</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Airport & Transportation Panel */}
                <div className="travel-panel">
                  <div className="panel-header">
                    <Navigation className="panel-icon" />
                    <h3>Airport & Transportation</h3>
                  </div>

                  <div className="airport-info-card">
                    <div className="airport-header">
                      <h4>Goa International Airport (Dabolim)</h4>
                      <div className="copyable-item inline">
                        <span className="code-badge">GOI</span>
                        <button
                          className="copy-btn-inline"
                          onClick={() => copyToClipboard('GOI', 'goi-code')}
                          aria-label="Copy GOI code"
                        >
                          {copiedText === 'goi-code' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="airport-details">
                      <div className="detail-row">
                        <MapPin size={16} />
                        <span>32km from Zuri Resort (50 minutes)</span>
                      </div>
                      <div className="detail-row">
                        <Phone size={16} />
                        <div className="copyable-item inline">
                          <span>+91 832 254 0806</span>
                          <button
                            className="copy-btn-inline"
                            onClick={() => copyToClipboard('+918322540806', 'airport-phone')}
                            aria-label="Copy phone number"
                          >
                            {copiedText === 'airport-phone' ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="transport-options-grid">
                      <div className="transport-option">
                        <Car size={20} />
                        <div>
                          <h5>Pre-paid Taxi</h5>
                          <p>₹1,500-2,000 ($20-25)</p>
                          <span className="option-note">Book at airport counter</span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Navigation size={20} />
                        <div>
                          <h5>Uber/Ola</h5>
                          <p>₹1,800-2,500 ($25-35)</p>
                          <span className="option-note">App-based booking</span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Car size={20} />
                        <div>
                          <h5>Hotel Transfer</h5>
                          <p>₹2,500-3,500 ($35-45)</p>
                          <span className="option-note">Pre-arrange with Zuri</span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Briefcase size={20} />
                        <div>
                          <h5>Rental Car</h5>
                          <p>₹2,000-4,000/day ($25-50)</p>
                          <span className="option-note">Book in advance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="warning-card">
                    <AlertCircle className="warning-icon" />
                    <div>
                      <strong>Avoid Manohar Airport (GOX)</strong>
                      <p>
                        78km away (2+ hours) with limited flights. Always book to Dabolim (GOI).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Strategy Panel */}
                <div className="travel-panel">
                  <div className="panel-header">
                    <Calendar className="panel-icon" />
                    <h3>Booking Strategy & Tips</h3>
                  </div>

                  <div className="booking-timeline">
                    <h4>Critical Booking Deadlines</h4>
                    <div className="timeline-items">
                      <div className="timeline-item urgent">
                        <div className="timeline-date">Oct 15, 2025</div>
                        <div className="timeline-content">
                          <strong>First Class & Premium Economy</strong>
                          <p>Best rates and availability</p>
                        </div>
                      </div>
                      <div className="timeline-item important">
                        <div className="timeline-date">Oct 31, 2025</div>
                        <div className="timeline-content">
                          <strong>Economy Class Deadline</strong>
                          <p>Prices increase 20-40% after</p>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-date">Nov 30, 2025</div>
                        <div className="timeline-content">
                          <strong>Business Class</strong>
                          <p>Last chance for deals</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="booking-tips-grid">
                    <div className="tip-card">
                      <DollarSign className="tip-card-icon" />
                      <h5>Save Money</h5>
                      <ul>
                        <li>Book Tuesday/Wednesday (-15%)</li>
                        <li>Flexible dates save $200-500</li>
                        <li>Group bookings save 10-15%</li>
                      </ul>
                    </div>
                    <div className="tip-card">
                      <Info className="tip-card-icon" />
                      <h5>Pro Tips</h5>
                      <ul>
                        <li>Use Google Flights alerts</li>
                        <li>Check airline sites directly</li>
                        <li>Consider multi-city routing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* February Travel Specifics Panel */}
                <div className="travel-panel">
                  <div className="panel-header">
                    <Sun className="panel-icon" />
                    <h3>February in Goa</h3>
                  </div>

                  <div className="february-info">
                    <div className="weather-card">
                      <h4>Perfect Wedding Weather</h4>
                      <div className="weather-grid">
                        <div className="weather-item">
                          <Sun size={20} />
                          <div>
                            <strong>20-32°C</strong>
                            <span>68-90°F</span>
                          </div>
                        </div>
                        <div className="weather-item">
                          <Calendar size={20} />
                          <div>
                            <strong>Peak Season</strong>
                            <span>Book early!</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="packing-card">
                      <h4>What to Pack</h4>
                      <div className="packing-grid">
                        <div className="packing-category">
                          <h5>Essentials</h5>
                          <ul>
                            <li>Light, breathable clothing</li>
                            <li>Sunscreen (SPF 30+)</li>
                            <li>Comfortable sandals</li>
                            <li>Hat and sunglasses</li>
                          </ul>
                        </div>
                        <div className="packing-category">
                          <h5>Wedding Attire</h5>
                          <ul>
                            <li>Formal Indian wear</li>
                            <li>Light evening jacket</li>
                            <li>Dressy sandals/shoes</li>
                            <li>Traditional accessories</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visa & Documentation - Standalone Section */}
          <motion.div
            className="standalone-section visa-documentation"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="section-header-standalone">
              <Calendar className="section-icon" />
              <h3>Visa & Documentation</h3>
            </div>

            <div className="section-content-standalone">
              <div className="accordion-content">
                <div className="content-column">
                  <h4>E-Visa Application Process</h4>

                  <div className="info-section">
                    <h5>Application Details</h5>
                    <ul>
                      <li>
                        Website:{' '}
                        <a
                          href="https://indianvisaonline.gov.in/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          indianvisaonline.gov.in
                        </a>
                      </li>
                      <li>Processing time: 3-5 business days</li>
                      <li>Cost: $10-80 (varies by duration)</li>
                      <li>Apply: 30-120 days before travel</li>
                      <li>Entry: Air and sea ports only</li>
                    </ul>
                  </div>

                  <div className="tip-box">
                    <AlertCircle className="tip-icon" />
                    <div>
                      <strong>Recommendation:</strong> Apply 2-3 weeks before departure.
                      Multiple-entry visas advised for extended stays.
                    </div>
                  </div>
                </div>

                <div className="content-column">
                  <h4>Required Documentation</h4>

                  <div className="info-section">
                    <h5>Essential Documents</h5>
                    <ul>
                      <li>Passport (6+ months validity)</li>
                      <li>Passport photo (white background)</li>
                      <li>Return flight confirmation</li>
                      <li>Hotel booking confirmation</li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Application Timeline</h5>
                    <ul>
                      <li>
                        <strong>Earliest:</strong> 120 days before travel
                      </li>
                      <li>
                        <strong>Latest:</strong> 4 days before departure
                      </li>
                      <li>
                        <strong>Recommended:</strong> 2-3 weeks in advance
                      </li>
                      <li>
                        <strong>Processing:</strong> 3-5 business days
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Getting Here Column - Travel & Visa Info */}
          <div className="travel-column getting-here">
            <h3 className="column-title">Getting Here</h3>

            {/* Additional helpful travel tips and resources */}
            <motion.div
              className="travel-section expandable-card priority-medium"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('travel-tips')}>
                <div className="header-content">
                  <MapPin className="section-icon" />
                  <h3>Travel Resources</h3>
                </div>
                {expandedSection === 'travel-tips' ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSection === 'travel-tips' && (
                <div className="section-content">
                  <div className="tip-box">
                    <MapPin className="tip-icon" />
                    <div>
                      <h4>Additional travel resources coming soon!</h4>
                      <p>We're compiling helpful travel tips, packing lists, and local insights.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Where You Are Staying - Standalone Section */}
          <motion.div
            className="standalone-section where-you-are-staying"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="section-header-standalone">
              <Hotel className="section-icon" />
              <h2>Where You Are Staying</h2>
            </div>

            <div className="section-content-standalone">
              {/* Pre-arranged Accommodations Message */}
              <div className="pre-arranged-message">
                <div className="message-content">
                  <h3>Your accommodations have been arranged for you</h3>
                  <p>
                    We've taken care of your stay at the beautiful Zuri White Sands resort. No
                    booking required – just arrive and enjoy!
                  </p>
                </div>
              </div>

              <HotelInfoHeader showAsInfo={true} />

              <div className="hotel-content-grid">
                <div className="gallery-column">
                  <ImageGallery className="hotel-gallery" autoPlay={true} autoPlayInterval={4000} />
                </div>
                <div className="details-column">
                  <GoogleMapWidget className="venue-map" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Being Here Column */}
          <div className="travel-column being-here">
            <h3 className="column-title">Being Here</h3>

            {/* Local Transportation */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('transport')}>
                <div className="header-content">
                  <Car className="section-icon" />
                  <h3>Getting Around Goa</h3>
                </div>
                {expandedSection === 'transport' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'transport' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Car className="tip-icon" />
                    <div>
                      <h4>Transportation Guide in Development</h4>
                      <p>
                        We're preparing detailed transportation information to help you navigate Goa
                        with ease, from airport transfers to local travel options.
                      </p>
                      <p>
                        Our guide will include trusted services, pricing estimates, safety tips, and
                        complimentary wedding shuttle schedules.
                      </p>
                      <p>
                        <strong>Check back soon for comprehensive transportation guidance!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Things to Do */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('explore')}>
                <div className="header-content">
                  <MapPin className="section-icon" />
                  <h3>Explore Goa</h3>
                </div>
                {expandedSection === 'explore' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'explore' && (
                <div className="section-content">
                  <div className="tip-box">
                    <MapPin className="tip-icon" />
                    <div>
                      <h4>Exciting Destinations & Activities Coming Soon!</h4>
                      <p>
                        We're curating the best of Goa's beaches, cultural sites, dining
                        experiences, and must-see attractions just for our wedding guests.
                      </p>
                      <p>
                        From pristine beaches to historic sites, local cuisine to essential
                        experiences - our guide will help you make the most of your Goa adventure.
                      </p>
                      <p>
                        <strong>Stay tuned for insider recommendations and local favorites!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Essential Info Column - Cultural, Health, Safety, Practical */}
          <div className="travel-column essential-info">
            <h3 className="column-title">Essential Info</h3>

            {/* Cultural Etiquette & Respect */}
            <motion.div
              className="travel-section expandable-card priority-medium"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('etiquette')}>
                <div className="header-content">
                  <Users className="section-icon" />
                  <h3>Cultural Etiquette</h3>
                </div>
                {expandedSection === 'etiquette' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'etiquette' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Users className="tip-icon" />
                    <div>
                      <h4>Cultural Guidelines</h4>
                      <p>
                        Comprehensive cultural etiquette to help you navigate Goa's rich cultural
                        landscape.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Health & Safety */}
            <motion.div
              className="travel-section expandable-card priority-high"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('health')}>
                <div className="header-content">
                  <Heart className="section-icon" />
                  <h3>Health & Safety</h3>
                </div>
                {expandedSection === 'health' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'health' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Heart className="tip-icon" />
                    <div>
                      <h4>Health Information</h4>
                      <p>Essential health and safety information for your trip to Goa.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Safety & Scam Prevention */}
            <motion.div
              className="travel-section expandable-card priority-high"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('safety')}>
                <div className="header-content">
                  <Shield className="section-icon" />
                  <h3>Safety Tips</h3>
                </div>
                {expandedSection === 'safety' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'safety' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Shield className="tip-icon" />
                    <div>
                      <h4>Safety Guidelines</h4>
                      <p>Important safety information and scam prevention tips.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Money & Communication */}
            <motion.div
              className="travel-section expandable-card priority-medium"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('money')}>
                <div className="header-content">
                  <DollarSign className="section-icon" />
                  <h3>Money & Comms</h3>
                </div>
                {expandedSection === 'money' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'money' && (
                <div className="section-content">
                  <div className="tip-box">
                    <DollarSign className="tip-icon" />
                    <div>
                      <h4>Financial Tips</h4>
                      <p>Currency, tipping, and communication essentials.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Travel;
