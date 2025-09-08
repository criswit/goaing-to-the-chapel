import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, List } from 'lucide-react';
import { motion } from 'framer-motion';
import EventsSidebar from './EventsSidebar';
import '../styles/Events.css';

interface Event {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attire: string;
  culture?: 'Indian' | 'American' | 'Fusion';
}

const Events: React.FC = () => {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const tooltips: { [key: string]: { title: string; description: string } } = {
    haldi: {
      title: 'Haldi Ceremony (हल्दी)',
      description:
        "The Haldi ceremony is a sacred pre-wedding ritual where turmeric paste is applied to the bride and groom's face, neck, hands, and feet. This golden spice is believed to bless the couple, ward off evil spirits, and give them a natural glow for their wedding day. It's a joyful celebration filled with music, laughter, and playful turmeric application by family and friends. Wear yellow or bright colors - and clothes you don't mind getting a bit messy!",
    },
    sangeet: {
      title: 'Sangeet Night (संगीत)',
      description:
        "The Sangeet is a vibrant musical celebration where both families come together for an evening of song, dance, and performances. Traditionally, family members prepare choreographed dances, sing folk songs, and celebrate the upcoming union. It's a time for both families to bond, share stories about the couple, and showcase their dancing skills. Expect Bollywood music, traditional folk dances, and maybe even a friendly dance-off between the two families!",
    },
    jaimala: {
      title: 'Jaimala (जयमाला)',
      description:
        "The Jaimala or Varmala is the exchange of flower garlands between the bride and groom, symbolizing their acceptance of one another. This playful ceremony often involves the bride and groom's friends lifting them up to make it challenging for the other to place the garland, adding fun and laughter to the moment. The garland exchange represents the couple choosing each other as life partners and their mutual respect and love.",
    },
    baraat: {
      title: 'Baraat Procession (बारात)',
      description:
        "The Baraat is the groom's grand entrance procession, traditionally arriving on a decorated horse (or in modern times, a luxury car). Accompanied by family, friends, music, and dancing, the groom makes his way to the wedding venue. The dhol (drums) play energetic beats while everyone dances in celebration. The bride's family welcomes the Baraat at the entrance with aarti and tilak, marking the formal acceptance of the groom.",
    },
    mandap: {
      title: 'Mandap Ceremony (मंडप)',
      description:
        'The Mandap is the sacred wedding pavilion where the actual marriage ceremony takes place. Under a beautifully decorated canopy, the couple performs the Saat Phere (seven vows) around a holy fire, with each circle representing a promise they make to each other. The ceremony includes various rituals like Kanyadaan (giving away of the bride), Mangalsutra (sacred necklace), and Sindoor (vermillion) application. This is the most sacred part of the Hindu wedding where the couple officially becomes husband and wife.',
    },
  };

  const events: Event[] = [
    {
      id: 'guest-arrival',
      title: 'Guest Arrival & Welcome',
      date: 'Friday, February 14, 2026',
      time: '3:00 PM - 3:30 PM',
      location: 'Main Entrance',
      description: 'Welcome drinks and greetings as guests arrive',
      attire: 'Smart casual',
      culture: 'American',
    },
    {
      id: 'haldi',
      title: 'Haldi Ceremony',
      date: 'Friday, February 14, 2026',
      time: '3:30 PM - 4:30 PM',
      location: 'The Leela Garden',
      description: 'Traditional turmeric ceremony with music and celebration',
      attire: 'Colorful Indian attire (yellows encouraged)',
      culture: 'Indian',
    },
    {
      id: 'cocktails',
      title: 'Cocktail Hour',
      date: 'Friday, February 14, 2026',
      time: '5:00 PM - 6:00 PM',
      location: 'Poolside Terrace',
      description: 'Drinks and appetizers with a mix of Indian and American flavors',
      attire: 'Cocktail attire',
      culture: 'Fusion',
    },
    {
      id: 'sangeet',
      title: 'Sangeet Night',
      date: 'Friday, February 14, 2026',
      time: '7:00 PM - 11:00 PM',
      location: 'The Grand Ballroom',
      description: 'Evening of music, dance performances, and celebration',
      attire: 'Indian festive wear',
      culture: 'Indian',
    },
    {
      id: 'baraat',
      title: 'Baraat Procession',
      date: 'Saturday, February 15, 2026',
      time: '3:00 PM - 3:30 PM',
      location: 'Main Entrance to Mandap',
      description: "Groom's festive procession with music and dancing",
      attire: 'Indian formal wear',
      culture: 'Indian',
    },
    {
      id: 'jaimala',
      title: 'Jaimala (Garland Exchange)',
      date: 'Saturday, February 15, 2026',
      time: '3:30 PM - 3:45 PM',
      location: 'Wedding Mandap',
      description: 'Traditional exchange of flower garlands',
      attire: 'Indian formal wear',
      culture: 'Indian',
    },
    {
      id: 'ceremony-intermission',
      title: 'Intermission & Refreshments',
      date: 'Saturday, February 15, 2026',
      time: '3:45 PM - 4:15 PM',
      location: 'Garden Area',
      description: 'Break for refreshments and mingling',
      attire: 'As you were',
      culture: 'Fusion',
    },
    {
      id: 'mandap',
      title: 'Mandap Ceremony',
      date: 'Saturday, February 15, 2026',
      time: '4:15 PM - 5:45 PM',
      location: 'Beachfront Mandap',
      description: 'Sacred wedding ceremony under the mandap',
      attire: 'Indian formal or cocktail attire',
      culture: 'Indian',
    },
    {
      id: 'cocktail-hour-2',
      title: 'Cocktail Hour',
      date: 'Saturday, February 15, 2026',
      time: '6:00 PM - 7:00 PM',
      location: 'Ocean View Terrace',
      description: 'Transition to reception with drinks and appetizers',
      attire: 'Cocktail/formal attire',
      culture: 'American',
    },
    {
      id: 'reception',
      title: 'Reception & Dinner',
      date: 'Saturday, February 15, 2026',
      time: '7:00 PM - 11:00 PM',
      location: 'The Grand Ballroom',
      description: 'Dinner, speeches, and dancing under the stars',
      attire: 'Cocktail/formal attire',
      culture: 'Fusion',
    },
    {
      id: 'after-party',
      title: 'After Party',
      date: 'Saturday, February 15, 2026',
      time: '11:00 PM - 2:00 AM',
      location: 'Beach Club',
      description: 'Late night celebration and dancing',
      attire: 'Party attire',
      culture: 'American',
    },
  ];

  // Handle smooth scrolling to event
  const handleEventClick = (eventId: string) => {
    const element = document.querySelector(`[data-event-id="${eventId}"]`);
    if (element) {
      const yOffset = -100; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setIsMobileMenuOpen(false); // Close mobile menu after selection
    }
  };

  // Setup Intersection Observer for active state detection
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when event is in upper portion of viewport
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const eventId = entry.target.getAttribute('data-event-id');
          if (eventId) {
            setActiveEventId(eventId);
          }
        }
      });
    }, options);

    // Observe all event cards
    const eventCards = document.querySelectorAll('[data-event-id]');
    eventCards.forEach((card) => {
      observerRef.current?.observe(card);
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <section className="events" id="events">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Wedding Events
        </motion.h2>

        <div className="events-layout">
          {/* Desktop Sidebar */}
          <div className="events-sidebar-container">
            <EventsSidebar
              events={events}
              activeEventId={activeEventId}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="events-sidebar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle event navigation"
          >
            <List size={24} />
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="events-sidebar-mobile-dropdown open">
              <EventsSidebar
                events={events}
                activeEventId={activeEventId}
                onEventClick={handleEventClick}
              />
            </div>
          )}

          {/* Main Timeline Content */}
          <div className="events-timeline">
            {events.map((event, index) => (
              <motion.div
                key={index}
                className="event-card"
                data-event-id={event.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="event-header">
                  <h3
                    style={
                      tooltips[event.id || '']
                        ? {
                            cursor: 'help',
                            position: 'relative',
                            display: 'inline-block',
                          }
                        : {}
                    }
                    onMouseEnter={() =>
                      tooltips[event.id || ''] && setActiveTooltip(event.id || null)
                    }
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    {event.title}
                    {tooltips[event.id || ''] && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--secondary-color)',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          lineHeight: '16px',
                          cursor: 'help',
                          verticalAlign: 'middle',
                        }}
                      >
                        ?
                      </span>
                    )}
                    {activeTooltip === event.id && tooltips[event.id || ''] && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '10px',
                          padding: '12px 16px',
                          backgroundColor: 'rgba(42, 54, 69, 0.95)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          width: '320px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          animation: 'fadeIn 0.3s ease-in-out',
                        }}
                      >
                        <strong style={{ display: 'block', marginBottom: '8px', color: '#FFD700' }}>
                          {tooltips[event.id].title}
                        </strong>
                        {tooltips[event.id].description}
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid rgba(42, 54, 69, 0.95)',
                          }}
                        ></div>
                      </div>
                    )}
                  </h3>
                  {event.culture && (
                    <span
                      className={`event-culture event-culture--${event.culture.toLowerCase()}`}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          event.culture === 'Indian'
                            ? '#FF6B3520'
                            : event.culture === 'American'
                              ? '#4A90E220'
                              : '#8B5CF620',
                        color:
                          event.culture === 'Indian'
                            ? '#FF6B35'
                            : event.culture === 'American'
                              ? '#4A90E2'
                              : '#8B5CF6',
                      }}
                    >
                      {event.culture}
                    </span>
                  )}
                </div>
                <div className="event-details">
                  <div className="event-info">
                    <Calendar size={16} />
                    <span>{event.date}</span>
                  </div>
                  <div className="event-info">
                    <Clock size={16} />
                    <span>{event.time}</span>
                  </div>
                  <div className="event-info">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                </div>
                <p className="event-description">{event.description}</p>
                <div className="event-attire">
                  <strong>Attire:</strong> {event.attire}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
