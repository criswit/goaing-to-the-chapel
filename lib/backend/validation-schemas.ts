/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data Validation Schemas for Wedding RSVP System
 *
 * Comprehensive validation rules and naming conventions for all DynamoDB attributes
 * Following snake_case for database attributes and camelCase for API responses
 */

/**
 * Naming Convention Rules
 */
export const NamingConventions = {
  DATABASE: {
    pattern: 'snake_case',
    examples: ['guest_name', 'rsvp_status', 'created_at', 'plus_ones_count'],
    description: 'All DynamoDB attributes use snake_case',
  },
  API_RESPONSE: {
    pattern: 'camelCase',
    examples: ['guestName', 'rsvpStatus', 'createdAt', 'plusOnesCount'],
    description: 'API responses use camelCase for JavaScript/TypeScript compatibility',
  },
  CONSTANTS: {
    pattern: 'UPPER_SNAKE_CASE',
    examples: ['MAX_PLUS_ONES', 'RSVP_STATUS_ATTENDING'],
    description: 'Constants and enums use UPPER_SNAKE_CASE',
  },
  KEY_PREFIXES: {
    pattern: 'UPPERCASE#value',
    examples: ['EVENT#123', 'GUEST#email@example.com', 'INVITATION#ABC123'],
    description: 'Composite keys use UPPERCASE prefix with # separator',
  },
} as const;

/**
 * Field Validation Rules
 */
export const ValidationRules = {
  // Email validation
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    minLength: 5,
    maxLength: 254,
    required: true,
    transform: (value: string) => value.toLowerCase().trim(),
    errorMessage: 'Invalid email format',
  },

  // Phone validation
  phone: {
    pattern: /^(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
    minLength: 10,
    maxLength: 20,
    required: false,
    transform: (value: string) => value.replace(/[^\d+]/g, ''),
    errorMessage: 'Invalid phone number format',
  },

  // Guest name validation
  guest_name: {
    pattern: /^[a-zA-Z\s\-'.]{2,100}$/,
    minLength: 2,
    maxLength: 100,
    required: true,
    transform: (value: string) => value.trim(),
    errorMessage: 'Name must contain only letters, spaces, hyphens, and apostrophes',
  },

  // Invitation code validation
  invitation_code: {
    pattern: /^[A-Za-z0-9\-]{3,50}$/,
    minLength: 3,
    maxLength: 50,
    required: true,
    transform: (value: string) => value.toLowerCase().trim(),
    errorMessage: 'Invitation code must be 3-50 alphanumeric characters (hyphens allowed)',
  },

  // Plus ones count validation
  plus_ones_count: {
    min: 0,
    max: 5,
    type: 'number',
    required: true,
    errorMessage: 'Plus ones count must be between 0 and 5',
  },

  // Date validation
  event_date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    format: 'YYYY-MM-DD',
    required: true,
    errorMessage: 'Date must be in YYYY-MM-DD format',
  },

  // Time validation
  event_time: {
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    format: 'HH:MM',
    required: true,
    errorMessage: 'Time must be in HH:MM format (24-hour)',
  },

  // ISO timestamp validation
  timestamp: {
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
    format: 'ISO 8601',
    required: true,
    transform: () => new Date().toISOString(),
    errorMessage: 'Timestamp must be in ISO 8601 format',
  },
};

/**
 * Enum Definitions
 */
export const Enums = {
  RSVP_STATUS: {
    values: ['pending', 'attending', 'not_attending', 'maybe'] as const,
    default: 'pending',
    errorMessage: 'Invalid RSVP status',
  },

  EVENT_TYPE: {
    values: ['ceremony', 'reception', 'mehendi', 'sangeet', 'haldi'] as const,
    errorMessage: 'Invalid event type',
  },

  RESPONSE_METHOD: {
    values: ['web', 'email', 'phone', 'admin'] as const,
    default: 'web',
    errorMessage: 'Invalid response method',
  },

  GROUP_RSVP_STATUS: {
    values: ['pending', 'partial', 'complete'] as const,
    default: 'pending',
    errorMessage: 'Invalid group RSVP status',
  },

  DIETARY_RESTRICTIONS: {
    values: [
      'vegetarian',
      'vegan',
      'gluten_free',
      'dairy_free',
      'nut_allergy',
      'shellfish_allergy',
      'halal',
      'kosher',
      'no_beef',
      'no_pork',
      'other',
    ] as const,
    multiple: true,
    errorMessage: 'Invalid dietary restriction',
  },
};

