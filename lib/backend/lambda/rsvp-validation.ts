import { z } from 'zod';

/**
 * Validation schemas for RSVP API requests and responses
 * Using Zod for runtime type validation
 */

// Enum schemas
export const RsvpStatusSchema = z.enum(['attending', 'not_attending', 'maybe', 'pending']);

export const DietaryRestrictionSchema = z.enum([
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

// Plus one details schema
export const PlusOneDetailsSchema = z.object({
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

// POST /api/rsvp request body schema
export const CreateRsvpRequestSchema = z
  .object({
    invitationCode: z
      .string()
      .min(6, 'Invitation code must be at least 6 characters')
      .max(8, 'Invitation code must be at most 8 characters')
      .regex(/^[A-Z0-9]+$/, 'Invitation code must be uppercase alphanumeric')
      .transform((val) => val.toUpperCase()),

    rsvpStatus: RsvpStatusSchema,

    attendeeCount: z
      .number()
      .int('Attendee count must be a whole number')
      .min(0, 'Attendee count cannot be negative')
      .max(10, 'Maximum 10 attendees allowed'),

    plusOnes: z
      .array(PlusOneDetailsSchema)
      .optional()
      .refine(
        (plusOnes) => {
          if (plusOnes && plusOnes.length > 5) {
            return false;
          }
          return true;
        },
        {
          message: 'Maximum 5 plus ones allowed',
        }
      ),

    dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),

    dietaryNotes: z.string().max(500, 'Dietary notes must be less than 500 characters').optional(),

    specialRequests: z
      .string()
      .max(1000, 'Special requests must be less than 1000 characters')
      .optional(),

    phoneNumber: z
      .string()
      .regex(
        /^(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
        'Invalid phone number format'
      )
      .optional(),

    emailConfirmation: z.string().email('Invalid email format').optional(),

    needsTransportation: z.boolean().optional(),
    needsAccommodation: z.boolean().optional(),

    songRequests: z.string().max(500, 'Song requests must be less than 500 characters').optional(),
  })
  .refine(
    (data) => {
      // Validate attendee count matches plus ones
      if (data.rsvpStatus === 'attending') {
        const plusOnesCount = data.plusOnes?.length || 0;
        const expectedCount = plusOnesCount + 1; // +1 for the primary guest

        if (data.attendeeCount !== expectedCount) {
          return false;
        }
      }

      // If not attending, attendee count should be 0
      if (data.rsvpStatus === 'not_attending' && data.attendeeCount !== 0) {
        return false;
      }

      return true;
    },
    {
      message: 'Attendee count must match the number of guests',
      path: ['attendeeCount'],
    }
  );

// Update RSVP request schema (allows partial updates)
export const UpdateRsvpRequestSchema = CreateRsvpRequestSchema.partial().extend({
  invitationCode: z
    .string()
    .min(6, 'Invitation code must be at least 6 characters')
    .max(8, 'Invitation code must be at most 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Invitation code must be uppercase alphanumeric')
    .transform((val) => val.toUpperCase()),
});

// GET /api/rsvp/{invitationCode}/status response schema
export const RsvpStatusResponseSchema = z.object({
  success: z.boolean(),
  status: z
    .object({
      isComplete: z.boolean(),
      completionPercentage: z.number().min(0).max(100),
      rsvpStatus: RsvpStatusSchema,
      submittedAt: z.string().datetime().optional(),
      lastUpdatedAt: z.string().datetime().optional(),
      missingFields: z.array(z.string()).optional(),
      requiredActions: z.array(z.string()).optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// Validation helper functions
export function validateCreateRsvpRequest(data: unknown) {
  return CreateRsvpRequestSchema.safeParse(data);
}

export function validateUpdateRsvpRequest(data: unknown) {
  return UpdateRsvpRequestSchema.safeParse(data);
}

// Transform function to convert API request to database format
export function transformToDbFormat(validatedData: z.infer<typeof CreateRsvpRequestSchema>) {
  return {
    invitation_code: validatedData.invitationCode,
    rsvp_status: validatedData.rsvpStatus,
    attendee_count: validatedData.attendeeCount,
    plus_ones_details: validatedData.plusOnes?.map((po) => ({
      id: po.id || `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: po.name,
      age_group: po.ageGroup,
      dietary_restrictions: po.dietaryRestrictions,
      special_needs: po.specialNeeds,
      meal_preference: po.mealPreference,
    })),
    plus_ones_names: validatedData.plusOnes?.map((po) => po.name),
    dietary_restrictions: validatedData.dietaryRestrictions,
    dietary_notes: validatedData.dietaryNotes,
    special_requests: validatedData.specialRequests,
    phone: validatedData.phoneNumber,
    email_confirmation: validatedData.emailConfirmation,
    needs_transportation: validatedData.needsTransportation,
    needs_accommodation: validatedData.needsAccommodation,
    song_requests: validatedData.songRequests,
    response_timestamp: new Date().toISOString(),
    response_method: 'web',
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
