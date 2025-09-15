import React from 'react';
import '../styles/EventsSidebar.css';

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

interface EventsSidebarProps {
  events: Event[];
  activeEventId: string | null;
  onEventClick: (eventId: string) => void;
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({ events, activeEventId, onEventClick }) => {
  const day1Events = events.filter((e) => e.day === 1);
  const day2Events = events.filter((e) => e.day === 2);

  return (
    <nav className="events-sidebar">
      <div className="events-sidebar__header">
        <h3>Event Timeline</h3>
      </div>
      <ul className="events-sidebar__list">
        {/* Day 1 Section */}
        <li className="events-sidebar__day-header events-sidebar__day-header--1">
          <span className="events-sidebar__day-label">Day 1</span>
          <span className="events-sidebar__day-date">Friday, Feb 14</span>
        </li>
        {day1Events.map((event, index) => (
          <li key={event.id || `day1-${index}`} className="events-sidebar__item">
            <button
              className={`events-sidebar__link events-sidebar__link--day-1 ${
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

        {/* Day 2 Section */}
        <li className="events-sidebar__day-header events-sidebar__day-header--2">
          <span className="events-sidebar__day-label">Day 2</span>
          <span className="events-sidebar__day-date">Saturday, Feb 15</span>
        </li>
        {day2Events.map((event, index) => (
          <li key={event.id || `day2-${index}`} className="events-sidebar__item">
            <button
              className={`events-sidebar__link events-sidebar__link--day-2 ${
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
