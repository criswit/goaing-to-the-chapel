/**
 * DynamoDB Single-Table Design Schema for Wedding RSVP System
 *
 * This schema implements a single-table design pattern optimized for
 * guest management and RSVP operations with multiple access patterns.
 */

/**
 * Entity Types and Key Patterns
 *
 * Single Table Design using composite keys for efficient data access
 */
export const EntityKeyPatterns = {
  // Guest Entity
  GUEST: {
    PK: 'EVENT#<eventId>',
    SK: 'GUEST#<email>',
    EntityType: 'GUEST',
    description: 'Individual guest record within an event',
  },

  // Event Entity
  EVENT: {
    PK: 'EVENT#<eventId>',
    SK: 'METADATA',
    EntityType: 'EVENT',
    description: 'Event metadata and configuration',
  },

  // RSVP Response Entity
  RSVP_RESPONSE: {
    PK: 'EVENT#<eventId>',
    SK: 'RSVP#<guestEmail>#<timestamp>',
    EntityType: 'RSVP_RESPONSE',
    description: 'Guest RSVP response with historical tracking',
  },

  // Invitation Code Entity
  INVITATION_CODE: {
    PK: 'INVITATION#<code>',
    SK: 'METADATA',
    EntityType: 'INVITATION_CODE',
    description: 'Unique invitation codes for guest lookup',
  },

  // Guest Group Entity (for managing families/groups)
  GUEST_GROUP: {
    PK: 'EVENT#<eventId>',
    SK: 'GROUP#<groupId>',
    EntityType: 'GUEST_GROUP',
    description: 'Group of related guests (family, table, etc.)',
  },
} as const;

/**
 * Core Attributes for All Entities
 */
export interface BaseAttributes {
  PK: string; // Partition Key
  SK: string; // Sort Key
  EntityType: string; // Entity type identifier
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  version?: number; // Optimistic locking version
}

/**
 * Guest Entity Attributes
 */
export interface GuestEntity extends BaseAttributes {
  EntityType: 'GUEST';

  // Core guest information
  guest_name: string;
  email: string;
  phone?: string;

  // RSVP related fields
  rsvp_status: 'pending' | 'attending' | 'not_attending' | 'maybe';
  plus_ones_count: number;
  plus_ones_names?: string[];
  dietary_restrictions?: string[];
  special_requests?: string;

  // Invitation management
  invitation_code: string;
  invitation_sent_at?: string;
  invitation_viewed_at?: string;

  // Group management
  group_id?: string;
  is_primary_contact?: boolean;

  // GSI attributes
  InvitationCode: string; // GSI1 PK
  EventStatus: string; // GSI2 PK (EVENT#<eventId>#STATUS#<status>)
  AdminDate: string; // GSI3 SK (DATE#<date>#STATUS#<status>)
}

/**
 * Event Entity Attributes
 */
export interface EventEntity extends BaseAttributes {
  EntityType: 'EVENT';

  event_name: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:MM
  event_type: 'ceremony' | 'reception' | 'mehendi' | 'sangeet' | 'haldi';
  location: {
    venue_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  capacity?: number;
  current_attendees?: number;
  requires_rsvp: boolean;
  rsvp_deadline?: string;

  // Event configuration
  allow_plus_ones: boolean;
  max_plus_ones?: number;
  dietary_options?: string[];
  dress_code?: string;

  // Statistics
  total_invited?: number;
  total_confirmed?: number;
  total_declined?: number;
  total_maybe?: number;
}

/**
 * RSVP Response Entity Attributes
 */
export interface RsvpResponseEntity extends BaseAttributes {
  EntityType: 'RSVP_RESPONSE';

  guest_email: string;
  event_id: string;
  response_status: 'attending' | 'not_attending' | 'maybe';
  response_timestamp: string;

  // Response details
  party_size: number;
  plus_ones_details?: Array<{
    name: string;
    dietary_restrictions?: string[];
  }>;

  dietary_notes?: string;
  special_accommodations?: string;

  // Tracking
  response_method: 'web' | 'email' | 'phone' | 'admin';
  ip_address?: string;
  user_agent?: string;

  // GSI attributes
  EventId: string; // For EventRSVPIndex
  RSVPStatus: string; // For EventRSVPIndex sort key
}

/**
 * Invitation Code Entity Attributes
 */
export interface InvitationCodeEntity extends BaseAttributes {
  EntityType: 'INVITATION_CODE';

  code: string;
  event_id: string;
  guest_email: string;

  // Usage tracking
  max_uses: number;
  current_uses: number;
  first_used_at?: string;
  last_used_at?: string;

  // Validity
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;

  // Guest group association
  group_id?: string;
}

/**
 * Guest Group Entity Attributes
 */
export interface GuestGroupEntity extends BaseAttributes {
  EntityType: 'GUEST_GROUP';

  group_id: string;
  group_name: string;
  event_id: string;

