import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/RSVP.css';

interface FormData {
  name: string;
  email: string;
  attending: string;
  guests: string;
  dietary: string;
  message: string;
}

const RSVP: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    attending: '',
    guests: '1',
    dietary: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send the form data to a server
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="rsvp" id="rsvp">
        <div className="container">
          <motion.div
            className="rsvp-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Thank You!</h2>
            <p>We've received your RSVP.</p>
            <p>We can't wait to celebrate with you!</p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="rsvp" id="rsvp">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          RSVP
        </motion.h2>

        <motion.div
          className="rsvp-intro"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p>Please let us know if you can join us by May 1, 2024</p>
        </motion.div>

        <motion.form
          className="rsvp-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="attending">Will you be attending? *</label>
            <select
              id="attending"
              name="attending"
              value={formData.attending}
              onChange={handleChange}
              required
            >
              <option value="">Please select</option>
              <option value="yes">Joyfully accept</option>
              <option value="no">Regretfully decline</option>
            </select>
          </div>

          {formData.attending === 'yes' && (
            <>
              <div className="form-group">
                <label htmlFor="guests">Number of Guests *</label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dietary">Dietary Restrictions</label>
                <input
                  type="text"
                  id="dietary"
                  name="dietary"
                  value={formData.dietary}
                  onChange={handleChange}
                  placeholder="Vegetarian, vegan, gluten-free, allergies, etc."
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="message">Message for the Couple (Optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder="Share your wishes or song requests!"
            />
          </div>

          <button type="submit" className="submit-btn">
            Send RSVP
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default RSVP;
