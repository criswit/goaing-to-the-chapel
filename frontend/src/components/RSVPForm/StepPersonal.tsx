import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalInfoSchema, PersonalInfoData } from '../../types/rsvp';
import { useRSVPForm } from '../../contexts/RSVPFormContext';
import { PlusOneFields } from './PlusOneFields';

export const StepPersonal: React.FC = () => {
  const { formData, guestInfo, updateFormData, nextStep, prevStep } = useRSVPForm();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      guestName: formData.guestName || guestInfo?.name || '',
      email: formData.email || guestInfo?.email || '',
      phoneNumber: formData.phoneNumber || '',
      attendanceStatus: formData.attendanceStatus || 'attending',
      attendeeCount: formData.attendeeCount || 1,
      plusOnes: formData.plusOnes || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plusOnes',
  });

  const attendanceStatus = watch('attendanceStatus');
  const attendeeCount = watch('attendeeCount');

  // Update plus ones when attendee count changes
  useEffect(() => {
    if (attendanceStatus === 'attending') {
      const expectedPlusOnes = Math.max(0, (attendeeCount || 1) - 1);
      const currentPlusOnes = fields.length;

      if (expectedPlusOnes > currentPlusOnes) {
        // Add more plus one fields
        for (let i = currentPlusOnes; i < expectedPlusOnes; i++) {
          append({
            name: '',
            ageGroup: 'adult',
            dietaryRestrictions: [],
            specialNeeds: '',
            mealPreference: '',
          });
        }
      } else if (expectedPlusOnes < currentPlusOnes) {
        // Remove excess plus one fields
        for (let i = currentPlusOnes - 1; i >= expectedPlusOnes; i--) {
          remove(i);
        }
      }
    } else {
      // Clear plus ones if not attending
      if (fields.length > 0) {
        fields.forEach((_, index) => remove(index));
      }
      setValue('attendeeCount', 0);
    }
  }, [attendeeCount, attendanceStatus, fields, append, remove, setValue]);

  const onSubmit = (data: PersonalInfoData) => {
    updateFormData(data);
    nextStep();
  };

  const maxPlusOnes = guestInfo?.plusOnesAllowed || 5;

  return (
    <motion.div
      className="rsvp-form-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Your Information</h2>
        <p>Please confirm your details and let us know if you'll be joining us</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="guestName">Your Name *</label>
            <input
              {...register('guestName')}
              id="guestName"
              type="text"
              placeholder="Full name"
              className={`form-input ${errors.guestName ? 'error' : ''}`}
            />
            {errors.guestName && <span className="error-message">{errors.guestName.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="your@email.com"
              className={`form-input ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            {...register('phoneNumber')}
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
          />
          {errors.phoneNumber && (
            <span className="error-message">{String(errors.phoneNumber.message)}</span>
          )}
        </div>

        <div className="form-group">
          <label>Will you be attending? *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input {...register('attendanceStatus')} type="radio" value="attending" />
              <span className="radio-text">Yes, I'll be there!</span>
            </label>
            <label className="radio-label">
              <input {...register('attendanceStatus')} type="radio" value="not_attending" />
              <span className="radio-text">Sorry, I can't make it</span>
            </label>
            <label className="radio-label">
              <input {...register('attendanceStatus')} type="radio" value="maybe" />
              <span className="radio-text">Not sure yet</span>
            </label>
          </div>
          {errors.attendanceStatus && (
            <span className="error-message">{String(errors.attendanceStatus.message)}</span>
          )}
        </div>

        <AnimatePresence>
          {attendanceStatus === 'attending' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="attendeeCount">Total number of guests (including yourself) *</label>
                <select
                  {...register('attendeeCount', { valueAsNumber: true })}
                  id="attendeeCount"
                  className={`form-input ${errors.attendeeCount ? 'error' : ''}`}
                >
                  {[...Array(maxPlusOnes + 1)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
                {errors.attendeeCount && (
                  <span className="error-message">{errors.attendeeCount.message}</span>
                )}
              </div>

              {fields.length > 0 && (
                <div className="plus-ones-section">
                  <h3>Guest Information</h3>
                  <p className="section-description">
                    Please provide information for your additional guests. You can optionally add
                    dietary restrictions and special needs for each guest.
                  </p>
                  {fields.map((field, index) => (
                    <PlusOneFields
                      key={field.id}
                      index={index}
                      register={register}
                      watch={watch}
                      errors={errors}
                      onRemove={() => remove(index)}
                      showRemoveButton={fields.length > 1 && index === fields.length - 1}
                    />
                  ))}
                  {fields.length < maxPlusOnes && (
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          name: '',
                          ageGroup: 'adult',
                          dietaryRestrictions: [],
                          specialNeeds: '',
                          mealPreference: '',
                        })
                      }
                      className="btn btn-add-guest"
                    >
                      + Add Another Guest
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="form-actions">
          <button type="button" onClick={prevStep} className="btn btn-secondary">
            Back
          </button>
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </div>
      </form>
    </motion.div>
  );
};
