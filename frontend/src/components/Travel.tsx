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
          Travel Information
        </motion.h2>

        <div className="travel-intro">
          <p>
            Flying to Goa for our February wedding? You've picked the perfect time! February offers
            ideal weather conditions with 20-38% lower fares than peak season.
          </p>
        </div>

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
                      <strong>Recommendation:</strong> SFO offers better routing options. Direct Air
                      India flights to Delhi/Mumbai provide superior connections to Goa.
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
                    February provides ideal weather across all regions. Extended stays reduce daily
                    flight costs from $200-300 to $50-80.
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
              <h4>🏖️ Beach Etiquette Guidelines</h4>
              <ul>
                <li>
                  Maintain appropriate attire when away from beach areas - please ensure shoulders
                  and knees are covered in public spaces
                </li>
                <li>
                  Topless sunbathing is not permitted - we encourage respecting local cultural
                  sensitivities
                </li>
                <li>
                  Beach attire is appropriate for coastal areas only; modest clothing is recommended
                  for dining establishments and urban areas
                </li>
                <li>Please be considerate of local families and children in shared beach spaces</li>
              </ul>

              <h4>🤝 Cultural Engagement & Courtesy</h4>
              <ul>
                <li>
                  Engage with local community members with genuine interest and respect, avoiding
                  assumptions or generalizations
                </li>
                <li>Please request permission before photographing individuals or sacred sites</li>
                <li>Footwear should be removed when entering private homes or places of worship</li>
                <li>
                  Traditional etiquette suggests using your right hand for greetings and monetary
                  exchanges
                </li>
                <li>
                  Public displays of affection should be kept minimal in accordance with local
                  customs
                </li>
              </ul>

              <h4>🌿 Environmental Stewardship</h4>
              <ul>
                <li>Vehicle access on beaches is prohibited by law and harmful to the ecosystem</li>
                <li>
                  Please observe wildlife from a respectful distance and refrain from feeding
                  animals
                </li>
                <li>Proper waste disposal helps maintain Goa's natural beauty for all visitors</li>
                <li>We encourage supporting environmentally conscious local businesses</li>
              </ul>

              <h4>🔇 Community Noise Guidelines</h4>
              <ul>
                <li>Please observe quiet hours in residential areas after 10:00 PM</li>
                <li>Maintain considerate noise levels in public beach areas and shared spaces</li>
                <li>Most accommodations observe quiet hours from 10:00 PM to 8:00 AM</li>
              </ul>

              <h4>🛕 Sacred Sites & Places of Worship</h4>
              <ul>
                <li>
                  Conservative dress is required when visiting temples, churches, and religious
                  sites
                </li>
                <li>Photography restrictions may apply at certain religious locations</li>
                <li>Please observe all posted guidelines and local customs</li>
                <li>Quiet, respectful behavior is expected in places of worship</li>
              </ul>

              <div className="tip-box">
                <AlertCircle className="tip-icon" />
                <div>
                  <strong>Cultural Appreciation:</strong> As honored guests in Goa, demonstrating
                  respect for local customs and traditions enriches your travel experience while
                  helping preserve the region's warm hospitality for future visitors.
                </div>
              </div>
            </div>
          )}
        </motion.div>

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
              <div className="accordion-content">
                <div className="content-column">
                  <h4>Primary Hotel Block</h4>
                  <div className="hotel-card featured">
                    <h5>The Leela Goa</h5>
                    <p>Mobor Beach, Cavelossim, South Goa</p>
                    <div className="info-grid">
                      <div>
                        <ul>
                          <li>10 minutes from venue</li>
                          <li>Group rate: $150/night</li>
                          <li>Booking code: ALEXBEN2024</li>
                          <li>Deadline: January 15, 2024</li>
                        </ul>
                      </div>
                      <div>
                        <ul>
                          <li>Private beach access</li>
                          <li>Complimentary breakfast</li>
                          <li>Spa and pool facilities</li>
                          <li>Free WiFi throughout</li>
                        </ul>
                      </div>
                    </div>
                    <button className="book-btn">Reserve Room</button>
                  </div>
                </div>

                <div className="content-column">
                  <h4>Alternative Accommodations</h4>
                  <div className="info-grid">
                    <div className="info-section">
                      <h5>Taj Exotica Resort & Spa</h5>
                      <ul>
                        <li>Location: Benaulim Beach</li>
                        <li>Rate: $200-250/night</li>
                        <li>Distance: 15 minutes to venue</li>
                        <li>Luxury beachfront resort</li>
                      </ul>
                    </div>
                    <div className="info-section">
                      <h5>Alila Diwa Goa</h5>
                      <ul>
                        <li>Location: Majorda Beach</li>
                        <li>Rate: $120-150/night</li>
                        <li>Distance: 20 minutes to venue</li>
                        <li>Contemporary design resort</li>
                      </ul>
                    </div>
                  </div>
                  <div className="info-section">
                    <h5>Budget-Friendly Option</h5>
                    <ul>
                      <li>
                        <strong>Novotel Goa:</strong> Candolim location
                      </li>
                      <li>
                        <strong>Rate:</strong> $80-100/night
                      </li>
                      <li>
                        <strong>Distance:</strong> 30 minutes to venue
                      </li>
                      <li>
                        <strong>Amenities:</strong> International standards
                      </li>
                    </ul>
                  </div>
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
              <div className="accordion-content">
                <div className="content-column">
                  <h4>Airport Transfer Options</h4>

                  <div className="info-section">
                    <h5>Recommended Services</h5>
                    <ul>
                      <li>GoaMiles app (pre-download required)</li>
                      <li>Hotel-arranged transfers</li>
                      <li>Official pre-paid taxi counters</li>
                      <li>Arrive during daylight hours</li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Distance & Pricing from GOX Airport</h5>
                    <ul>
                      <li>
                        <strong>Panaji:</strong> 40 min, $11-12
                      </li>
                      <li>
                        <strong>Beach areas:</strong> 60-75 min, $14-16
                      </li>
                      <li>
                        <strong>Hotel transfers:</strong> $18-24 (premium service)
                      </li>
                    </ul>
                  </div>

                  <div className="tip-box">
                    <AlertCircle className="tip-icon" />
                    <div>
                      <strong>Important:</strong> Avoid unauthorized taxis approaching at airport.
                      Use official services only.
                    </div>
                  </div>
                </div>

                <div className="content-column">
                  <h4>Local Transportation</h4>

                  <div className="info-grid">
                    <div className="info-section">
                      <h5>Ride-Hailing Apps</h5>
                      <ul>
                        <li>GoaMiles (recommended)</li>
                        <li>Uber and Ola available</li>
                        <li>Tracked rides, fair pricing</li>
                        <li>Safest transportation option</li>
                      </ul>
                    </div>
                    <div className="info-section">
                      <h5>Alternative Options</h5>
                      <ul>
                        <li>
                          <strong>Hotel cars:</strong> Most reliable
                        </li>
                        <li>
                          <strong>Auto-rickshaws:</strong> Negotiate first
                        </li>
                        <li>
                          <strong>Scooter rental:</strong> ₹300-500/day
                        </li>
                        <li>
                          <strong>License required</strong> for rentals
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="info-section">
                    <h5>Safety Guidelines</h5>
                    <ul className="compact-list">
                      <li>Use apps for transparent pricing</li>
                      <li>Document rental vehicle condition</li>
                      <li>Confirm fares before departure</li>
                      <li>Share ride details when alone</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-content-single">
                <div className="wedding-shuttles">
                  <h4>Complimentary Wedding Shuttles</h4>
                  <div className="info-grid three-columns">
                    <div className="info-section">
                      <h5>Mehendi/Sangeet</h5>
                      <p>Pickup service starts 3:30 PM from all partner hotels</p>
                    </div>
                    <div className="info-section">
                      <h5>Wedding Ceremony</h5>
                      <p>Morning pickups begin 8:30 AM for ceremony attendance</p>
                    </div>
                    <div className="info-section">
                      <h5>Reception</h5>
                      <p>Evening shuttles start 6:30 PM to reception venue</p>
                    </div>
                  </div>
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
              <div className="accordion-content">
                <div className="content-column">
                  <h4>Attractions & Activities</h4>

                  <div className="info-section">
                    <h5>Beaches</h5>
                    <ul>
                      <li>
                        <strong>Palolem Beach:</strong> Crescent bay, South Goa
                      </li>
                      <li>
                        <strong>Anjuna Beach:</strong> Wednesday flea market
                      </li>
                      <li>
                        <strong>Baga Beach:</strong> Water sports, dining
                      </li>
                      <li>
                        <strong>Agonda Beach:</strong> Serene, less crowded
                      </li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Cultural Sites</h5>
                    <ul>
                      <li>
                        <strong>Old Goa Churches:</strong> UNESCO heritage
                      </li>
                      <li>
                        <strong>Fontainhas:</strong> Portuguese quarter
                      </li>
                      <li>
                        <strong>Spice Plantations:</strong> Guided tours
                      </li>
                      <li>
                        <strong>Dudhsagar Falls:</strong> Four-tiered waterfall
                      </li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Essential Experiences</h5>
                    <ul className="compact-list">
                      <li>Chapora Fort sunset viewing</li>
                      <li>Dolphin watching cruises</li>
                      <li>Arpora night market (Saturday)</li>
                      <li>Ayurvedic spa treatments</li>
                      <li>Beach yoga sessions</li>
                    </ul>
                  </div>
                </div>

                <div className="content-column">
                  <h4>Dining & Safety</h4>

                  <div className="info-section">
                    <h5>Recommended Restaurants</h5>
                    <ul>
                      <li>
                        <strong>Gunpowder (Assagao):</strong> Upscale Indian
                      </li>
                      <li>
                        <strong>Fisherman's Wharf:</strong> Tourist-friendly seafood
                      </li>
                      <li>
                        <strong>Black Sheep Bistro:</strong> European fusion
                      </li>
                      <li>
                        <strong>Mum's Kitchen:</strong> Traditional Goan
                      </li>
                      <li>
                        <strong>Vinayak Family:</strong> Authentic local
                      </li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Essential Dishes</h5>
                    <ul>
                      <li>Fish curry rice (regional staple)</li>
                      <li>Chicken Xacuti (spiced curry)</li>
                      <li>Prawn Balchão (pickled preparation)</li>
                      <li>Bebinca (layered dessert)</li>
                      <li>Feni (cashew spirit)</li>
                    </ul>
                  </div>

                  <div className="info-section">
                    <h5>Food Safety Guidelines</h5>
                    <ul className="compact-list">
                      <li>Sealed bottled water only</li>
                      <li>Choose busy, clean establishments</li>
                      <li>Hot, freshly prepared food</li>
                      <li>Avoid street vendor dairy</li>
                      <li>Start with hotel dining</li>
                      <li>Use digital payments when possible</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-content-single">
                <div className="tip-box">
                  <AlertCircle className="tip-icon" />
                  <div>
                    <strong>Dining Strategy:</strong> Begin with hotel restaurants to acclimate,
                    then explore local establishments. High customer turnover indicates fresh food
                    preparation.
                  </div>
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
              <h4>🚨 Common Tourist Scams to Avoid</h4>
              <ul>
                <li>
                  <strong>Overpriced Taxi Fares:</strong> Airport taxis quoting 3-5x normal rates
                </li>
                <li>
                  <strong>Rental Vehicle Damage Claims:</strong> False damage claims on returns
                </li>
                <li>
                  <strong>Gem/Jewelry Scams:</strong> "Special price" precious stones that are
                  worthless
                </li>
                <li>
                  <strong>Beach Vendor Pressure:</strong> Aggressive selling of overpriced items
                </li>
                <li>
                  <strong>Currency Exchange:</strong> Poor rates at unofficial exchanges
                </li>
                <li>
                  <strong>Tourist Menu Pricing:</strong> Different (higher) prices for tourists
                </li>
              </ul>

              <h4>🛡️ General Safety Tips</h4>
              <ul>
                <li>📱 Keep digital copies of all important documents</li>
                <li>💰 Use hotel safes for valuables and extra cash</li>
                <li>🏖️ Don't leave belongings unattended on beaches</li>
                <li>🌃 Avoid isolated areas after dark</li>
                <li>👥 Travel in groups when possible, especially at night</li>
                <li>📸 Be discreet with expensive cameras and jewelry</li>
                <li>🍺 Know your limits with alcohol, especially in unfamiliar settings</li>
              </ul>

              <h4>💳 Money Safety</h4>
              <ul>
                <li>Use ATMs attached to banks, not standalone machines</li>
                <li>Notify your bank of travel dates to avoid card blocks</li>
                <li>Carry cash in small denominations for tips/small purchases</li>
                <li>Keep emergency cash in multiple locations</li>
                <li>Use RFID-blocking wallet for cards</li>
              </ul>

              <h4>📚 Trusted Resources</h4>
              <div className="resource-grid">
                <div className="resource-card">
                  <strong>Local Blogs & Guides:</strong>
                  <ul>
                    <li>Goa Tourism official website</li>
                    <li>TripAdvisor Goa forums</li>
                    <li>Local expat Facebook groups</li>
                  </ul>
                </div>
                <div className="resource-card">
                  <strong>Emergency Contacts:</strong>
                  <ul>
                    <li>Tourist Police: 1800-11-1363</li>
                    <li>Medical Emergency: 108</li>
                    <li>US Consulate Mumbai: +91-22-2672-4000</li>
                  </ul>
                </div>
              </div>

              <div className="tip-box">
                <AlertCircle className="tip-icon" />
                <div>
                  <strong>Golden Rule:</strong> If a deal seems too good to be true, it probably is.
                  Trust your instincts and don't be afraid to walk away from uncomfortable
                  situations.
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
              <h4>💉 Vaccinations & COVID-19</h4>
              <p>Consult your doctor 4-6 weeks before travel:</p>
              <ul>
                <li>Hepatitis A & B (strongly recommended)</li>
                <li>Typhoid (for rural areas)</li>
                <li>Routine vaccines should be up-to-date</li>
                <li>COVID-19: Check latest India entry requirements</li>
                <li>Carry vaccination documentation (physical and digital)</li>
              </ul>

              <h4>🦟 Mosquito Protection & Disease Prevention</h4>
              <ul>
                <li>Use DEET-based repellent from dusk to dawn (malaria and dengue risk)</li>
                <li>Wear long sleeves and pants in the evening</li>
                <li>Consider prophylaxis for extended stays (consult travel clinic)</li>
                <li>Use mosquito nets if windows aren't screened</li>
                <li>Stay in air-conditioned rooms when possible</li>
              </ul>

              <h4>🏥 Health Tips & Hygiene</h4>
              <ul>
                <li>💧 Drink only sealed bottled water (avoid ice from unknown sources)</li>
                <li>🧼 Frequent hand washing/sanitizer use is essential</li>
                <li>🍽️ Stick to hotel/venue food initially, gradually try local cuisine</li>
                <li>☀️ Use sunscreen SPF 30+ and stay hydrated</li>
                <li>
                  💊 Essential medications: Pepto-Bismol, Imodium, antihistamines, pain relievers
                </li>
                <li>🏊 Avoid risky activities (unregulated adventure sports)</li>
              </ul>

              <h4>🛡️ Enhanced Travel Insurance Requirements</h4>
              <p>
                <strong>Comprehensive coverage is essential:</strong>
              </p>
              <ul>
                <li>
                  <strong>Medical coverage:</strong> $50,000+ minimum recommended
                </li>
                <li>
                  <strong>Medical evacuation:</strong> $50,000-$100,000 coverage
                </li>
                <li>
                  <strong>Trip cancellation:</strong> Full trip cost protection
                </li>
                <li>
                  <strong>COVID-19 coverage:</strong> Ensure policy covers pandemic-related issues
                </li>
                <li>
                  <strong>Adventure activities:</strong> Add riders if planning water
                  sports/trekking
                </li>
                <li>
                  <strong>Cost:</strong> ~$12-15 per day (worth every penny!)
                </li>
              </ul>

              <div className="tip-box">
                <AlertCircle className="tip-icon" />
                <div>
                  <strong>Pro Tip:</strong> Purchase insurance when booking flights for immediate
                  coverage. Keep copies of policy and emergency numbers in multiple places (phone,
                  wallet, hotel safe).
                </div>
              </div>

              <h4>🌡️ February Weather</h4>
              <div className="weather-info">
                <p>Perfect conditions for our celebration!</p>
                <ul>
                  <li>☀️ Temperature: 79°F (26°C) average</li>
                  <li>💧 Rainfall: Almost none (0.1mm)</li>
                  <li>🌅 Sunny days with coastal breeze</li>
                  <li>👕 Pack light, breathable clothing</li>
                </ul>
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
              <h4>💰 Currency</h4>
              <ul>
                <li>Indian Rupees (₹) - Current rate: $1 = ₹83</li>
                <li>ATMs widely available (notify your bank of travel)</li>
                <li>Credit cards accepted at hotels and major shops</li>
                <li>Carry cash for markets and small vendors</li>
              </ul>

              <h4>💵 Tipping Guide</h4>
              <ul>
                <li>Hotels: ₹100-200 for bellhops/housekeeping</li>
                <li>Restaurants: 10% if service charge not included</li>
                <li>Drivers: ₹200-300 for full day</li>
                <li>Spa: 10-15% of service cost</li>
              </ul>

              <h4>📱 Staying Connected</h4>
              <ul>
                <li>
                  <strong>International plans:</strong> Check with your carrier
                </li>
                <li>
                  <strong>Local SIM:</strong> Available at airport (~₹500 for 1GB/day)
                </li>
                <li>
                  <strong>WiFi:</strong> Available at all hotels and most restaurants
                </li>
                <li>
                  <strong>WhatsApp:</strong> Most used messaging app in India
                </li>
              </ul>

              <h4>🔌 Other Essentials</h4>
              <ul>
                <li>Power adapter: Type C, D, and M plugs (230V)</li>
                <li>Time zone: GMT+5:30 (10.5-13.5 hours ahead of US)</li>
              </ul>

              <h4>🚨 Emergency Contacts</h4>
              <ul>
                <li>
                  <strong>Police:</strong> 100
                </li>
                <li>
                  <strong>Medical Emergency:</strong> 108
                </li>
                <li>
                  <strong>Fire:</strong> 101
                </li>
                <li>
                  <strong>Tourist Helpline:</strong> 1800-11-1363 (24/7)
                </li>
                <li>
                  <strong>US Consulate Mumbai:</strong> +91-22-2672-4000
                </li>
                <li>
                  <strong>Nearest Hospital:</strong> Manipal Hospital Goa: +91-832-2458888
                </li>
              </ul>
            </div>
          )}
        </motion.div>

        {/* Quick Reference Card */}
        <motion.div
          className="quick-reference"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3>📱 Quick Reference</h3>
          <div className="reference-grid">
            <div className="reference-item">
              <strong>Wedding Coordinator:</strong>
              <p>Sarah Johnson</p>
              <p>WhatsApp: +1-555-0123</p>
              <p>Available 24/7 during wedding week</p>
            </div>
            <div className="reference-item">
              <strong>Hotel Contact:</strong>
              <p>The Leela Goa</p>
              <p>+91-832-662-1234</p>
              <p>Ask for wedding guest services</p>
            </div>
            <div className="reference-item">
              <strong>Emergency Contacts:</strong>
              <p>🚓 Police: 100</p>
              <p>🚑 Medical: 108</p>
              <p>📞 Tourist Helpline: 1800-11-1363</p>
            </div>
            <div className="reference-item">
              <strong>Wedding Couple:</strong>
              <p>Alex: +1-555-0456</p>
              <p>Ben: +1-555-0789</p>
              <p>WhatsApp preferred</p>
            </div>
            <div className="reference-item">
              <strong>US Consulate Mumbai:</strong>
              <p>+91-22-2672-4000</p>
              <p>Emergency after-hours: +91-22-2672-4000</p>
            </div>
            <div className="reference-item">
              <strong>Group WhatsApp:</strong>
              <p>Join "Chris&Aakanchha Wedding Guests"</p>
              <p>[QR Code]</p>
              <p>For real-time updates & coordination</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Travel;
