import { InvitationValidationResponse, RSVPFormData, RSVPSubmissionResponse } from '../types/rsvp';

// Use environment variable or the deployed API URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'https://api.wedding.himnher.dev/production' // Use deployed API for local development
    : 'https://api.wedding.himnher.dev/production');

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
      // Transform form data to match API expectations
      const payload = {
        invitationCode: formData.invitationCode,
        rsvpStatus: formData.attendanceStatus,
        attendeeCount: formData.attendeeCount || 1,
        plusOnes: formData.plusOnes?.map((plusOne) => ({
          name: plusOne.name,
          ageGroup: plusOne.ageGroup,
          dietaryRestrictions: formData.dietaryRestrictions,
        })),
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