  // Group configuration
  max_party_size: number;
  current_party_size: number;

  // Primary contact
  primary_contact_email: string;
  primary_contact_name: string;

  // Member tracking
  member_emails: string[];

  // Group RSVP status
  group_rsvp_status: 'pending' | 'partial' | 'complete';

  // Table assignment (for reception)
  table_number?: string;
  seating_notes?: string;
}

/**
 * Composite Key Helper Functions
 */
export const KeyBuilder = {
  // Primary key builders
  buildEventPK: (eventId: string) => `EVENT#${eventId}`,
  buildGuestSK: (email: string) => `GUEST#${email}`,
  buildRsvpSK: (email: string, timestamp: string) => `RSVP#${email}#${timestamp}`,
  buildGroupSK: (groupId: string) => `GROUP#${groupId}`,
  buildInvitationPK: (code: string) => `INVITATION#${code}`,

  // GSI key builders
  buildInvitationGSI: (code: string) => `INVITATION#${code}`,
  buildEventStatusGSI: (eventId: string, status: string) => `EVENT#${eventId}#STATUS#${status}`,
  buildAdminDateGSI: (date: string, status: string) => `DATE#${date}#STATUS#${status}`,

  // Key parsers
  parseEventId: (pk: string) => pk.replace('EVENT#', ''),
  parseGuestEmail: (sk: string) => sk.replace('GUEST#', ''),
  parseInvitationCode: (pk: string) => pk.replace('INVITATION#', ''),
  parseGroupId: (sk: string) => sk.replace('GROUP#', ''),
};

/**
 * DynamoDB Query Patterns
 */
export const QueryPatterns = {
  // Primary access patterns
  GET_GUEST_BY_EVENT_EMAIL: {
    description: 'Get a specific guest for an event',
    index: 'Primary',
    PK: 'EVENT#<eventId>',
    SK: 'GUEST#<email>',
  },

  LIST_GUESTS_BY_EVENT: {
    description: 'List all guests for an event',
    index: 'Primary',
    PK: 'EVENT#<eventId>',
    SK_begins_with: 'GUEST#',
  },

  GET_EVENT_METADATA: {
    description: 'Get event details',
    index: 'Primary',
    PK: 'EVENT#<eventId>',
    SK: 'METADATA',
  },

  // GSI1: Invitation lookup
  GET_GUEST_BY_INVITATION_CODE: {
    description: 'Find guest using invitation code',
    index: 'InvitationCodeIndex',
    PK: 'INVITATION#<code>',
  },

  // GSI2: Status filtering
  LIST_GUESTS_BY_STATUS: {
    description: 'List guests by RSVP status for an event',
    index: 'EventStatusIndex',
    PK: 'EVENT#<eventId>#STATUS#<status>',
  },

  // GSI3: Admin queries
  LIST_BY_DATE_AND_STATUS: {
    description: 'Admin query for guests by date and status',
    index: 'AdminDateIndex',
    PK: 'ADMIN',
    SK_begins_with: 'DATE#<date>',
  },

  // Additional patterns
  GET_RSVP_HISTORY: {
    description: 'Get RSVP response history for a guest',
    index: 'Primary',
    PK: 'EVENT#<eventId>',
    SK_begins_with: 'RSVP#<email>#',
  },

  LIST_GROUP_MEMBERS: {
    description: 'List all members of a guest group',
    index: 'Primary',
    PK: 'EVENT#<eventId>',
    SK: 'GROUP#<groupId>',
  },
};

/**
 * Data Consistency Rules
 */
export const ConsistencyRules = {
  // Ensure email uniqueness per event
  UNIQUE_GUEST_PER_EVENT: 'One guest email per event',

  // Invitation code uniqueness
  UNIQUE_INVITATION_CODE: 'Globally unique invitation codes',

  // RSVP status consistency
  VALID_RSVP_STATUS: ['pending', 'attending', 'not_attending', 'maybe'],

  // Plus ones validation
  MAX_PLUS_ONES: 5,

  // Date format validations
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:MM',
  TIMESTAMP_FORMAT: 'ISO 8601',
};

/**
 * Type Guards
 */
export const isGuestEntity = (item: BaseAttributes): item is GuestEntity => {
  return item.EntityType === 'GUEST';
};

export const isEventEntity = (item: BaseAttributes): item is EventEntity => {
  return item.EntityType === 'EVENT';
};

export const isRsvpResponseEntity = (item: BaseAttributes): item is RsvpResponseEntity => {
  return item.EntityType === 'RSVP_RESPONSE';
};

export const isInvitationCodeEntity = (item: BaseAttributes): item is InvitationCodeEntity => {
  return item.EntityType === 'INVITATION_CODE';
};

export const isGuestGroupEntity = (item: BaseAttributes): item is GuestGroupEntity => {
  return item.EntityType === 'GUEST_GROUP';
};
