import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
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
          <div
            className="work-in-progress"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'rgba(212, 165, 116, 0.08)',
              borderRadius: '12px',
              border: '2px dashed var(--secondary-color)',
              margin: '2rem auto',
              maxWidth: '600px',
            }}
          >
            <AlertCircle
              size={48}
              style={{ color: 'var(--secondary-color)', marginBottom: '1rem' }}
            />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
              Work In Progress
            </h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
              We're currently finalizing the dress code details for each event.
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-light)' }}>
              Please check back soon for complete attire guidelines including outfit suggestions,
              color recommendations, and helpful tips for each celebration!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Attire;
