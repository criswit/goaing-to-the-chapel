import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Hero.css';

const Hero: React.FC = () => {
  return (
    <section className="hero" id="hero">
      <div className="hero-container">
        <div className="hero-left">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
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
        </div>

        <div className="hero-right">
          <motion.div
            className="heartfelt-content"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="heartfelt-title">Welcome to Our Celebration</h2>
            <div className="heartfelt-ornament">♥</div>

            <p className="heartfelt-message">Dearest Family and Friends,</p>

            <p className="heartfelt-message">
              With hearts full of joy and anticipation, we invite you to join us in Goa as we
              celebrate the beginning of our forever journey together. Your presence in our lives
              has shaped who we are today, and we cannot imagine marking this momentous occasion
              without you by our side.
            </p>

            <p className="heartfelt-message">
              Our love story began in the most unexpected way, growing from friendship into
              something beautiful and profound. Now, as we prepare to say "I do" on the sun-kissed
              beaches of Goa, we want nothing more than to share this magical moment with the people
              who mean the world to us.
            </p>

            <p className="heartfelt-message">
              This celebration is more than just our union – it's a gathering of the hearts that
              have supported, loved, and encouraged us along the way. We've planned every detail
              with you in mind, hoping to create memories that will last a lifetime.
            </p>

            <p className="heartfelt-message">
              Thank you for taking this journey with us to Goa. Your love and support mean
              everything, and we can't wait to dance, laugh, and celebrate with you under the stars.
            </p>

            <div className="heartfelt-signature">
              <p className="signature-text">With all our love,</p>
              <div className="couple-names">
                <span className="bride-name">Aakanchha</span>
                <span className="ampersand-fancy">&</span>
                <span className="groom-name">Christopher</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
