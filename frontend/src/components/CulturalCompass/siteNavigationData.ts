import { CulturalEvent } from './types';

export const siteNavigationData: CulturalEvent[] = [
  // Main Site Sections
  {
    id: 'hero',
    title: 'Welcome',
    time: '',
    culture: 'Fusion',
    duration: '',
    description: "Goa'ing to the Chapel - Our wedding celebration begins here",
    date: ''
  },
  {
    id: 'heartfelt-note',
    title: 'Our Love Story',
    time: '',
    culture: 'Fusion',
    duration: '',
    description: 'A heartfelt message to our family and friends',
    date: ''
  },
  {
    id: 'travel',
    title: 'Travel & Stay',
    time: '',
    culture: 'American',
    duration: '',
    description: 'Everything you need to know about getting to Goa',
    date: ''
  },
  
  // Wedding Events
  {
    id: 'events',
    title: 'Wedding Events',
    time: '',
    culture: 'Fusion',
    duration: '',
    description: 'Complete timeline of our 2-day celebration',
    date: ''
  },
  {
    id: 'guest-arrival',
    title: 'Guest Arrival',
    time: 'Fri 3:00pm',
    culture: 'American',
    duration: '30 min',
    description: 'Welcome drinks and greetings',
    date: 'Friday, June 14'
  },
  {
    id: 'haldi',
    title: 'Haldi Ceremony',
    time: 'Fri 3:30pm',
    culture: 'Indian',
    duration: '1 hour',
    description: 'Traditional turmeric ceremony',
    date: 'Friday, June 14'
  },
  {
    id: 'cocktails',
    title: 'Cocktail Hour',
    time: 'Fri 5:00pm',
    culture: 'Fusion',
    duration: '1 hour',
    description: 'Drinks and appetizers',
    date: 'Friday, June 14'
  },
  {
    id: 'sangeet',
    title: 'Sangeet Night',
    time: 'Fri 7:00pm',
    culture: 'Indian',
    duration: '4 hours',
    description: 'Music, dance, and celebration',
    date: 'Friday, June 14'
  },
  {
    id: 'baraat',
    title: 'Baraat',
    time: 'Sat 3:00pm',
    culture: 'Indian',
    duration: '30 min',
    description: "Groom's festive procession",
    date: 'Saturday, June 15'
  },
  {
    id: 'jaimala',
    title: 'Jaimala',
    time: 'Sat 3:30pm',
    culture: 'Indian',
    duration: '15 min',
    description: 'Exchange of garlands',
    date: 'Saturday, June 15'
  },
  {
    id: 'ceremony-intermission',
    title: 'Intermission',
    time: 'Sat 3:45pm',
    culture: 'Fusion',
    duration: '30 min',
    description: 'Refreshments break',
    date: 'Saturday, June 15'
  },
  {
    id: 'mandap',
    title: 'Mandap Ceremony',
    time: 'Sat 4:15pm',
    culture: 'Indian',
    duration: '1.5 hours',
    description: 'Sacred wedding ceremony',
    date: 'Saturday, June 15'
  },
  {
    id: 'cocktail-hour-2',
    title: 'Reception Cocktails',
    time: 'Sat 6:00pm',
    culture: 'American',
    duration: '1 hour',
    description: 'Transition to reception',
    date: 'Saturday, June 15'
  },
  {
    id: 'reception',
    title: 'Reception',
    time: 'Sat 7:00pm',
    culture: 'Fusion',
    duration: '4 hours',
    description: 'Dinner and dancing',
    date: 'Saturday, June 15'
  },
  {
    id: 'after-party',
    title: 'After Party',
    time: 'Sat 11:00pm',
    culture: 'American',
    duration: '3 hours',
    description: 'Late night celebration',
    date: 'Saturday, June 15'
  },
  
  // Other Site Sections
  {
    id: 'definitions',
    title: 'Wedding Traditions',
    time: '',
    culture: 'Fusion',
    duration: '',
    description: 'Understanding Indian and Western wedding customs',
    date: ''
  },
  {
    id: 'attire',
    title: 'Dress Code',
    time: '',
    culture: 'Fusion',
    duration: '',
    description: 'What to wear for each event',
    date: ''
  },
  {
    id: 'registry',
    title: 'Gift Registry',
    time: '',
    culture: 'American',
    duration: '',
    description: 'Registry information and honeymoon fund',
    date: ''
  },
  {
    id: 'faq',
    title: 'FAQs',
    time: '',
    culture: 'American',
    duration: '',
    description: 'Frequently asked questions',
    date: ''
  }
];

// Helper function to get only main sections (non-event items)
export const getMainSections = () => {
  return siteNavigationData.filter(item => !item.time);
};

// Helper function to get only events
export const getEventsSections = () => {
  return siteNavigationData.filter(item => item.time);
};