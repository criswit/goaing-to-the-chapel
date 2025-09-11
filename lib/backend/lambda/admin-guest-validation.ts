import { z } from 'zod';

/**
 * Validation schemas for Admin Guest API requests
 * Using Zod for runtime type validation
 */

// Re-define schemas locally to avoid import issues
const RsvpStatusSchema = z.enum(['attending', 'not_attending', 'maybe', 'pending']);

const DietaryRestrictionSchema = z.enum([
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
]);

const PlusOneDetailsSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  ageGroup: z.enum(['adult', 'child', 'infant']).optional(),
  dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),
  specialNeeds: z.string().max(500, 'Special needs must be less than 500 characters').optional(),
  mealPreference: z
    .string()
    .max(100, 'Meal preference must be less than 100 characters')
    .optional(),
});

// Invitation code validation
export const InvitationCodeSchema = z
  .string()
  .min(6, 'Invitation code must be at least 6 characters')
  .max(8, 'Invitation code must be at most 8 characters')
  .regex(/^[A-Z0-9]+$/, 'Invitation code must be uppercase alphanumeric')
  .transform((val) => val.toUpperCase());

// Admin guest update request schema - allows partial updates
export const AdminGuestUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
    .optional(),

  email: z.string().email('Invalid email format').optional(),

  phone: z
    .string()
    .regex(
      /^(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
      'Invalid phone number format'
    )
    .optional(),

  rsvpStatus: RsvpStatusSchema.optional(),

  partySize: z
    .number()
    .int('Party size must be a whole number')
    .min(0, 'Party size cannot be negative')
    .max(10, 'Maximum 10 attendees allowed')
    .optional(),

  attendeeCount: z
    .number()
    .int('Attendee count must be a whole number')
    .min(0, 'Attendee count cannot be negative')
    .max(10, 'Maximum 10 attendees allowed')
    .optional(),

  plusOnes: z.array(PlusOneDetailsSchema).max(9, 'Maximum 9 plus ones allowed').optional(),

  plusOneName: z.string().max(200, 'Plus one names must be less than 200 characters').optional(),

  dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),

  plusOneDietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),

  otherDietary: z
    .string()
    .max(500, 'Other dietary restrictions must be less than 500 characters')
    .optional(),

  plusOneOtherDietary: z
    .string()
    .max(500, 'Plus one other dietary restrictions must be less than 500 characters')
    .optional(),

  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),

  specialRequests: z
    .string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional(),

  tableNumber: z
    .number()
    .int('Table number must be a whole number')
    .min(1, 'Table number must be at least 1')
    .max(100, 'Table number must be at most 100')
    .optional(),

  needsTransportation: z.boolean().optional(),

  needsAccommodation: z.boolean().optional(),

  adminNotes: z.string().max(2000, 'Admin notes must be less than 2000 characters').optional(),
});

