import React from 'react';
import { motion } from 'framer-motion';
import { RSVPFormContainer } from './RSVPForm/RSVPFormContainer';
import '../styles/RSVP.css';

const RSVP: React.FC = () => {
  return (
    <section className="rsvp" id="rsvp">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="section-title">RSVP</h1>
          <p className="section-subtitle">
            We can't wait to celebrate with you! Please let us know if you'll be able to join us.
          </p>
          <RSVPFormContainer />
        </motion.div>
      </div>
    </section>
  );
};

export default RSVP;
