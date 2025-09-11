import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRSVPForm } from '../../contexts/RSVPFormContext';
import { RSVPApiService } from '../../services/rsvpApi';
import { RSVPFormData } from '../../types/rsvp';

export const StepReview: React.FC = () => {
  const { formData, goToStep, prevStep, resetForm } = useRSVPForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await RSVPApiService.submitRSVP(formData as RSVPFormData);

      if (response.success) {
        setSubmitSuccess(true);
        setConfirmationNumber(response.confirmationNumber || null);
        // Clear form data after successful submission
        setTimeout(() => {
          resetForm();
        }, 5000);
      } else {
        setSubmitError(response.error || 'Failed to submit RSVP');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <motion.div
        className="rsvp-form-step success-screen"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="success-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" />
            <path
              d="M25 40L35 50L55 30"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>Thank You!</h2>
        <p className="success-message">Your RSVP has been successfully submitted.</p>
        {confirmationNumber && (
          <div className="confirmation-details">
            <p>Your confirmation number is:</p>
            <p className="confirmation-number">{confirmationNumber}</p>
            <p className="confirmation-note">
              Please save this number for your records. A confirmation email has been sent to{' '}
              <strong>{formData.email}</strong>
            </p>
          </div>
        )}
        <div className="success-actions">
          <button onClick={resetForm} className="btn btn-primary">
            Submit Another RSVP
          </button>
        </div>
      </motion.div>
    );
  }

  const dietaryList = formData.dietaryRestrictions?.map((r) =>
    r.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  );

  return (
    <motion.div
      className="rsvp-form-step review-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Review Your RSVP</h2>
        <p>Please review your information before submitting</p>
      </div>

      <div className="review-sections">
        {/* Guest Information Section */}
        <div className="review-section">
          <div className="section-header">
            <h3>Guest Information</h3>
            <button type="button" onClick={() => goToStep('personal')} className="btn btn-text">
              Edit
            </button>
          </div>
          <div className="review-content">
            <div className="review-item">
              <span className="review-label">Name:</span>
              <span className="review-value">{formData.guestName}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email:</span>
              <span className="review-value">{formData.email}</span>
            </div>
            {formData.phoneNumber && (
              <div className="review-item">
                <span className="review-label">Phone:</span>
                <span className="review-value">{formData.phoneNumber}</span>
              </div>
            )}
            <div className="review-item">
              <span className="review-label">Attendance:</span>
              <span className="review-value attendance-status">
                {formData.attendanceStatus === 'attending' && '✓ Will Attend'}
                {formData.attendanceStatus === 'not_attending' && '✗ Cannot Attend'}
                {formData.attendanceStatus === 'maybe' && '? Maybe'}
              </span>
            </div>
            {formData.attendanceStatus === 'attending' && (
              <>
                <div className="review-item">
                  <span className="review-label">Number of Guests:</span>
                  <span className="review-value">{formData.attendeeCount}</span>
                </div>
                {formData.plusOnes && formData.plusOnes.length > 0 && (
                  <div className="review-item">
                    <span className="review-label">Additional Guests:</span>
                    <div className="plus-ones-review">
                      {formData.plusOnes.map((guest, index) => (
                        <div key={index} className="plus-one-review-card">
                          <div className="plus-one-name">
                            {guest.name} {guest.ageGroup && `(${guest.ageGroup})`}
                          </div>
                          {guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0 && (
                            <div className="plus-one-dietary">
                              <span className="dietary-label">Dietary:</span>
                              {guest.dietaryRestrictions
                                .map((r) =>
                                  r.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                                )
                                .join(', ')}
                            </div>
                          )}
                          {guest.specialNeeds && (
                            <div className="plus-one-special">
                              <span className="special-label">Special needs:</span>
                              {guest.specialNeeds}
                            </div>
                          )}
                          {guest.mealPreference && (
                            <div className="plus-one-meal">
                              <span className="meal-label">Meal preference:</span>
                              {guest.mealPreference}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preferences Section - Only show if attending */}
        {formData.attendanceStatus === 'attending' && (
          <div className="review-section">
            <div className="section-header">
              <h3>Preferences & Requests</h3>
              <button type="button" onClick={() => goToStep('dietary')} className="btn btn-text">
                Edit
              </button>
            </div>
            <div className="review-content">
              {dietaryList && dietaryList.length > 0 && (
                <div className="review-item">
                  <span className="review-label">Dietary Restrictions:</span>
                  <ul className="review-list">
                    {dietaryList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formData.dietaryNotes && (
                <div className="review-item">
                  <span className="review-label">Dietary Notes:</span>
                  <span className="review-value">{formData.dietaryNotes}</span>
                </div>
              )}
              {formData.specialRequests && (
                <div className="review-item">
                  <span className="review-label">Special Requests:</span>
                  <span className="review-value">{formData.specialRequests}</span>
                </div>
              )}
              {(formData.needsTransportation || formData.needsAccommodation) && (
                <div className="review-item">
                  <span className="review-label">Additional Needs:</span>
                  <ul className="review-list">
                    {formData.needsTransportation && <li>Transportation assistance needed</li>}
                    {formData.needsAccommodation && <li>Accommodation assistance needed</li>}
                  </ul>
                </div>
              )}
              {formData.songRequests && (
                <div className="review-item">
                  <span className="review-label">Song Requests:</span>
                  <span className="review-value">{formData.songRequests}</span>
                </div>
              )}
              {!dietaryList?.length &&
                !formData.dietaryNotes &&
                !formData.specialRequests &&
                !formData.needsTransportation &&
                !formData.needsAccommodation &&
                !formData.songRequests && (
                  <p className="no-preferences">No special preferences or requests</p>
                )}
            </div>
          </div>
        )}
      </div>

      {submitError && (
        <div className="error-banner">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 6V10M10 14H10.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {submitError}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn btn-primary btn-submit"
        >
          {isSubmitting ? (
            <>
              <span className="spinner" />
              Submitting...
            </>
          ) : (
            'Submit RSVP'
          )}
        </button>
      </div>
    </motion.div>
  );
};
