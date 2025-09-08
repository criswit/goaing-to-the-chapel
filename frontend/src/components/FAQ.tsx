import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/FAQ.css';
import faqData from '../data/faqData.json';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

// interface TOCCategory {
//   name: string;
//   items: { question: string; index: number }[];
// }

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = faqData.faqs;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Group FAQs by category for TOC (kept for potential future use)

  return (
    <section className="faq" id="faq">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              id={`faq-item-${index}`}
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {openIndex === index && (
                <motion.div
                  className="faq-answer"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="faq-contact">
          <p>{faqData.contactInfo.preText}</p>
          <p>
            {faqData.contactInfo.contactText}{' '}
            <a href={`mailto:${faqData.contactInfo.email}`}>{faqData.contactInfo.email}</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
