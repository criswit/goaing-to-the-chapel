import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, List } from 'lucide-react';
import { motion } from 'framer-motion';
import EventsSidebar from './EventsSidebar';
import '../styles/Events.css';

interface Event {
  id?: string;
  title: string;
  culturalName?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attire: string;
  culture?: 'Indian' | 'American' | 'Fusion';
  participationLevel?: 'observe' | 'participate' | 'optional';
  significance?: 'high' | 'medium' | 'low';
  day?: 1 | 2;
}

const Events: React.FC = () => {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const tooltips: {
    [key: string]: {
      title: string;
      description: string;
      pronunciation?: string;
      participation?: string;
    };
  } = {
    haldi: {
      title: 'Haldi Ceremony (हल्दी)',
      pronunciation: 'HUHL-dee',
      description:
        "The Haldi ceremony is a sacred pre-wedding ritual where turmeric paste is applied to the bride and groom's face, neck, hands, and feet. This golden spice is believed to bless the couple, ward off evil spirits, and give them a natural glow for their wedding day. It's a joyful celebration filled with music, laughter, and playful turmeric application by family and friends.",
      participation:
        "Guests are welcome to apply turmeric to the couple. Wear clothes you don't mind getting a bit messy!",
    },
    'mehendi-sangeet': {
      title: 'Mehendi & Sangeet Night (मेहंदी और संगीत)',
      pronunciation: 'meh-HEN-dee & sun-GEET',
      description:
        "A combined celebration of two beautiful traditions. The Mehendi involves intricate henna designs applied to the bride's hands and feet, while the Sangeet is a vibrant musical celebration with dance performances by family and friends. Both families come together for an evening of art, music, dance, and celebration of the upcoming union.",
      participation:
        'Ladies are welcome to get henna designs. Everyone is encouraged to join the dance floor and enjoy the performances!',
    },
    baraat: {
      title: 'Baraat Procession (बारात)',
      pronunciation: 'buh-RAHT',
      description:
        "The Baraat is the groom's grand entrance procession, traditionally arriving on a decorated horse. Accompanied by family, friends, music, and dancing, the groom makes his way to the wedding venue. The dhol (drums) play energetic beats while everyone dances in celebration.",
      participation:
        "All guests are invited to join the procession and dance! The bride's family will welcome the Baraat at the entrance.",
    },
    mandap: {
      title: 'Wedding Ceremony (मंडप)',
      pronunciation: 'mun-DUP',
      description:
        'The Mandap is the sacred wedding pavilion where the actual marriage ceremony takes place. Under a beautifully decorated canopy, the couple performs the Saat Phere (seven vows) around a holy fire, with each circle representing a promise they make to each other. This is the most sacred part of the Hindu wedding where the couple officially becomes husband and wife.',
      participation:
        'Guests observe respectfully during the ceremony. Photography is welcome during designated moments.',
    },
    reception: {
      title: 'Reception Dinner',
      description:
        'A formal celebration bringing together both Indian and Western wedding traditions. Enjoy a fusion menu, heartfelt speeches, and dancing under the stars as we celebrate the newlyweds.',
      participation:
        'Join us for dinner, toasts, and dancing! This is a time for all guests to celebrate together.',
    },
  };

  const events: Event[] = [
    // Day 1 Events
    {
      id: 'haldi',
      title: 'Haldi Ceremony',
      culturalName: 'हल्दी',
      date: 'Friday, February 13, 2026',
      time: '3:30 PM - 4:30 PM',
      location: 'TBD',
      description:
        'A joyful pre-wedding ritual where turmeric paste is applied to bless the couple with good fortune and a radiant glow.',
      attire: 'Colorful Indian attire',
      culture: 'Indian',
      participationLevel: 'participate',
      significance: 'high',
      day: 1,
    },
    {
      id: 'mehendi-sangeet',
      title: 'Mehendi & Sangeet Night',
      culturalName: 'मेहंदी और संगीत',
      date: 'Friday, February 13, 2026',
      time: '7:00 PM - 11:00 PM',
      location: 'TBD',
      description:
        'An evening of intricate henna artistry combined with vibrant music, dance performances, and celebration by both families.',
      attire: 'Indian festive wear (bright colors encouraged)',
      culture: 'Indian',
      participationLevel: 'participate',
      significance: 'high',
      day: 1,
    },
    // Day 2 Events
    {
      id: 'baraat',
      title: 'Baraat Procession',
      culturalName: 'बारात',
      date: 'Saturday, February 14, 2026',
      time: '3:00 PM - 3:30 PM',
      location: 'TBD',
      description:
        "The groom's grand entrance with family and friends, accompanied by energetic music and dancing.",
      attire: 'Indian formal wear',
      culture: 'Indian',
      participationLevel: 'participate',
      significance: 'high',
      day: 2,
    },
    {
      id: 'mandap',
      title: 'Wedding Ceremony',
      culturalName: 'मंडप विवाह',
      date: 'Saturday, February 14, 2026',
      time: '4:00 PM - 6:30 PM',
      location: 'TBD',
      description:
        'The sacred Hindu wedding ceremony where vows are exchanged around a holy fire under a decorated pavilion.',
      attire: 'Indian formal or elegant cocktail attire',
      culture: 'Fusion',
      participationLevel: 'observe',
      significance: 'high',
      day: 2,
    },
    {
      id: 'reception',
      title: 'Reception Dinner',
      culturalName: '',
      date: 'Saturday, February 14, 2026',
      time: '7:00 PM - 11:00 PM',
      location: 'TBD',
      description:
        'An elegant evening of dining, heartfelt toasts, and dancing to celebrate the newlyweds.',
      attire: 'Cocktail or formal attire',
      culture: 'Fusion',
      participationLevel: 'participate',
      significance: 'high',
      day: 2,
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
          Events
        </motion.h2>

        <div className="events-layout">
          {/* Main Timeline Content */}
          <div className="events-timeline">
            {/* Day 1 Group with Bracket */}
            <div className="day-group day-group--1">
              <div className="day-bracket">
                <div className="day-bracket-label">
                  <span className="day-number">Day 1</span>
                  <span className="day-date">Friday, February 14</span>
                  <span className="day-theme">Celebration Begins</span>
                </div>
              </div>
              <div className="day-events">
                {events
                  .filter((e) => e.day === 1)
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="event-card event-card--day-1"
                      data-event-id={event.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                    >
                      <div className="event-header">
                        <h3>
                          {event.title}
                          {event.culturalName && (
                            <span className="cultural-name">{event.culturalName}</span>
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
                      {tooltips[event.id || ''] && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help',
                            zIndex: 5,
                          }}
                          onMouseEnter={() => setActiveTooltip(event.id || null)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          ?
                          {activeTooltip === event.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '100%',
                                transform: 'translateY(-50%)',
                                marginLeft: '10px',
                                padding: '12px 16px',
                                backgroundColor: 'rgba(42, 54, 69, 0.95)',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                width: '360px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                                animation: 'fadeInRight 0.3s ease-in-out',
                              }}
                            >
                              <strong
                                style={{ display: 'block', marginBottom: '8px', color: '#FFD700' }}
                              >
                                {tooltips[event.id].title}
                                {tooltips[event.id].pronunciation && (
                                  <span
                                    style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.8 }}
                                  >
                                    ({tooltips[event.id].pronunciation})
                                  </span>
                                )}
                              </strong>
                              {tooltips[event.id].description}
                              {tooltips[event.id].participation && (
                                <div
                                  style={{
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                                  }}
                                >
                                  <strong style={{ fontSize: '12px', color: '#FFD700' }}>
                                    Guest Participation:
                                  </strong>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    {tooltips[event.id].participation}
                                  </div>
                                </div>
                              )}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '-8px',
                                  transform: 'translateY(-50%)',
                                  width: '0',
                                  height: '0',
                                  borderTop: '8px solid transparent',
                                  borderBottom: '8px solid transparent',
                                  borderRight: '8px solid rgba(42, 54, 69, 0.95)',
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
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

            {/* Day 2 Group with Bracket */}
            <div className="day-group day-group--2">
              <div className="day-bracket">
                <div className="day-bracket-label">
                  <span className="day-number">Day 2</span>
                  <span className="day-date">Saturday, February 15</span>
                  <span className="day-theme">Sacred Ceremonies</span>
                </div>
              </div>
              <div className="day-events">
                {events
                  .filter((e) => e.day === 2)
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="event-card event-card--day-2"
                      data-event-id={event.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                    >
                      <div className="event-header">
                        <h3>
                          {event.title}
                          {event.culturalName && (
                            <span className="cultural-name">{event.culturalName}</span>
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
                      {tooltips[event.id || ''] && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help',
                            zIndex: 5,
                          }}
                          onMouseEnter={() => setActiveTooltip(event.id || null)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          ?
                          {activeTooltip === event.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '100%',
                                transform: 'translateY(-50%)',
                                marginLeft: '10px',
                                padding: '12px 16px',
                                backgroundColor: 'rgba(42, 54, 69, 0.95)',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                width: '360px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                                animation: 'fadeInRight 0.3s ease-in-out',
                              }}
                            >
                              <strong
                                style={{ display: 'block', marginBottom: '8px', color: '#FFD700' }}
                              >
                                {tooltips[event.id].title}
                                {tooltips[event.id].pronunciation && (
                                  <span
                                    style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.8 }}
                                  >
                                    ({tooltips[event.id].pronunciation})
                                  </span>
                                )}
                              </strong>
                              {tooltips[event.id].description}
                              {tooltips[event.id].participation && (
                                <div
                                  style={{
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                                  }}
                                >
                                  <strong style={{ fontSize: '12px', color: '#FFD700' }}>
                                    Guest Participation:
                                  </strong>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    {tooltips[event.id].participation}
                                  </div>
                                </div>
                              )}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '-8px',
                                  transform: 'translateY(-50%)',
                                  width: '0',
                                  height: '0',
                                  borderTop: '8px solid transparent',
                                  borderBottom: '8px solid transparent',
                                  borderRight: '8px solid rgba(42, 54, 69, 0.95)',
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
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
        </div>
      </div>
    </section>
  );
};

export default Events;