/**
 * Composite Validation Schemas
 */
export interface ValidationSchema {
  validate(data: any): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Guest Entity Validation Schema
 */
export class GuestValidationSchema implements ValidationSchema {
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitized: any = {};

    // Required fields
    const requiredFields = [
      'guest_name',
      'email',
      'rsvp_status',
      'invitation_code',
      'plus_ones_count',
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
          value: data[field],
        });
      }
    }

    // Email validation
    if (data.email) {
      const emailRule = ValidationRules.email;
      if (!emailRule.pattern.test(data.email)) {
        errors.push({
          field: 'email',
          message: emailRule.errorMessage,
          value: data.email,
        });
      } else {
        sanitized.email = emailRule.transform(data.email);
      }
    }

    // Guest name validation
    if (data.guest_name) {
      const nameRule = ValidationRules.guest_name;
      if (!nameRule.pattern.test(data.guest_name)) {
        errors.push({
          field: 'guest_name',
          message: nameRule.errorMessage,
          value: data.guest_name,
        });
      } else {
        sanitized.guest_name = nameRule.transform(data.guest_name);
      }
    }

    // Phone validation (optional)
    if (data.phone) {
      const phoneRule = ValidationRules.phone;
      if (!phoneRule.pattern.test(data.phone)) {
        errors.push({
          field: 'phone',
          message: phoneRule.errorMessage,
          value: data.phone,
        });
      } else {
        sanitized.phone = phoneRule.transform(data.phone);
      }
    }

    // RSVP status validation
    if (data.rsvp_status) {
      if (!Enums.RSVP_STATUS.values.includes(data.rsvp_status)) {
        errors.push({
          field: 'rsvp_status',
          message: Enums.RSVP_STATUS.errorMessage,
          value: data.rsvp_status,
        });
      } else {
        sanitized.rsvp_status = data.rsvp_status;
      }
    }

    // Invitation code validation
    if (data.invitation_code) {
      const codeRule = ValidationRules.invitation_code;
      if (!codeRule.pattern.test(data.invitation_code)) {
        errors.push({
          field: 'invitation_code',
          message: codeRule.errorMessage,
          value: data.invitation_code,
        });
      } else {
        sanitized.invitation_code = codeRule.transform(data.invitation_code);
      }
    }

    // Plus ones count validation
    if (data.plus_ones_count !== undefined) {
      const plusOnesRule = ValidationRules.plus_ones_count;
      const count = Number(data.plus_ones_count);
      if (isNaN(count) || count < plusOnesRule.min || count > plusOnesRule.max) {
        errors.push({
          field: 'plus_ones_count',
          message: plusOnesRule.errorMessage,
          value: data.plus_ones_count,
        });
      } else {
        sanitized.plus_ones_count = count;
      }
    }

    // Dietary restrictions validation
    if (data.dietary_restrictions && Array.isArray(data.dietary_restrictions)) {
      const invalidRestrictions = data.dietary_restrictions.filter(
        (r: string) => !Enums.DIETARY_RESTRICTIONS.values.includes(r as any)
      );
      if (invalidRestrictions.length > 0) {
        errors.push({
          field: 'dietary_restrictions',
          message: Enums.DIETARY_RESTRICTIONS.errorMessage,
          value: invalidRestrictions,
        });
      } else {
        sanitized.dietary_restrictions = data.dietary_restrictions;
      }
    }

    // Add timestamps
    sanitized.updated_at = new Date().toISOString();
    if (!data.created_at) {
      sanitized.created_at = sanitized.updated_at;
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? { ...data, ...sanitized } : undefined,
    };
  }
}

/**
 * Event Entity Validation Schema
 */
