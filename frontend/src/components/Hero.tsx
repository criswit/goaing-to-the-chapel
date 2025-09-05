import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Hero.css';

const Hero: React.FC = () => {
  return (
    <section className="hero" id="hero">
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="hero-title">Goa'ing to the Chapel</h1>
        <div className="hero-names">
          <span className="name">Aakanchha</span>
          <span className="ampersand">&</span>
          <span className="name">Christopher</span>
        </div>
        <p className="hero-date">February 13,14 2026 • Goa, India</p>
      </motion.div>

      <div className="hero-images">
        <motion.div 
          className="image-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="image-item image-1">
            <img src="/mbgoose1.jpg" alt="Aakanchha and Christopher 1" />
          </div>
          <div className="image-item image-2">
            <img src="/mbgoose2.jpg" alt="Aakanchha and Christopher 2" />
          </div>
          <div className="image-item image-3">
            <img src="/mbgoose3.jpg" alt="Aakanchha and Christopher 3" />
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span>Scroll to explore</span>
        <div className="arrow-down"></div>
      </motion.div>
    </section>
  );
};

export default Hero;