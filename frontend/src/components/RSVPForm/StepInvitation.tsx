import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { InvitationCodeSchema, InvitationCodeData } from '../../types/rsvp';
import { useRSVPForm } from '../../contexts/RSVPFormContext';
import { RSVPApiService } from '../../services/rsvpApi';

export const StepInvitation: React.FC = () => {
  const { formData, updateFormData, setGuestInfo, nextStep } = useRSVPForm();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<InvitationCodeData>({
    resolver: zodResolver(InvitationCodeSchema),
    defaultValues: {
      invitationCode: formData.invitationCode || '',
    },
  });

  const onSubmit = async (data: InvitationCodeData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await RSVPApiService.validateInvitation(data.invitationCode);

      if (response.valid && response.guestInfo) {
        updateFormData(data);
        setGuestInfo(response.guestInfo);

        // Pre-fill guest name and email if available
        updateFormData({
          guestName: response.guestInfo.name,
          email: response.guestInfo.email,
        });

        nextStep();
      } else {
        setError('invitationCode', {
          type: 'manual',
          message: response.error || 'Invalid invitation code',
        });
      }
    } catch (error) {
      setApiError('Unable to validate invitation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="rsvp-form-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Welcome!</h2>
        <p>Please enter your invitation code to begin your RSVP</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form">
        <div className="form-group">
          <label htmlFor="invitationCode">Invitation Code</label>
          <input
            {...register('invitationCode')}
            id="invitationCode"
            type="text"
            placeholder="Enter your invitation code"
            className={`form-input ${errors.invitationCode ? 'error' : ''}`}
            disabled={isLoading}
            autoComplete="off"
            autoFocus
          />
          {errors.invitationCode && (
            <span className="error-message">{errors.invitationCode.message}</span>
          )}
        </div>

        {apiError && (
          <div className="api-error-message">
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
            {apiError}
          </div>
        )}

        <div className="form-help">
          <p>Your invitation code can be found on your wedding invitation card.</p>
          <p>If you're having trouble, please contact us for assistance.</p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" />
                Validating...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