export class EventValidationSchema implements ValidationSchema {
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitized: any = {};

    // Required fields
    const requiredFields = ['event_name', 'event_date', 'event_time', 'event_type', 'location'];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
          value: data[field],
        });
      }
    }

    // Event date validation
    if (data.event_date) {
      const dateRule = ValidationRules.event_date;
      if (!dateRule.pattern.test(data.event_date)) {
        errors.push({
          field: 'event_date',
          message: dateRule.errorMessage,
          value: data.event_date,
        });
      } else {
        sanitized.event_date = data.event_date;
      }
    }

    // Event time validation
    if (data.event_time) {
      const timeRule = ValidationRules.event_time;
      if (!timeRule.pattern.test(data.event_time)) {
        errors.push({
          field: 'event_time',
          message: timeRule.errorMessage,
          value: data.event_time,
        });
      } else {
        sanitized.event_time = data.event_time;
      }
    }

    // Event type validation
    if (data.event_type) {
      if (!Enums.EVENT_TYPE.values.includes(data.event_type)) {
        errors.push({
          field: 'event_type',
          message: Enums.EVENT_TYPE.errorMessage,
          value: data.event_type,
        });
      } else {
        sanitized.event_type = data.event_type;
      }
    }

    // Location validation
    if (data.location) {
      const requiredLocationFields = ['venue_name', 'address', 'city', 'state'];
      for (const field of requiredLocationFields) {
        if (!data.location[field]) {
          errors.push({
            field: `location.${field}`,
            message: `${field} is required in location`,
            value: data.location[field],
          });
        }
      }
      if (errors.filter((e) => e.field.startsWith('location')).length === 0) {
        sanitized.location = data.location;
      }
    }

    // Add timestamps
    sanitized.updated_at = new Date().toISOString();
    if (!data.created_at) {
      sanitized.created_at = sanitized.updated_at;
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? { ...data, ...sanitized } : undefined,
    };
  }
}

/**
 * Validator Factory
 */
export class ValidatorFactory {
  private static validators = new Map<string, ValidationSchema>([
    ['GUEST', new GuestValidationSchema()],
    ['EVENT', new EventValidationSchema()],
  ]);

  static getValidator(entityType: string): ValidationSchema | undefined {
    return this.validators.get(entityType);
  }

  static validate(entityType: string, data: any): ValidationResult {
    const validator = this.getValidator(entityType);
    if (!validator) {
      return {
        valid: false,
        errors: [
          {
            field: 'entityType',
            message: `No validator found for entity type: ${entityType}`,
          },
        ],
      };
    }
    return validator.validate(data);
  }
}

/**
 * Transform utilities for API response conversion
 */
export const TransformUtils = {
  /**
   * Convert snake_case database fields to camelCase API response
   */
  toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => TransformUtils.toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = TransformUtils.toCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  },

  /**
   * Convert camelCase API request to snake_case database fields
   */
  toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => TransformUtils.toSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        result[snakeKey] = TransformUtils.toSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  },
};

/**
 * Data integrity constraints
 */
export const IntegrityConstraints = {
  // Ensure unique email per event
  ensureUniqueGuestPerEvent: (_eventId: string, _email: string) => {
    return {
      ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };
  },

  // Ensure invitation code uniqueness
  ensureUniqueInvitationCode: (_code: string) => {
    return {
      ConditionExpression: 'attribute_not_exists(PK)',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };
  },

  // Validate plus ones don't exceed limit
  validatePlusOnesLimit: (count: number, maxAllowed: number = 5) => {
    if (count > maxAllowed) {
      throw new Error(`Plus ones count (${count}) exceeds maximum allowed (${maxAllowed})`);
    }
    return true;
  },

  // Validate RSVP deadline
  validateRsvpDeadline: (eventDate: string, rsvpDeadline?: string) => {
    if (rsvpDeadline) {
      const deadline = new Date(rsvpDeadline);
      const event = new Date(eventDate);
      if (deadline >= event) {
        throw new Error('RSVP deadline must be before the event date');
      }
    }
    return true;
  },
};
