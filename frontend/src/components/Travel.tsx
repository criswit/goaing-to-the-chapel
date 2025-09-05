import React, { useState } from 'react';
import { Plane, Hotel, Car, MapPin, DollarSign, Calendar, ChevronDown, ChevronUp, AlertCircle, Heart, Users, Shield } from 'lucide-react';
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
          <p>Flying to Goa for our February wedding? You've picked the perfect time! February offers ideal weather conditions with 20-38% lower fares than peak season.</p>
        </div>

        {/* Flight Information Section */}
        <motion.div
          className="travel-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <button
            className="section-header"
            onClick={() => toggleSection('flights')}
          >
            <div className="header-content">
              <Plane className="section-icon" />
              <h3>Getting to Goa</h3>
            </div>
            {expandedSection === 'flights' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'flights' && (
            <div className="section-content">
              <div className="flight-recommendations">
                <h4>✈️ Recommended Airlines & Routes</h4>
                
                <div className="airline-card featured">
                  <h5>🏆 Best Overall: Qatar Airways via Doha</h5>
                  <ul>
                    <li>Route: SEA/SFO → DOH → GOX (Manohar International Airport)</li>
                    <li>Journey time: 18-22 hours</li>
                    <li>Price: $1,053-$1,168 round trip</li>
                    <li>Why: World's #1 airline, excellent economy class</li>
                    <li>4x weekly service to new North Goa airport</li>
                  </ul>
                </div>

                <div className="airline-card">
                  <h5>✨ Premium Alternative: Emirates via Dubai</h5>
                  <ul>
                    <li>Daily SEA-DXB service with strong Goa connections</li>
                    <li>Price: ~$1,075 economy</li>
                    <li>Famous Dubai International Airport experience</li>
                    <li>Superior in-flight entertainment</li>
                  </ul>
                </div>

                <div className="airline-card">
                  <h5>🌍 European Options</h5>
                  <ul>
                    <li><strong>Lufthansa via Frankfurt:</strong> $983-$1,486</li>
                    <li><strong>British Airways via London:</strong> English-language service throughout</li>
                    <li>Journey time: 19-23 hours total</li>
                    <li>Great for those preferring Western hospitality</li>
                  </ul>
                </div>

                <div className="city-specific-recommendations">
                  <h5>🎯 City-Specific Recommendations</h5>
                  <div className="airline-card">
                    <h6>From Seattle (SEA)</h6>
                    <ul>
                      <li>Typical fare range: $1,000-$1,500 round trip</li>
                      <li>Best route: SEA → DOH → GOX via Qatar Airways</li>
                      <li>Journey time: 20-22 hours total</li>
                      <li>Alternative: Emirates via Dubai ($1,075+)</li>
                    </ul>
                  </div>
                  <div className="airline-card">
                    <h6>From San Francisco (SFO)</h6>
                    <ul>
                      <li>Typical fare range: $800-$1,300 round trip</li>
                      <li>Best route: Direct Air India to Delhi/Mumbai for connections</li>
                      <li>Journey time: 18-20 hours total</li>
                      <li>More flight options than Seattle</li>
                    </ul>
                  </div>
                  <div className="tip-box">
                    <AlertCircle className="tip-icon" />
                    <div>
                      <strong>💡 Pro Tip:</strong> SFO has better options than Seattle! Direct Air India flights to Delhi/Mumbai create superior connections. Book 5-6 months in advance (September-October) for best rates.
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-tips">
                <h4>📅 Booking Strategy</h4>
                <ul>
                  <li>🎯 <strong>Sweet spot:</strong> Book exactly 5-6 months before (Sept-Oct 2024)</li>
                  <li>💰 <strong>Save 10-20%:</strong> Book on Tuesday/Wednesday, fly mid-week</li>
                  <li>👥 <strong>Group discounts:</strong> 10+ passengers get 10-15% off on Air India</li>
                  <li>⏰ <strong>Arrival timing:</strong> Arrive Feb 11-12 for Feb 13 wedding</li>
                  <li>🔄 <strong>Connections:</strong> Allow minimum 2-4 hours in Doha/Dubai</li>
                </ul>
              </div>

              <div className="extended-stay">
                <h4>🗺️ Make it an Adventure!</h4>
                <p>Planning to stay longer? Transform our wedding into an India adventure:</p>
                <ul>
                  <li><strong>Golden Triangle (2 weeks):</strong> Delhi → Agra (Taj Mahal) → Jaipur → Goa</li>
                  <li><strong>Rajasthan Circuit (2-3 weeks):</strong> Add Udaipur, Jodhpur, desert safaris</li>
                  <li><strong>Kerala Extension (1-2 weeks):</strong> Backwaters, tea plantations, beaches</li>
                  <li><strong>Grand Tour (3+ weeks):</strong> North India heritage + Kerala nature + Goa celebration</li>
                </ul>
                <p className="highlight">February weather is PERFECT across all regions! Extended stays reduce per-day flight costs from $200-300 to just $50-80.</p>
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
          <button 
            className="section-header"
            onClick={() => toggleSection('visa')}
          >
            <div className="header-content">
              <Calendar className="section-icon" />
              <h3>Visa & Documentation</h3>
            </div>
            {expandedSection === 'visa' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'visa' && (
            <div className="section-content">
              <div className="visa-info">
                <h4>📋 E-Visa Requirements</h4>
                <ul>
                  <li>🌐 Apply online: <a href="https://indianvisaonline.gov.in/" target="_blank" rel="noopener noreferrer">indianvisaonline.gov.in</a></li>
                  <li>⏱️ Processing: 3-5 business days (apply 4+ days before departure)</li>
                  <li>💵 Cost: $10-80 depending on validity period</li>
                  <li>📅 Apply window: 30-120 days before travel</li>
                  <li>✈️ Entry restricted to air and sea ports only</li>
                </ul>

                <h4>📄 Required Documents</h4>
                <ul>
                  <li>Passport valid for 6+ months</li>
                  <li>Passport photo (white background)</li>
                  <li>Return flight tickets</li>
                  <li>Hotel confirmation</li>
                </ul>

                <div className="tip-box">
                  <AlertCircle className="tip-icon" />
                  <div>
                    <strong>Important:</strong> Apply 2-3 weeks before departure for comfortable buffer. Multiple-entry visas recommended for extended stays.
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
          <button 
            className="section-header"
            onClick={() => toggleSection('etiquette')}
          >
            <div className="header-content">
              <Users className="section-icon" />
              <h3>Cultural Etiquette & Respect</h3>
            </div>
            {expandedSection === 'etiquette' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'etiquette' && (
            <div className="section-content">
              <h4>🏖️ Beach Behavior Guidelines</h4>
              <ul>
                <li>Dress modestly when not on the beach - cover shoulders and knees</li>
                <li>No topless sunbathing - respect local conservative values</li>
                <li>Beachwear is for the beach only, not for town or restaurants</li>
                <li>Be mindful of local families and children nearby</li>
              </ul>

              <h4>🤝 Local Interaction & Respect</h4>
              <ul>
                <li>Avoid stereotypes - engage with locals considerately</li>
                <li>Ask permission before photographing people or religious sites</li>
                <li>Remove shoes when entering homes or temples</li>
                <li>Use your right hand for greetings and exchanges</li>
                <li>Public displays of affection should be minimal</li>
              </ul>

              <h4>🌿 Environmental Respect</h4>
              <ul>
                <li>No driving vehicles on beaches - it's illegal and harmful</li>
                <li>Respect wildlife - don't feed or disturb animals</li>
                <li>Dispose of trash properly - help keep Goa beautiful</li>
                <li>Support eco-friendly businesses when possible</li>
              </ul>

              <h4>🔇 Noise Considerations</h4>
              <ul>
                <li>No loud music or parties in residential areas after 10 PM</li>
                <li>Be mindful of noise levels at beaches and public spaces</li>
                <li>Respect quiet hours at hotels (typically 10 PM - 8 AM)</li>
              </ul>

              <h4>🛕 Religious & Cultural Sites</h4>
              <ul>
                <li>Dress conservatively at temples and churches</li>
                <li>Photography may be restricted in religious places</li>
                <li>Follow posted rules and local customs</li>
                <li>Maintain silence and respectful behavior</li>
              </ul>

              <div className="tip-box">
                <AlertCircle className="tip-icon" />
                <div>
                  <strong>Remember:</strong> You're a guest in their home. Showing respect for local customs enhances your experience and helps preserve Goa's welcoming spirit for future visitors.
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
          <button 
            className="section-header"
            onClick={() => toggleSection('hotels')}
          >
            <div className="header-content">
              <Hotel className="section-icon" />
              <h3>Where to Stay</h3>
            </div>
            {expandedSection === 'hotels' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'hotels' && (
            <div className="section-content">
              <div className="hotel-block">
                <h4>🏨 Primary Hotel Block</h4>
                <div className="hotel-card featured">
                  <h5>The Leela Goa</h5>
                  <p>Mobor Beach, Cavelossim, South Goa</p>
                  <ul>
                    <li>📍 10 minutes from wedding venue</li>
                    <li>💰 Group rate: $150/night (use code: ALEXBEN2024)</li>
                    <li>📅 Book by: January 15, 2024</li>
                    <li>🏖️ Private beach access</li>
                    <li>🍳 Complimentary breakfast</li>
                    <li>💆 Spa and pool facilities</li>
                    <li>📶 Free WiFi throughout</li>
                  </ul>
                  <button className="book-btn">Book Now</button>
                </div>

                <h4>Alternative Accommodations</h4>
                <div className="hotel-options">
                  <div className="hotel-card">
                    <h5>Taj Exotica Resort & Spa</h5>
                    <p>Benaulim Beach</p>
                    <p>$200-250/night • 15 min to venue</p>
                  </div>
                  <div className="hotel-card">
                    <h5>Alila Diwa Goa</h5>
                    <p>Majorda Beach</p>
                    <p>$120-150/night • 20 min to venue</p>
                  </div>
                  <div className="hotel-card">
                    <h5>Budget Option: Novotel Goa</h5>
                    <p>Candolim</p>
                    <p>$80-100/night • 30 min to venue</p>
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
          <button 
            className="section-header"
            onClick={() => toggleSection('transport')}
          >
            <div className="header-content">
              <Car className="section-icon" />
              <h3>Getting Around Goa</h3>
            </div>
            {expandedSection === 'transport' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'transport' && (
            <div className="section-content">
              <h4>🚕 Safe Airport Transfer Options</h4>
              <div className="safety-recommendations">
                <ul>
                  <li><strong>✅ Recommended:</strong> GoaMiles app or hotel-arranged transfers</li>
                  <li><strong>⚠️ Avoid:</strong> Random airport taxis (often overpriced/scams)</li>
                  <li><strong>Pre-paid taxis:</strong> Use official counters inside terminal only</li>
                  <li><strong>💡 Timing:</strong> Arrive during daylight for easier/safer transport</li>
                </ul>
                <div className="tip-box">
                  <AlertCircle className="tip-icon" />
                  <div>
                    <strong>Warning:</strong> Airport taxi touts may quote 3-5x normal rates. Always use official pre-paid counters or apps.
                  </div>
                </div>
              </div>

              <h4>📍 Distance & Pricing from Manohar International (GOX)</h4>
              <ul>
                <li>→ Panaji: 40 min, ₹870-921 ($11-12) via app</li>
                <li>→ Beach areas: 60-75 min, ₹1,149-1,271 ($14-16) via app</li>
                <li>→ Hotel transfers: Usually ₹1,500-2,000 ($18-24) but safer</li>
              </ul>

              <h4>🚗 Local Transportation Safety</h4>
              <div className="transport-options">
                <div className="transport-card">
                  <h5>✅ GoaMiles/Uber/Ola Apps</h5>
                  <p>Safest option with tracked rides and fair pricing</p>
                  <p className="highlight">Download GoaMiles before arrival!</p>
                </div>
                <div className="transport-card">
                  <h5>Hotel Cars</h5>
                  <p>Most reliable but 30-50% more expensive</p>
                  <p>Best for late night or early morning trips</p>
                </div>
                <div className="transport-card">
                  <h5>Auto-rickshaws</h5>
                  <p>Great for short distances</p>
                  <p className="warning">⚠️ Always negotiate fare before starting</p>
                </div>
                <div className="transport-card">
                  <h5>Rental Scooters</h5>
                  <p>₹300-500/day - International license required!</p>
                  <p className="warning">⚠️ Check vehicle condition, take photos before rental</p>
                </div>
              </div>

              <h4>⚠️ Scam Prevention Tips</h4>
              <ul>
                <li>📱 Use apps for pricing transparency</li>
                <li>🚫 Avoid taxis that approach you directly at airport</li>
                <li>📸 Photo document rental vehicles before/after</li>
                <li>💰 Confirm price before any journey</li>
                <li>📍 Share ride details with someone when traveling alone</li>
              </ul>

              <div className="wedding-shuttles">
                <h4>🚌 Wedding Event Shuttles</h4>
                <p>Complimentary shuttle service between hotels and venues:</p>
                <ul>
                  <li>Mehendi/Sangeet: Pickups start 3:30 PM</li>
                  <li>Wedding Ceremony: Pickups start 8:30 AM</li>
                  <li>Reception: Pickups start 6:30 PM</li>
                </ul>
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
          <button 
            className="section-header"
            onClick={() => toggleSection('explore')}
          >
            <div className="header-content">
              <MapPin className="section-icon" />
              <h3>Explore Goa</h3>
            </div>
            {expandedSection === 'explore' ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSection === 'explore' && (
            <div className="section-content">
              <h4>🏖️ Beaches</h4>
              <ul>
                <li><strong>Palolem Beach:</strong> Picture-perfect crescent beach in South Goa</li>
                <li><strong>Anjuna Beach:</strong> Famous Wednesday flea market</li>
                <li><strong>Baga Beach:</strong> Water sports and beach shacks</li>
                <li><strong>Agonda Beach:</strong> Peaceful and less crowded</li>
              </ul>

              <h4>🏛️ Culture & Heritage</h4>
              <ul>
                <li><strong>Old Goa Churches:</strong> UNESCO World Heritage sites</li>
                <li><strong>Fontainhas:</strong> Colorful Portuguese quarter in Panaji</li>
                <li><strong>Spice Plantations:</strong> Guided tours with lunch</li>
                <li><strong>Dudhsagar Falls:</strong> Spectacular 4-tiered waterfall</li>
              </ul>

              <h4>🍽️ Must-Try Experiences</h4>
              <ul>
                <li>Sunset at Chapora Fort</li>
                <li>Dolphin watching cruise</li>
                <li>Night market at Arpora (Saturday)</li>
                <li>Ayurvedic spa treatment</li>
                <li>Beach yoga sessions</li>
              </ul>

              <h4>🍽️ Enhanced Dining Safety & Recommendations</h4>
              <div className="dining-safety">
                <h5>Safe Eating Guidelines</h5>
                <ul>
                  <li>💧 <strong>Water:</strong> Only sealed bottled water, avoid ice from unknown sources</li>
                  <li>🏪 <strong>Street food:</strong> Choose clean, busy vendors with hot, freshly cooked food</li>
                  <li>🧼 <strong>Restaurant selection:</strong> Check cleanliness, prefer busy establishments</li>
                  <li>💳 <strong>Payment:</strong> Use digital payments when possible for security</li>
                  <li>🥗 <strong>Raw foods:</strong> Avoid uncooked vegetables, salads, and cut fruits initially</li>
                  <li>🍶 <strong>Dairy:</strong> Be cautious with lassis and milk-based drinks from street vendors</li>
                </ul>

                <div className="tip-box">
                  <AlertCircle className="tip-icon" />
                  <div>
                    <strong>Pro Tip:</strong> Start with hotel restaurants, then gradually try local places. Look for busy restaurants with high local customer turnover - it means fresh food!
                  </div>
                </div>
              </div>

              <h4>🍴 Recommended Restaurants & Dishes</h4>
              <div className="food-grid">
                <div className="food-card">
                  <strong>Safe & Highly Rated Restaurants:</strong>
                  <ul>
                    <li>Gunpowder (Assagao) - Clean, upscale Indian</li>
                    <li>Fisherman's Wharf - Tourist-friendly seafood</li>
                    <li>Vinayak Family Restaurant - Authentic local, very clean</li>
                    <li>Black Sheep Bistro (Panaji) - European & Goan fusion</li>
                    <li>Mum's Kitchen - Traditional Goan, high hygiene standards</li>
                  </ul>
                </div>
                <div className="food-card">
                  <strong>Must-Try Dishes (from reputable places):</strong>
                  <ul>
                    <li>Fish curry rice (Goan staple)</li>
                    <li>Chicken Xacuti (spiced curry)</li>
                    <li>Prawn Balchão (pickled prawns)</li>
                    <li>Bebinca (layered dessert) - packaged preferred</li>
                    <li>Feni (local cashew spirit) - only from licensed shops</li>
                  </ul>
                </div>
              </div>

              <h4>🥤 Beverage Safety</h4>
              <ul>
                <li>✅ Sealed bottled water (check seal isn't broken)</li>
                <li>✅ Hot tea/coffee (boiled water)</li>
                <li>✅ Bottled soft drinks and beer</li>
                <li>⚠️ Fresh juices only from upscale places</li>
                <li>❌ Tap water, fountain drinks, questionable ice</li>
              </ul>
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
          <button 
            className="section-header"
            onClick={() => toggleSection('safety')}
          >
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
                <li><strong>Overpriced Taxi Fares:</strong> Airport taxis quoting 3-5x normal rates</li>
                <li><strong>Rental Vehicle Damage Claims:</strong> False damage claims on returns</li>
                <li><strong>Gem/Jewelry Scams:</strong> "Special price" precious stones that are worthless</li>
                <li><strong>Beach Vendor Pressure:</strong> Aggressive selling of overpriced items</li>
                <li><strong>Currency Exchange:</strong> Poor rates at unofficial exchanges</li>
                <li><strong>Tourist Menu Pricing:</strong> Different (higher) prices for tourists</li>
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
                  <strong>Golden Rule:</strong> If a deal seems too good to be true, it probably is. Trust your instincts and don't be afraid to walk away from uncomfortable situations.
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
          <button 
            className="section-header"
            onClick={() => toggleSection('health')}
          >
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
                <li>💊 Essential medications: Pepto-Bismol, Imodium, antihistamines, pain relievers</li>
                <li>🏊 Avoid risky activities (unregulated adventure sports)</li>
              </ul>

              <h4>🛡️ Enhanced Travel Insurance Requirements</h4>
              <p><strong>Comprehensive coverage is essential:</strong></p>
              <ul>
                <li><strong>Medical coverage:</strong> $50,000+ minimum recommended</li>
                <li><strong>Medical evacuation:</strong> $50,000-$100,000 coverage</li>
                <li><strong>Trip cancellation:</strong> Full trip cost protection</li>
                <li><strong>COVID-19 coverage:</strong> Ensure policy covers pandemic-related issues</li>
                <li><strong>Adventure activities:</strong> Add riders if planning water sports/trekking</li>
                <li><strong>Cost:</strong> ~$12-15 per day (worth every penny!)</li>
              </ul>

              <div className="tip-box">
                <AlertCircle className="tip-icon" />
                <div>
                  <strong>Pro Tip:</strong> Purchase insurance when booking flights for immediate coverage. Keep copies of policy and emergency numbers in multiple places (phone, wallet, hotel safe).
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
          <button 
            className="section-header"
            onClick={() => toggleSection('money')}
          >
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
                <li><strong>International plans:</strong> Check with your carrier</li>
                <li><strong>Local SIM:</strong> Available at airport (~₹500 for 1GB/day)</li>
                <li><strong>WiFi:</strong> Available at all hotels and most restaurants</li>
                <li><strong>WhatsApp:</strong> Most used messaging app in India</li>
              </ul>

              <h4>🔌 Other Essentials</h4>
              <ul>
                <li>Power adapter: Type C, D, and M plugs (230V)</li>
                <li>Time zone: GMT+5:30 (10.5-13.5 hours ahead of US)</li>
              </ul>

              <h4>🚨 Emergency Contacts</h4>
              <ul>
                <li><strong>Police:</strong> 100</li>
                <li><strong>Medical Emergency:</strong> 108</li>
                <li><strong>Fire:</strong> 101</li>
                <li><strong>Tourist Helpline:</strong> 1800-11-1363 (24/7)</li>
                <li><strong>US Consulate Mumbai:</strong> +91-22-2672-4000</li>
                <li><strong>Nearest Hospital:</strong> Manipal Hospital Goa: +91-832-2458888</li>
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