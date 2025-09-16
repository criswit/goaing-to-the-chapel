export interface AccommodationOption {
  id: string;
  name: string;
  location: string;
  region: 'South Goa' | 'North Goa';
  type: 'luxury' | 'family' | 'party' | 'spa';
  distance: string;
  beachAccess: boolean;
  highlights: string[];
  amenities: string[];
  roomTypes?: string[];
  specialFeatures?: string[];
  vibe: string;
  bookingUrl?: string;
  priceRange?: string;
  suitableFor: string[];
}

export interface RegionVibe {
  name: 'South Goa' | 'North Goa';
  character: string;
  atmosphere: string[];
  activities: string[];
  crowd: string[];
  beaches: string;
  nightlife: string;
  dining: string;
  accommodation: string;
}

export interface PracticalInfo {
  distanceFromVenue: string;
  travelTime: string;
  transportOptions: string[];
  bookingTips: string[];
}
