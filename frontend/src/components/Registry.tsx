import React from 'react';
import { Gift, Heart, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Registry.css';

const Registry: React.FC = () => {
  return (
    <section className="registry" id="registry">
      <div className="container">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Gift Registry
        </motion.h2>

        <motion.div 
          className="registry-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="registry-intro">
            <Gift className="registry-icon-main" />
            <p className="registry-message">
              Your presence at our wedding is the greatest gift of all!
            </p>
            <p>
              If you'd like to help us start our new life together, 
              we've registered at a few of our favorite stores.
            </p>
          </div>

          <div className="registry-grid">
            <motion.div 
              className="registry-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Home className="registry-icon" />
              <h3>Crate & Barrel</h3>
              <p>Home essentials and decor</p>
              <a href="https://www.crateandbarrel.com" className="registry-link" target="_blank" rel="noopener noreferrer">
                View Registry
              </a>
            </motion.div>

            <motion.div 
              className="registry-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Gift className="registry-icon" />
              <h3>Amazon</h3>
              <p>Everything and anything</p>
              <a href="https://www.amazon.com" className="registry-link" target="_blank" rel="noopener noreferrer">
                View Registry
              </a>
            </motion.div>

            <motion.div 
              className="registry-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Heart className="registry-icon" />
              <h3>Honeymoon Fund</h3>
              <p>Help us explore Japan!</p>
              <a href="https://www.honeyfund.com" className="registry-link" target="_blank" rel="noopener noreferrer">
                Contribute
              </a>
            </motion.div>
          </div>

          <div className="registry-note">
            <p>
              <strong>For our friends traveling from afar:</strong><br />
              Please don't feel obligated to bring a physical gift. 
              Your journey to celebrate with us means the world!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Registry;