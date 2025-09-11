import { z } from 'zod';

// Form step schemas
export const InvitationCodeSchema = z.object({
  invitationCode: z
    .string()
    .min(3, 'Invitation code must be at least 3 characters')
    .max(50, 'Invitation code must be at most 50 characters')
    .regex(/^[A-Za-z0-9\-]+$/, 'Invitation code must be alphanumeric (hyphens allowed)')
    .transform((val) => val.toLowerCase()),
});

export const PersonalInfoSchema = z.object({
  guestName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .regex(
      /^(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
      'Please enter a valid phone number'
    )
    .optional(),
  attendanceStatus: z.enum(['attending', 'not_attending', 'maybe'] as const),
  attendeeCount: z.number().int().min(0).max(10),
  plusOnes: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(2, 'Name must be at least 2 characters'),
        ageGroup: z.enum(['adult', 'child', 'infant'] as const).optional(),
        dietaryRestrictions: z
          .array(
            z.enum([
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
            ] as const)
          )
          .optional(),
        specialNeeds: z
          .string()
          .max(500, 'Special needs must be less than 500 characters')
          .optional(),
        mealPreference: z
          .string()
          .max(100, 'Meal preference must be less than 100 characters')
          .optional(),
      })
    )
    .optional(),
});

export const DietaryInfoSchema = z.object({
  dietaryRestrictions: z
    .array(
      z.enum([
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
      ] as const)
    )
    .optional(),
  dietaryNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  specialRequests: z.string().max(1000, 'Requests must be less than 1000 characters').optional(),
  needsTransportation: z.boolean().optional(),
  needsAccommodation: z.boolean().optional(),
  songRequests: z.string().max(500, 'Song requests must be less than 500 characters').optional(),
});

// Combined form schema
export const RSVPFormSchema =
  InvitationCodeSchema.merge(PersonalInfoSchema).merge(DietaryInfoSchema);

// Types
export type InvitationCodeData = z.infer<typeof InvitationCodeSchema>;
export type PersonalInfoData = z.infer<typeof PersonalInfoSchema>;
export type DietaryInfoData = z.infer<typeof DietaryInfoSchema>;
export type RSVPFormData = z.infer<typeof RSVPFormSchema>;

// API Response types
export interface GuestInfo {
  email: string;
  name: string;
  eventId: string;
  groupId?: string;
  plusOnesAllowed: number;
  rsvpStatus: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  guestInfo?: GuestInfo;
  error?: string;
}

export interface RSVPSubmissionResponse {
  success: boolean;
  confirmationNumber?: string;
  message?: string;
  error?: string;
}

// Form step type
export type FormStep = 'invitation' | 'personal' | 'dietary' | 'review';

// Form context type
export interface RSVPFormContextType {
  currentStep: FormStep;
  formData: Partial<RSVPFormData>;
  guestInfo: GuestInfo | null;
  updateFormData: (data: Partial<RSVPFormData>) => void;
  setGuestInfo: (info: GuestInfo) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: FormStep) => void;
  resetForm: () => void;
}
