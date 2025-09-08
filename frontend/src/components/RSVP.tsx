import React from 'react';
import { motion } from 'framer-motion';
import '../styles/RSVP.css';

const RSVP: React.FC = () => {
  return (
    <section className="rsvp" id="rsvp">
      <div className="container">
        <motion.div
          className="under-construction"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ fontSize: '3rem', marginBottom: '1rem' }}
          >
            UNDER CONSTRUCTION
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ fontSize: '1.5rem', marginBottom: '2rem' }}
          >
            🚧
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px' }}
          >
            Our RSVP system is currently being set up. Please check back soon!
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ fontSize: '1rem', color: '#888', marginTop: '1rem' }}
          >
            In the meantime, feel free to contact us directly with any questions.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default RSVP;
