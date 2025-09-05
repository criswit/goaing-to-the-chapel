import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Attire.css';

const Attire: React.FC = () => {
  return (
    <section className="attire" id="attire">
      <div className="container">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Dress Code
        </motion.h2>

        <motion.div 
          className="attire-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="attire-intro">
            <p>We want you to be comfortable and enjoy the celebration!</p>
            <p>Here's what we suggest for each event:</p>
          </div>

          <div className="attire-grid">
            <div className="attire-card">
              <h3>Welcome Dinner</h3>
              <div className="attire-image beach-casual"></div>
              <h4>Beach Casual</h4>
              <p>Think sundresses, linen shirts, khakis, and sandals. Light, breathable fabrics are perfect for the beach setting.</p>
            </div>

            <div className="attire-card">
              <h3>Haldi & Mehndi</h3>
              <div className="attire-image indian-festive"></div>
              <h4>Colorful Indian Attire</h4>
              <p>Bright colors welcome! Traditional Indian wear like kurtas, lehengas, or colorful dresses. Yellow is traditional for Haldi.</p>
            </div>

            <div className="attire-card">
              <h3>Wedding Ceremony</h3>
              <div className="attire-image indian-formal"></div>
              <h4>Indian Formal / Cocktail</h4>
              <p>Sarees, lehengas, suits, or cocktail dresses. Feel free to embrace Indian fashion or wear formal Western attire.</p>
            </div>

            <div className="attire-card">
              <h3>Reception Party</h3>
              <div className="attire-image cocktail"></div>
              <h4>Cocktail / Formal</h4>
              <p>Time to party! Cocktail dresses, suits, or Indo-Western fusion. Dancing shoes recommended!</p>
            </div>
          </div>

          <div className="attire-note">
            <h3>Color Palette</h3>
            <p>We love colors! Feel free to wear vibrant hues.</p>
            <p>Please avoid wearing all white or all black to the ceremony.</p>
          </div>

          <div className="attire-note">
            <h3>Weather Note</h3>
            <p>June in Goa is warm and humid (25-30°C / 77-86°F)</p>
            <p>Light, breathable fabrics recommended. The reception is air-conditioned.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Attire;