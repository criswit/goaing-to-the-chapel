import { InvitationValidationResponse, RSVPFormData, RSVPSubmissionResponse } from '../types/rsvp';
import { loadConfig } from '../config';

// API URL will be loaded from config
let API_BASE_URL = '';

// Load config on module initialization
loadConfig().then(config => {
  API_BASE_URL = config.apiUrl.endsWith('/') 
    ? config.apiUrl.slice(0, -1)  // Remove trailing slash if present
    : config.apiUrl;
});

export class RSVPApiService {
  static async validateInvitation(invitationCode: string): Promise<InvitationValidationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/rsvp/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          error: data.error || 'Invalid invitation code',
        };
      }

      return data;
    } catch (error) {
      console.error('Failed to validate invitation:', error);
      return {
        valid: false,
        error: 'Failed to validate invitation. Please try again.',
      };
    }
  }

  static async getRSVPStatus(invitationCode: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/rsvp/${invitationCode}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get RSVP status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get RSVP status:', error);
      throw error;
    }
  }

  static async submitRSVP(formData: RSVPFormData): Promise<RSVPSubmissionResponse> {
    try {
      // Check if we have plus-ones to use the batch party endpoint
      const hasPlusOnes = formData.plusOnes && formData.plusOnes.length > 0;

      if (hasPlusOnes && formData.attendanceStatus === 'attending') {
        // Use batch party endpoint for party submissions
        const partyPayload = {
          invitationCode: formData.invitationCode,
          primaryGuest: {
            email: formData.email,
            name: formData.guestName,
            phoneNumber: formData.phoneNumber,
            rsvpStatus: formData.attendanceStatus,
            dietaryRestrictions: formData.dietaryRestrictions,
            specialRequests: formData.specialRequests,
            needsTransportation: formData.needsTransportation,
            needsAccommodation: formData.needsAccommodation,
          },
          plusOnes: formData.plusOnes?.map((plusOne) => ({
            id: plusOne.id,
            name: plusOne.name,
            ageGroup: plusOne.ageGroup || 'adult',
            dietaryRestrictions: plusOne.dietaryRestrictions || [],
            specialNeeds: plusOne.specialNeeds,
            mealPreference: plusOne.mealPreference,
          })),
          songRequests: formData.songRequests,
          partyNotes: formData.dietaryNotes,
        };

        const response = await fetch(`${API_BASE_URL}/rsvp/batch-party`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partyPayload),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || 'Failed to submit party RSVP',
          };
        }

        // Extract primary confirmation number from batch response
        return {
          success: true,
          confirmationNumber: data.confirmationNumbers?.primary || data.confirmationNumber,
          message: data.message || 'Party RSVP submitted successfully',
        };
      } else {
        // Use regular endpoint for single guest submissions
        const payload = {
          invitationCode: formData.invitationCode,
          rsvpStatus: formData.attendanceStatus,
          attendeeCount: formData.attendeeCount || 1,
          dietaryRestrictions: formData.dietaryRestrictions,
          dietaryNotes: formData.dietaryNotes,
          specialRequests: formData.specialRequests,
          phoneNumber: formData.phoneNumber,
          emailConfirmation: formData.email,
          needsTransportation: formData.needsTransportation,
          needsAccommodation: formData.needsAccommodation,
          songRequests: formData.songRequests,
        };

        const response = await fetch(`${API_BASE_URL}/rsvp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || 'Failed to submit RSVP',
          };
        }

        return {
          success: true,
          confirmationNumber: data.confirmationNumber,
          message: data.message || 'RSVP submitted successfully',
        };
      }
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      return {
        success: false,
        error: 'Failed to submit RSVP. Please try again.',
      };
    }
  }

  static async updateRSVP(formData: RSVPFormData): Promise<RSVPSubmissionResponse> {
    // For now, updates use the same endpoint as create
    return this.submitRSVP(formData);
  }
}