// Full guest creation schema (for new guests)
export const AdminGuestCreateSchema = z.object({
  invitationCode: InvitationCodeSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(
      /^(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
      'Invalid phone number format'
    )
    .optional(),
  maxGuests: z
    .number()
    .int('Max guests must be a whole number')
    .min(1, 'Max guests must be at least 1')
    .max(10, 'Maximum 10 guests allowed')
    .default(1),
  tableNumber: z
    .number()
    .int('Table number must be a whole number')
    .min(1, 'Table number must be at least 1')
    .max(100, 'Table number must be at most 100')
    .optional(),
  adminNotes: z.string().max(2000, 'Admin notes must be less than 2000 characters').optional(),
});

// Audit log schema
export const AuditLogSchema = z.object({
  adminEmail: z.string().email(),
  adminName: z.string(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'VIEW']),
  targetType: z.enum(['GUEST', 'RSVP', 'BULK']),
  targetId: z.string(),
  changes: z
    .object({
      field: z.string(),
      oldValue: z.unknown(),
      newValue: z.unknown(),
    })
    .array()
    .optional(),
  timestamp: z.string().datetime(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Validation helper functions
export function validateInvitationCode(code: unknown) {
  return InvitationCodeSchema.safeParse(code);
}

export function validateAdminGuestUpdate(data: unknown) {
  return AdminGuestUpdateSchema.safeParse(data);
}

export function validateAdminGuestCreate(data: unknown) {
  return AdminGuestCreateSchema.safeParse(data);
}

// Transform function to convert admin update to database format
export function transformAdminUpdateToDbFormat(
  validatedData: z.infer<typeof AdminGuestUpdateSchema>,
  _invitationCode: string
) {
  const profileUpdate: Record<string, unknown> = {};
  const rsvpUpdate: Record<string, unknown> = {};

  // Profile fields
  if (validatedData.name !== undefined) {
    profileUpdate.guest_name = validatedData.name;
    profileUpdate.name = validatedData.name;
  }
  if (validatedData.email !== undefined) {
    profileUpdate.email = validatedData.email;
  }
  if (validatedData.phone !== undefined) {
    profileUpdate.phone = validatedData.phone;
  }
  if (validatedData.tableNumber !== undefined) {
    profileUpdate.table_number = validatedData.tableNumber;
  }
  if (validatedData.adminNotes !== undefined) {
    profileUpdate.admin_notes = validatedData.adminNotes;
  }

  // RSVP fields
  if (validatedData.rsvpStatus !== undefined) {
    rsvpUpdate.rsvp_status = validatedData.rsvpStatus;
    rsvpUpdate.rsvpStatus = validatedData.rsvpStatus;
  }
  if (validatedData.partySize !== undefined) {
    rsvpUpdate.guests = validatedData.partySize;
    rsvpUpdate.attendeeCount = validatedData.partySize;
  }
  if (validatedData.attendeeCount !== undefined) {
    rsvpUpdate.guests = validatedData.attendeeCount;
    rsvpUpdate.attendeeCount = validatedData.attendeeCount;
  }
  if (validatedData.plusOnes !== undefined) {
    rsvpUpdate.plusOnes = validatedData.plusOnes;
    rsvpUpdate.plus_ones_details = validatedData.plusOnes.map((po) => ({
      id: po.id || `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: po.name,
      age_group: po.ageGroup,
      dietary_restrictions: po.dietaryRestrictions,
      special_needs: po.specialNeeds,
      meal_preference: po.mealPreference,
    }));
    rsvpUpdate.plus_ones_names = validatedData.plusOnes.map((po) => po.name);
  }
  if (validatedData.plusOneName !== undefined) {
    rsvpUpdate.plusOneName = validatedData.plusOneName;
  }
  if (validatedData.dietaryRestrictions !== undefined) {
    rsvpUpdate.dietary_restrictions = validatedData.dietaryRestrictions;
    rsvpUpdate.dietaryRestrictions = validatedData.dietaryRestrictions;
  }
  if (validatedData.plusOneDietaryRestrictions !== undefined) {
    rsvpUpdate.plusOneDietaryRestrictions = validatedData.plusOneDietaryRestrictions;
  }
  if (validatedData.otherDietary !== undefined) {
    rsvpUpdate.otherDietary = validatedData.otherDietary;
  }
  if (validatedData.plusOneOtherDietary !== undefined) {
    rsvpUpdate.plusOneOtherDietary = validatedData.plusOneOtherDietary;
  }
  if (validatedData.notes !== undefined) {
    rsvpUpdate.notes = validatedData.notes;
  }
  if (validatedData.specialRequests !== undefined) {
    rsvpUpdate.specialRequests = validatedData.specialRequests;
    rsvpUpdate.special_requests = validatedData.specialRequests;
  }
  if (validatedData.needsTransportation !== undefined) {
    rsvpUpdate.needs_transportation = validatedData.needsTransportation;
  }
  if (validatedData.needsAccommodation !== undefined) {
    rsvpUpdate.needs_accommodation = validatedData.needsAccommodation;
  }

  return {
    profileUpdate,
    rsvpUpdate,
    hasProfileChanges: Object.keys(profileUpdate).length > 0,
    hasRsvpChanges: Object.keys(rsvpUpdate).length > 0,
  };
}

// Validation error formatter
export function formatValidationErrors(errors: z.ZodError) {
  return errors.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

// Function to create audit log entry
export function createAuditLogEntry(
  adminUser: { email: string; name: string },
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
  targetType: 'GUEST' | 'RSVP' | 'BULK',
  targetId: string,
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>,
  requestContext?: { sourceIp?: string; userAgent?: string }
) {
  return {
    PK: `AUDIT#${new Date().toISOString()}`,
    SK: `${targetType}#${targetId}`,
    adminEmail: adminUser.email,
    adminName: adminUser.name,
    action,
    targetType,
    targetId,
    changes,
    timestamp: new Date().toISOString(),
    ipAddress: requestContext?.sourceIp,
    userAgent: requestContext?.userAgent,
    TTL: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days retention
  };
}
