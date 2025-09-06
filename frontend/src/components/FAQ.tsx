import React, { useState } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/FAQ.css';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface TOCCategory {
  name: string;
  items: { question: string; index: number }[];
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'When should I arrive in India?',
      answer:
        'We recommend arriving 2-3 days before the first event to recover from jet lag and explore the beautiful beaches.',
      category: 'Travel & Timing',
    },
    {
      question: 'What is the weather like?',
      answer: 'February in Goa is going to be HOT.',
      category: 'Travel & Timing',
    },
    {
      question: 'Do I need any vaccinations?',
      answer:
        'Consult your doctor 4-6 weeks before travel. CDC recommends being up-to-date on routine vaccines and considering Hepatitis A, Typhoid.',
      category: 'Health & Safety',
    },
    {
      question: 'Is the water safe to drink?',
      answer: 'Stick to bottled water only. Avoid ice in drinks outside major hotels.',
      category: 'Health & Safety',
    },
    {
      question: 'What currency is used?',
      answer: 'Indian Rupees (₹). Current exchange rate: $1 = ₹83 approximately.',
      category: 'Money & Currency',
    },
    {
      question: 'Should I exchange money before arriving?',
      answer:
        'You can exchange some at the airport or use ATMs. Credit cards widely accepted at hotels and major shops.',
      category: 'Money & Currency',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const scrollToFAQ = (index: number) => {
    const element = document.getElementById(`faq-item-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Auto-open the FAQ item after scrolling
      setTimeout(() => setOpenIndex(index), 500);
    }
  };

  // Group FAQs by category for TOC
  const tocCategories: TOCCategory[] = faqs.reduce((acc, faq, index) => {
    const existingCategory = acc.find((cat) => cat.name === faq.category);
    if (existingCategory) {
      existingCategory.items.push({ question: faq.question, index });
    } else {
      acc.push({
        name: faq.category,
        items: [{ question: faq.question, index }],
      });
    }
    return acc;
  }, [] as TOCCategory[]);

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
          <p>Still have questions?</p>
          <p>
            Contact us at{' '}
            <a href="mailto:wedding-questions@himnher.dev">wedding-questions@himnher.dev</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
