import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
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
                <h3>{event.title}</h3>
                {event.culture && (
                  <span 
                    className={`event-culture event-culture--${event.culture.toLowerCase()}`}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: event.culture === 'Indian' ? '#FF6B3520' : 
                                 event.culture === 'American' ? '#4A90E220' : '#8B5CF620',
                      color: event.culture === 'Indian' ? '#FF6B35' : 
                             event.culture === 'American' ? '#4A90E2' : '#8B5CF6',
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
    </section>
  );
};

export default Events;
