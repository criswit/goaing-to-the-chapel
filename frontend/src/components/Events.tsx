import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Events.css';

interface Event {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attire: string;
}

const Events: React.FC = () => {
  const events: Event[] = [
    {
      title: "Welcome Dinner",
      date: "Friday, June 14, 2024",
      time: "7:00 PM - 10:00 PM",
      location: "Beach Shack Restaurant",
      description: "Join us for a casual dinner by the beach to kick off the wedding festivities",
      attire: "Beach casual"
    },
    {
      title: "Haldi & Mehndi Ceremony",
      date: "Saturday, June 15, 2024",
      time: "10:00 AM - 1:00 PM",
      location: "The Leela Garden",
      description: "Traditional pre-wedding ceremonies with music, dance, and colors",
      attire: "Colorful Indian attire (yellows encouraged)"
    },
    {
      title: "Wedding Ceremony",
      date: "Saturday, June 15, 2024",
      time: "4:30 PM - 6:00 PM",
      location: "Beachfront Mandap",
      description: "The moment we say 'I do' with our feet in the sand",
      attire: "Indian formal or cocktail attire"
    },
    {
      title: "Reception & Party",
      date: "Saturday, June 15, 2024",
      time: "7:00 PM - 2:00 AM",
      location: "The Grand Ballroom",
      description: "Dinner, dancing, and celebration under the stars",
      attire: "Cocktail/formal attire"
    }
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
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="event-header">
                <h3>{event.title}</h3>
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