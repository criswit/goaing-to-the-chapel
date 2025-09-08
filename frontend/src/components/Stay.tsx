import React from 'react';
import { motion } from 'framer-motion';
import { Hotel } from 'lucide-react';
import HotelInfoHeader from './HotelInfoHeader';
import ImageGallery from './ImageGallery';
import GoogleMapWidget from './GoogleMapWidget';
import '../styles/Stay.css';

const Stay: React.FC = () => {
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

        {/* Where You Are Staying - Main Section */}
        <motion.div
          className="stay-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
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

          <div className="hotel-highlights">
            <h4>Resort Highlights</h4>
            <div className="highlights-grid">
              <div className="highlight-item">
                <strong>37 Acres of Luxury</strong>
                <p>Sprawling beachfront property with lush gardens</p>
              </div>
              <div className="highlight-item">
                <strong>Direct Beach Access</strong>
                <p>Private access to pristine Varca Beach white sands</p>
              </div>
              <div className="highlight-item">
                <strong>South Goa's Longest Pool</strong>
                <p>Meandering swimming pool stretching across the resort</p>
              </div>
              <div className="highlight-item">
                <strong>6 Dining Options</strong>
                <p>From authentic Goan to Pan-Asian and European cuisine</p>
              </div>
              <div className="highlight-item">
                <strong>MAYA Spa</strong>
                <p>Signature spa with Ayurvedic and Western therapies</p>
              </div>
              <div className="highlight-item">
                <strong>Wedding Venues</strong>
                <p>Unicorn Hall & sea-facing lawns for celebrations</p>
              </div>
            </div>
          </div>

          <div className="hotel-content-grid">
            <div className="gallery-column">
              <ImageGallery className="hotel-gallery" autoPlay={true} autoPlayInterval={4000} />
            </div>
            <div className="details-column">
              <GoogleMapWidget className="venue-map" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stay;

