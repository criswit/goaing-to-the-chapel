import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, Palette, ShoppingBag, Camera, Sun } from 'lucide-react';
import '../styles/Attire.css';

interface AttireOption {
  name: string;
  description: string;
  details?: string;
  image?: string;
  beachFriendly?: boolean;
  recommendedFor?: string[];
}

interface ColorSwatch {
  name: string;
  hex: string;
  recommended: boolean;
}

const Attire: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const womenTraditional: AttireOption[] = [
    {
      name: 'Lehengas',
      description: 'Skirt and blouse sets with dupatta (scarf)',
      details:
        'Range from heavily embellished to simple, comfortable styles. Perfect for dancing and celebrating!',
      image: '/attire/women/lehenga.jpg',
      beachFriendly: true,
      recommendedFor: ['Wedding Ceremony', 'Reception'],
    },
    {
      name: 'Sarees',
      description: 'Draped fabric with fitted blouse',
      details: 'Various styling options available. Light and flowy to rich and structured fabrics.',
      image: '/attire/women/saree.jpg',
      beachFriendly: true,
      recommendedFor: ['Wedding Ceremony', 'Reception'],
    },
    {
      name: 'Salwar Kameez & Palazzo Sets',
      description: 'Tunic with loose pants',
      details:
        'Offers ease of movement while maintaining elegance. Wide-leg palazzo pants option available.',
      image: '/attire/women/salwar-kameez.jpg',
      beachFriendly: true,
      recommendedFor: ['Mehendi', 'Haldi'],
    },
    {
      name: 'Kaftans',
      description: 'Flowing, loose-fitting robes',
      details:
        'Plain or embellished with Indian embroidery. Especially comfortable for beach settings!',
      image: '/attire/women/kaftan.jpg',
      beachFriendly: true,
      recommendedFor: ['Mehendi', 'Haldi'],
    },
  ];

  const womenFusion: AttireOption[] = [
    {
      name: 'Indo-Western',
      description: 'Modern fusion styles',
      details:
        'Crop tops with flowing skirts, maxi dresses with Indian embroidery, kaftans with traditional embellishments.',
      image: '/attire/women/indo-western.jpg',
      beachFriendly: true,
      recommendedFor: ['All events'],
    },
    {
      name: 'Western Options',
      description: 'Traditional Western formal wear',
      details:
        'Maxi or midi dresses, dressy blouses with skirts or flowing pants, jumpsuits or cocktail dresses.',
      image: '/attire/women/jumpsuit.jpg',
      beachFriendly: true,
      recommendedFor: ['All events'],
    },
  ];

  const menTraditional: AttireOption[] = [
    {
      name: 'Kurta Sets',
      description: 'Long tunic with matching pants',
      details:
        'Simple cotton to formal embroidered styles. Pajama, churidar, or straight pants options.',
      image: '/attire/men/kurtaSet.jpg',
      beachFriendly: true,
      recommendedFor: ['Mehendi', 'Haldi', 'Wedding Ceremony'],
    },
    {
      name: 'Sherwanis',
      description: 'Formal long coat-like garment',
      details: 'Worn over fitted pants with intricate embroidery and traditional accessories.',
      image: '/attire/men/sherwani.jpg',
      beachFriendly: false,
      recommendedFor: ['Wedding Ceremony'],
    },
    {
      name: 'Dhoti Kurta',
      description: 'Traditional combination',
      details: 'Kurta with draped dhoti. Elegant and culturally significant.',
      image: '/attire/men/dhoti.jpg',
      beachFriendly: true,
      recommendedFor: ['Wedding Ceremony', 'Reception'],
    },
    {
      name: 'Bandhgala',
      description: 'Formal Indian suit jacket',
      details: 'Features high neck (Nehru collar). Sophisticated Indian-Western bridge.',
      image: '/attire/men/bandhgala.jpg',
      beachFriendly: false,
      recommendedFor: ['Wedding Ceremony', 'Reception'],
    },
  ];

  const menFusion: AttireOption[] = [
    {
      name: 'Indo-Western',
      description: 'Modern fusion styles',
      details: 'Nehru jackets with pants, shirts with traditional prints.',
      image: '/attire/men/Nehru_Jacket.jpg',
      beachFriendly: true,
      recommendedFor: ['Reception', 'All events'],
    },
    {
      name: 'Western Options',
      description: 'Traditional Western formal wear',
      details:
        'Light suits or blazers with dress pants, dress shirts with chinos, smart-casual combinations.',
      beachFriendly: true,
      recommendedFor: ['All events'],
    },
  ];

  const colorPalette: ColorSwatch[] = [
    // Recommended colors
    { name: 'Emerald Green', hex: '#50C878', recommended: true },
    { name: 'Royal Blue', hex: '#4169E1', recommended: true },
    { name: 'Deep Purple', hex: '#663399', recommended: true },
    { name: 'Fuchsia', hex: '#FF00FF', recommended: true },
    { name: 'Coral', hex: '#FF7F50', recommended: true },
    { name: 'Sunset Orange', hex: '#FD5E53', recommended: true },
    { name: 'Gold', hex: '#FFD700', recommended: true },
    // Colors to avoid
    { name: 'White', hex: '#FFFFFF', recommended: false },
    { name: 'Red', hex: '#FF0000', recommended: false },
    { name: 'Pale Pink', hex: '#FFE4E1', recommended: false },
  ];

  const renderAttireSection = (title: string, options: AttireOption[], sectionKey: string) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <motion.div
        className="attire-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <button
          className="attire-section-header"
          onClick={() => toggleSection(sectionKey)}
          aria-expanded={isExpanded}
        >
          <h3>{title}</h3>
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {isExpanded && (
          <motion.div
            className="attire-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {options.map((option, index) => (
              <motion.div
                key={option.name}
                className="attire-option"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {option.image && (
                  <div
                    className="attire-option-image"
                    onClick={() => setSelectedImage(option.image || null)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && setSelectedImage(option.image || null)}
                  >
                    <img src={option.image} alt={option.name} />
                    {option.beachFriendly && (
                      <span className="beach-badge">
                        <Sun size={16} /> Beach Friendly
                      </span>
                    )}
                  </div>
                )}
                <div className="attire-option-content">
                  <h4>{option.name}</h4>
                  <p className="attire-description">{option.description}</p>
                  {option.details && <p className="attire-details">{option.details}</p>}
                  {option.recommendedFor && (
                    <div className="recommended-events">
                      <span className="recommended-label">Best for:</span>
                      <span className="event-tags">{option.recommendedFor.join(', ')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <section className="attire" id="attire">
      <div className="container">
        {/* Hero Section */}
        <motion.div
          className="attire-hero"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            What to Wear to Our Wedding
          </motion.h2>

          <motion.div
            className="attire-intro"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="intro-card beach-special">
              <Sun className="intro-icon" size={32} />
              <h3>A Beach Celebration in Goa!</h3>
              <p>
                Our wedding will be an ocean-side celebration with the sand between your toes and
                the sea breeze in your hair. Think light, breezy fabrics and comfortable elegance!
              </p>
            </div>

            <div className="intro-card main-message">
              <Sparkles className="intro-icon" size={32} />
              <h3>Indian Attire Encouraged but Not Required</h3>
              <p>
                We'd love to share the vibrant beauty of Indian wedding fashion with you! Whether
                you choose traditional Indian wear, fusion styles, or Western formal attire, the
                most important thing is that you feel confident and celebration-ready.
              </p>
              <p className="emphasis">
                Wear whatever makes you feel amazing – your presence is what matters most!
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="attire-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Women's Attire */}
          <div className="attire-category">
            <h3 className="category-title">
              <span className="category-icon">👗</span>
              Women's Attire Options
            </h3>
            {renderAttireSection(
              'Traditional Indian Options',
              womenTraditional,
              'women-traditional'
            )}
            {renderAttireSection('Fusion & Western Options', womenFusion, 'women-fusion')}
          </div>

          {/* Men's Attire */}
          <div className="attire-category">
            <h3 className="category-title">
              <span className="category-icon">👔</span>
              Men's Attire Options
            </h3>
            {renderAttireSection('Traditional Indian Options', menTraditional, 'men-traditional')}
            {renderAttireSection('Fusion & Western Options', menFusion, 'men-fusion')}
          </div>

          {/* Color Palette */}
          <motion.div
            className="color-guidance"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="category-title">
              <Palette className="category-icon inline-icon" size={24} />
              Color Palette Guidance
            </h3>

            <div className="color-sections">
              <div className="color-section recommended">
                <h4>✨ Embrace These Vibrant Colors</h4>
                <p>Indian weddings celebrate with rich, bold colors!</p>
                <div className="color-swatches">
                  {colorPalette
                    .filter((c) => c.recommended)
                    .map((color) => (
                      <div key={color.name} className="color-swatch">
                        <div
                          className="swatch"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                        <span>{color.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="color-section avoid">
                <h4>🚫 Colors to Avoid</h4>
                <p>These colors have special significance in Indian weddings</p>
                <div className="color-swatches">
                  {colorPalette
                    .filter((c) => !c.recommended)
                    .map((color) => (
                      <div key={color.name} className="color-swatch avoided">
                        <div
                          className="swatch"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                        <span>{color.name}</span>
                      </div>
                    ))}
                </div>
                <div className="color-notes">
                  <p>
                    • <strong>White:</strong> Traditionally reserved for the bride
                  </p>
                  <p>
                    • <strong>Red:</strong> Traditionally reserved for the bride
                  </p>
                  <p>
                    • <strong>Very pale colors:</strong> May wash out in photos
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Shopping Resources */}
          <motion.div
            className="shopping-resources"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="category-title">
              <ShoppingBag className="category-icon inline-icon" size={24} />
              Shopping & Inspiration Resources
            </h3>

            <div className="resources-grid">
              <div className="resource-card">
                <h4>🛍️ Where to Shop</h4>
                <ul>
                  <li>Local Indian clothing stores in your area</li>
                  <li>Online retailers (Utsav Fashion, Kalki Fashion, Pernia's Pop-Up Shop)</li>
                  <li>Department stores with Indian fusion sections</li>
                  <li>Amazon has affordable options for first-timers!</li>
                </ul>
              </div>

              <div className="resource-card">
                <h4>
                  <Camera className="inline-icon" size={18} />
                  Visual Inspiration
                </h4>
                <p>
                  <strong>Pinterest searches:</strong>
                </p>
                <ul>
                  <li>"Indian wedding guest attire"</li>
                  <li>"Beach wedding Indian outfit"</li>
                  <li>"Wedding kurta men"</li>
                  <li>"Lehenga styling ideas"</li>
                </ul>
                <p>
                  <strong>Instagram hashtags:</strong>
                </p>
                <ul>
                  <li>#indianwedding</li>
                  <li>#weddingguest</li>
                  <li>#indianoutfit</li>
                  <li>#beachweddingattire</li>
                </ul>
              </div>

              <div className="resource-card">
                <h4>💡 Pro Tips</h4>
                <ul>
                  <li>Order 2-3 weeks in advance for online purchases</li>
                  <li>Many Indian outfits run small - size up if unsure</li>
                  <li>Rental services are available for elaborate outfits</li>
                  <li>Comfortable footwear is key for beach dancing!</li>
                  <li>Light fabrics work best in Goa's tropical climate</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Closing Message */}
          <motion.div
            className="closing-message"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="message-icon" size={40} />
            <h3>Ready to Celebrate with Us!</h3>
            <p>
              Whether you choose to embrace Indian fashion or stick with what you know and love, we
              just want you to feel amazing and ready to dance the night away on the beach!
            </p>
            <p className="contact-note">
              Questions about attire? Don't hesitate to reach out – we're here to help! Contact us
              at <a href="mailto:espoused@wedding.himnher.dev">espoused@wedding.himnher.dev</a>
            </p>
            <p className="excitement">We can't wait to celebrate with you in Goa! 🌊✨</p>
          </motion.div>
        </motion.div>

        {/* Image Lightbox */}
        {selectedImage && (
          <div
            className="image-lightbox"
            onClick={() => setSelectedImage(null)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Escape' && setSelectedImage(null)}
          >
            <div className="lightbox-content">
              <img src={selectedImage} alt="Attire option" />
              <button
                className="close-lightbox"
                onClick={() => setSelectedImage(null)}
                aria-label="Close image"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Attire;
