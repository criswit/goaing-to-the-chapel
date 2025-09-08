import React from 'react';
import '../styles/EventsSidebar.css';

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

interface EventsSidebarProps {
  events: Event[];
  activeEventId: string | null;
  onEventClick: (eventId: string) => void;
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({ events, activeEventId, onEventClick }) => {
  return (
    <nav className="events-sidebar">
      <div className="events-sidebar__header">
        <h3>Event Timeline</h3>
      </div>
      <ul className="events-sidebar__list">
        {events.map((event, index) => (
          <li key={event.id || index} className="events-sidebar__item">
            <button
              className={`events-sidebar__link ${
                activeEventId === event.id ? 'events-sidebar__link--active' : ''
              }`}
              onClick={() => event.id && onEventClick(event.id)}
              aria-current={activeEventId === event.id ? 'true' : 'false'}
            >
              <span className="events-sidebar__link-time">{event.time.split(' - ')[0]}</span>
              <span className="events-sidebar__link-title">{event.title}</span>
              {event.culture && (
                <span
                  className={`events-sidebar__culture-badge events-sidebar__culture-badge--${event.culture.toLowerCase()}`}
                >
                  {event.culture[0]}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default EventsSidebar;
