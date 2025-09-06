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
} from 'lucide-react';
import { motion } from 'framer-motion';
import HotelInfoHeader from './HotelInfoHeader';
import ImageGallery from './ImageGallery';
import GoogleMapWidget from './GoogleMapWidget';
import '../styles/Travel.css';

const Travel: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
            Flying to Goa for our February wedding? You've picked the perfect time! February offers
            ideal weather conditions with 20-38% lower fares than peak season.
          </p>
        </div>

        <div className="travel-columns">
          {/* Getting Here Column */}
          <div className="travel-column getting-here">
            <h3 className="column-title">Getting Here</h3>

            {/* Flight Information Section */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('flights')}>
                <div className="header-content">
                  <Plane className="section-icon" />
                  <h3>Getting to Goa</h3>
                </div>
                {expandedSection === 'flights' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'flights' && (
                <div className="section-content">
                  <div className="accordion-content">
                    <div className="content-column">
                      <h4>Recommended Airlines & Routes</h4>

                      <div className="info-grid">
                        <div className="info-section">
                          <h5>Qatar Airways via Doha</h5>
                          <ul>
                            <li>Route: SEA/SFO → DOH → GOX</li>
                            <li>Duration: 18-22 hours</li>
                            <li>Price: $1,053-$1,168</li>
                            <li>4x weekly service to North Goa</li>
                            <li>World's top-rated airline</li>
                          </ul>
                        </div>
                        <div className="info-section">
                          <h5>Emirates via Dubai</h5>
                          <ul>
                            <li>Route: SEA → DXB → GOX</li>
                            <li>Price: ~$1,075 economy</li>
                            <li>Daily SEA-DXB service</li>
                            <li>Superior entertainment system</li>
                            <li>Premium airport experience</li>
                          </ul>
                        </div>
                      </div>

                      <div className="info-section">
                        <h5>European Connections</h5>
                        <ul className="compact-list">
                          <li>
                            <strong>Lufthansa via Frankfurt:</strong> $983-$1,486
                          </li>
                          <li>
                            <strong>British Airways via London:</strong> English service
                          </li>
                          <li>
                            <strong>Journey time:</strong> 19-23 hours total
                          </li>
                          <li>
                            <strong>Best for:</strong> Western hospitality preference
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="content-column">
                      <h4>Booking Strategy</h4>

                      <div className="info-section">
                        <h5>Optimal Timing</h5>
                        <ul>
                          <li>Book 5-6 months in advance (Sept-Oct 2024)</li>
                          <li>Arrive February 11-12 for wedding</li>
                          <li>Tuesday/Wednesday bookings save 10-20%</li>
                          <li>Allow 2-4 hours for connections</li>
                        </ul>
                      </div>

                      <div className="info-section">
                        <h5>City-Specific Options</h5>
                        <ul>
                          <li>
                            <strong>Seattle (SEA):</strong> $1,000-$1,500
                          </li>
                          <li>
                            <strong>San Francisco (SFO):</strong> $800-$1,300
                          </li>
                          <li>
                            <strong>Best SFO route:</strong> Air India direct to DEL/BOM
                          </li>
                          <li>
                            <strong>Group discounts:</strong> 10+ passengers save 10-15%
                          </li>
                        </ul>
                      </div>

                      <div className="tip-box">
                        <AlertCircle className="tip-icon" />
                        <div>
                          <strong>Recommendation:</strong> SFO offers better routing options. Direct
                          Air India flights to Delhi/Mumbai provide superior connections to Goa.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-content-single">
                    <div className="info-section">
                      <h4>Extended Stay Opportunities</h4>
                      <div className="info-grid three-columns">
                        <div>
                          <h6>Golden Triangle (2 weeks)</h6>
                          <p>Delhi → Agra (Taj Mahal) → Jaipur → Goa</p>
                        </div>
                        <div>
                          <h6>Rajasthan Circuit (2-3 weeks)</h6>
                          <p>Add Udaipur, Jodhpur, desert experiences</p>
                        </div>
                        <div>
                          <h6>Kerala Extension (1-2 weeks)</h6>
                          <p>Backwaters, tea plantations, coastal beauty</p>
                        </div>
                      </div>
                      <div className="highlight">
                        February provides ideal weather across all regions. Extended stays reduce
                        daily flight costs from $200-300 to $50-80.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Visa & Documentation */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('visa')}>
                <div className="header-content">
                  <Calendar className="section-icon" />
                  <h3>Visa & Documentation</h3>
                </div>
                {expandedSection === 'visa' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'visa' && (
                <div className="section-content">
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
              )}
            </motion.div>
          </div>

          {/* Being Here Column */}
          <div className="travel-column being-here">
            <h3 className="column-title">Being Here</h3>

            {/* Accommodation */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('hotels')}>
                <div className="header-content">
                  <Hotel className="section-icon" />
                  <h3>Where to Stay</h3>
                </div>
                {expandedSection === 'hotels' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'hotels' && (
                <div className="section-content">
                  <HotelInfoHeader />
                  <div className="accordion-content">
                    <div className="content-column">
                      <ImageGallery
                        className="hotel-gallery"
                        autoPlay={true}
                        autoPlayInterval={4000}
                      />
                    </div>
                    <div className="content-column">
                      <GoogleMapWidget className="venue-map" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

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

            {/* Cultural Etiquette & Respect */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('etiquette')}>
                <div className="header-content">
                  <Users className="section-icon" />
                  <h3>Cultural Etiquette & Respect</h3>
                </div>
                {expandedSection === 'etiquette' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'etiquette' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Users className="tip-icon" />
                    <div>
                      <h4>Cultural Etiquette Guidelines Coming Soon!</h4>
                      <p>
                        We're currently compiling comprehensive cultural etiquette and respect
                        guidelines to help you navigate Goa's rich cultural landscape with
                        confidence and sensitivity.
                      </p>
                      <p>
                        Our upcoming guide will cover beach etiquette, cultural engagement,
                        environmental stewardship, sacred sites, and local customs.
                      </p>
                      <p>
                        <strong>
                          Please check back closer to the wedding date for detailed cultural
                          guidance.
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Health & Safety */}
            <motion.div
              className="travel-section"
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
                      <h4>Health & Medical Information Being Prepared</h4>
                      <p>
                        We're compiling essential health and safety information to help you prepare
                        for a healthy and comfortable trip to Goa.
                      </p>
                      <p>
                        Our comprehensive guide will include vaccination recommendations, health
                        tips, insurance guidance, and local medical resources.
                      </p>
                      <p>
                        <strong>
                          Please check back for important health and safety information!
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Tourist Safety & Scam Awareness */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('safety')}>
                <div className="header-content">
                  <Shield className="section-icon" />
                  <h3>Safety & Scam Prevention</h3>
                </div>
                {expandedSection === 'safety' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'safety' && (
                <div className="section-content">
                  <div className="tip-box">
                    <Shield className="tip-icon" />
                    <div>
                      <h4>Comprehensive Safety Guidelines Coming Soon</h4>
                      <p>
                        Your safety is our priority. We're developing detailed safety information
                        and scam prevention tips to ensure you have a worry-free celebration with
                        us.
                      </p>
                      <p>
                        Our guide will cover common tourist scams to avoid, general safety tips,
                        money safety, and trusted local resources.
                      </p>
                      <p>
                        <strong>
                          Important emergency contacts and safety guidance will be available
                          shortly!
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Money & Communication */}
            <motion.div
              className="travel-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <button className="section-header" onClick={() => toggleSection('money')}>
                <div className="header-content">
                  <DollarSign className="section-icon" />
                  <h3>Money & Communication</h3>
                </div>
                {expandedSection === 'money' ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSection === 'money' && (
                <div className="section-content">
                  <div className="tip-box">
                    <DollarSign className="tip-icon" />
                    <div>
                      <h4>Financial & Communication Tips Coming Soon</h4>
                      <p>
                        We're putting together practical information about currency, tipping,
                        staying connected, and other essentials for your Goa visit.
                      </p>
                      <p>
                        Our guide will help you navigate financial transactions, communication
                        options, and provide important contact information.
                      </p>
                      <p>
                        <strong>
                          Detailed money and communication guidance will be available soon!
                        </strong>
                      </p>
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
