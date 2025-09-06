import React from 'react';
import { motion } from 'framer-motion';
import '../styles/HeartfeltNote.css';

const HeartfeltNote: React.FC = () => {
  return (
    <section className="heartfelt-note" id="welcome">
      <motion.div 
        className="heartfelt-container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="heartfelt-header"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="heartfelt-title">Welcome to Our Celebration</h2>
          <div className="heartfelt-ornament">♥</div>
        </motion.div>

        <motion.div 
          className="heartfelt-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <p className="heartfelt-message">
            Dearest Family and Friends,
          </p>
          
          <p className="heartfelt-message">
            With hearts full of joy and anticipation, we invite you to join us in Goa 
            as we celebrate the beginning of our forever journey together. Your presence 
            in our lives has shaped who we are today, and we cannot imagine marking this 
            momentous occasion without you by our side.
          </p>

          <p className="heartfelt-message">
            Our love story began in the most unexpected way, growing from friendship into 
            something beautiful and profound. Now, as we prepare to say "I do" on the 
            sun-kissed beaches of Goa, we want nothing more than to share this magical 
            moment with the people who mean the world to us.
          </p>

          <p className="heartfelt-message">
            This celebration is more than just our union – it's a gathering of the hearts 
            that have supported, loved, and encouraged us along the way. We've planned 
            every detail with you in mind, hoping to create memories that will last a 
            lifetime.
          </p>

          <p className="heartfelt-message">
            Thank you for taking this journey with us to Goa. Your love and support mean 
            everything, and we can't wait to dance, laugh, and celebrate with you under 
            the stars.
          </p>

          <motion.div 
            className="heartfelt-signature"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="signature-text">With all our love,</p>
            <div className="couple-names">
              <span className="bride-name">Aakanchha</span>
              <span className="ampersand-fancy">&</span>
              <span className="groom-name">Christopher</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeartfeltNote;