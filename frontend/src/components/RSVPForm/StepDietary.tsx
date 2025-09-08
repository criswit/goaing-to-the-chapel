import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { DietaryInfoSchema, DietaryInfoData } from '../../types/rsvp';
import { useRSVPForm } from '../../contexts/RSVPFormContext';

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'nut_allergy', label: 'Nut Allergy' },
  { value: 'shellfish_allergy', label: 'Shellfish Allergy' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'no_beef', label: 'No Beef' },
  { value: 'no_pork', label: 'No Pork' },
  { value: 'other', label: 'Other (please specify below)' },
];

export const StepDietary: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useRSVPForm();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DietaryInfoData>({
    resolver: zodResolver(DietaryInfoSchema),
    defaultValues: {
      dietaryRestrictions: formData.dietaryRestrictions || [],
      dietaryNotes: formData.dietaryNotes || '',
      specialRequests: formData.specialRequests || '',
      needsTransportation: formData.needsTransportation || false,
      needsAccommodation: formData.needsAccommodation || false,
      songRequests: formData.songRequests || '',
    },
  });

  const dietaryRestrictions = watch('dietaryRestrictions');
  const showDietaryNotes = dietaryRestrictions?.includes('other');

  const onSubmit = (data: DietaryInfoData) => {
    updateFormData(data);
    nextStep();
  };

  const handleSkip = React.useCallback(() => {
    // Save empty/default values and proceed
    updateFormData({
      dietaryRestrictions: [],
      dietaryNotes: '',
      specialRequests: '',
      needsTransportation: false,
      needsAccommodation: false,
      songRequests: '',
    });
    nextStep();
  }, [updateFormData, nextStep]);

  // Skip this step if not attending
  React.useEffect(() => {
    if (formData.attendanceStatus === 'not_attending') {
      handleSkip();
    }
  }, [formData.attendanceStatus, handleSkip]);

  if (formData.attendanceStatus === 'not_attending') {
    return null;
  }

  return (
    <motion.div
      className="rsvp-form-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Preferences & Special Requests</h2>
        <p>Help us make your experience perfect</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form">
        <div className="form-group">
          <label>Dietary Restrictions</label>
          <p className="field-description">Please select all that apply to your party</p>
          <div className="checkbox-grid">
            {DIETARY_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox-label">
                <input type="checkbox" value={option.value} {...register('dietaryRestrictions')} />
                <span className="checkbox-text">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {showDietaryNotes && (
          <motion.div
            className="form-group"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label htmlFor="dietaryNotes">Please specify other dietary requirements</label>
            <textarea
              {...register('dietaryNotes')}
              id="dietaryNotes"
              rows={3}
              placeholder="Please describe any other dietary requirements..."
              className={`form-input ${errors.dietaryNotes ? 'error' : ''}`}
            />
            {errors.dietaryNotes && (
              <span className="error-message">{errors.dietaryNotes.message}</span>
            )}
          </motion.div>
        )}

        <div className="form-group">
          <label>Additional Needs</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" {...register('needsTransportation')} />
              <span className="checkbox-text">
                I need assistance with transportation to/from the venue
              </span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" {...register('needsAccommodation')} />
              <span className="checkbox-text">I need help finding accommodation</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="specialRequests">Special Requests or Accessibility Requirements</label>
          <textarea
            {...register('specialRequests')}
            id="specialRequests"
            rows={3}
            placeholder="Let us know if you have any special requirements or accessibility needs..."
            className={`form-input ${errors.specialRequests ? 'error' : ''}`}
          />
          {errors.specialRequests && (
            <span className="error-message">{errors.specialRequests.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="songRequests">Song Requests</label>
          <p className="field-description">What songs would get you on the dance floor?</p>
          <textarea
            {...register('songRequests')}
            id="songRequests"
            rows={2}
            placeholder="Artist - Song Title"
            className={`form-input ${errors.songRequests ? 'error' : ''}`}
          />
          {errors.songRequests && (
            <span className="error-message">{errors.songRequests.message}</span>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={prevStep} className="btn btn-secondary">
            Back
          </button>
          <button type="button" onClick={handleSkip} className="btn btn-ghost">
            Skip This Step
          </button>
          <button type="submit" className="btn btn-primary">
            Continue to Review
          </button>
        </div>
      </form>
    </motion.div>
  );
};
