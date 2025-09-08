import React, { useState } from 'react';
import {
  Plane,
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
import FlightOptions from './FlightOptions';
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
          Travel Information
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
            data-section="getting-to-goa-section"
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
                    <Calendar className="card-icon" />
                    <h4>Visa Required</h4>
                  </div>
                  <div className="card-content">
                    <p className="highlight-text">YES</p>
                    <p className="card-subtitle">
                      See more in the E-Visa Application Process section
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="travel-content-grid">
                {/* Flight Options Panel */}
                <div className="travel-panel flight-options-panel">
                  <div className="panel-header">
                    <Plane className="panel-icon" />
                    <h3>Flight Options & Analysis</h3>
                  </div>

                  <FlightOptions />
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
                      <div className="transport-option recommended">
                        <Car size={20} />
                        <div>
                          <h5>Pre-paid Taxi Counter</h5>
                          <span className="option-note">Most reliable - Book at airport</span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Car size={20} />
                        <div>
                          <h5>Hotel Transfer</h5>
                          <span className="option-note">Pre-arrange with your hotel</span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Navigation size={20} />
                        <div>
                          <h5>Goa Miles App</h5>
                          <span className="option-note">
                            Local app - works better than Uber/Ola
                          </span>
                        </div>
                      </div>
                      <div className="transport-option">
                        <Briefcase size={20} />
                        <div>
                          <h5>Rental Car with Driver</h5>
                          <span className="option-note">Book in advance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="warning-card" style={{ marginBottom: '1rem' }}>
                    <AlertCircle className="warning-icon" />
                    <div>
                      <strong>Important: Uber/Ola Restrictions</strong>
                      <p>
                        Due to government regulations, Uber and Ola services face significant
                        restrictions at Goa airport and may not be reliable. Use prepaid taxi
                        counters or Goa Miles app instead.
                      </p>
                    </div>
                  </div>

                  <div className="warning-card">
                    <AlertCircle className="warning-icon" />
                    <div>
                      <strong>Avoid Manohar Airport (GOX)</strong>
                      <p>
                        78km away (2+ hours) with limited flights. Always book to Dabolim (GOI) -
                        only 32km (50 minutes) from Zuri White Sands Resort.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consolidated Visa Guide Panel */}
                <div className="travel-panel" data-section="visa-guide-section">
                  <div className="panel-header">
                    <Shield className="panel-icon" />
                    <h3>Getting an Indian eVisa</h3>
                  </div>

                  <div className="visa-content">
                    {/* Application Process & Tips */}
                    <div className="visa-details-grid">
                      <div className="visa-info-card">
                        <Globe className="visa-icon" />
                        <h5>Application Process Steps</h5>
                        <ul>
                          <li>
                            Website:{' '}
                            <a
                              href="https://indianvisaonline.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="visa-link"
                            >
                              indianvisaonline.gov.in
                            </a>
                          </li>
                          <li>Processing: 3-5 business days</li>
                          <li>Cost: $10-$80 (varies by duration)</li>
                          <li>Entry: Air and sea ports only</li>
                          <li>
                            <strong>Apply 2-3 weeks ahead to avoid delays</strong>
                          </li>
                          <li>
                            <strong>Entry by land not allowed on e-Visa</strong>
                          </li>
                        </ul>
                      </div>

                      <div className="visa-info-card">
                        <Info className="visa-icon" />
                        <h5>Important Tips & Considerations</h5>
                        <ul>
                          <li>Multiple-entry visa recommended</li>
                          <li>Screenshot approval email</li>
                          <li>Print 2 copies of e-visa</li>
                          <li>Check passport expiry date</li>
                          <li>
                            <strong>Use only official site; avoid scams</strong>
                          </li>
                          <li>
                            <strong>Minors require notarized parent consent</strong>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Required Documents */}
                    <div className="doc-requirements">
                      <div className="doc-grid">
                        <div className="doc-category">
                          <h5>📋 For Visa Application</h5>
                          <ul>
                            <li>Passport (6+ months validity)</li>
                            <li>Passport photo (white background)</li>
                            <li>Return flight confirmation</li>
                            <li>Hotel booking confirmation</li>
                            <li>
                              <strong>FRRO/FRO registration if &gt;180 days stay</strong>
                            </li>
                          </ul>
                        </div>
                        <div className="doc-category">
                          <h5>👜 For Travel</h5>
                          <ul>
                            <li>Printed e-visa approval</li>
                            <li>Travel insurance documents</li>
                            <li>Wedding invitation</li>
                            <li>Emergency contact info</li>
                            <li>
                              <strong>Save consulate/emergency contacts</strong>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Visa Safety Notice */}
                    <div className="warning-card" style={{ marginTop: '20px' }}>
                      <AlertCircle className="warning-icon" />
                      <div>
                        <strong>Visa Safety Notice:</strong>
                        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                          <li>
                            Official site:{' '}
                            <a
                              href="https://indianvisaonline.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              indianvisaonline.gov.in
                            </a>
                          </li>
                          <li>Beware fake visa application websites</li>
                          <li>For FAQs and help, visit the official site</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Travel;
