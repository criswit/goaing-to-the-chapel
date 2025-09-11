/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Guest {
  guestId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dietaryRestrictions?: string[];
  plusOne?: boolean;
  inviteGroup?: string;
}

export interface Event {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description?: string;
  maxAttendees?: number;
  requiresRSVP: boolean;
}

export interface RSVP {
  rsvpId: string;
  guestId: string;
  eventId: string;
  status: 'attending' | 'not-attending' | 'maybe';
  responseDate: string;
  attendeeCount: number;
  dietaryNotes?: string;
  specialRequests?: string;
  plusOneDetails?: {
    name: string;
    dietaryRestrictions?: string[];
  };
}

export interface DynamoDBItem {
  PK: string;
  SK: string;
  EntityType: string;
  CreatedAt: string;
  UpdatedAt: string;
  EventId?: string;
  RSVPStatus?: string;
  [key: string]: any;
}

export interface APIResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Credentials'?: string;
  };
  body: string;
}
