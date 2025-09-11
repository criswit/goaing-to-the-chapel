import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { PersonalInfoData } from '../../types/rsvp';

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
  { value: 'other', label: 'Other' },
];

interface PlusOneFieldsProps {
  index: number;
  register: UseFormRegister<PersonalInfoData>;
  watch: UseFormWatch<PersonalInfoData>;
  errors: FieldErrors<PersonalInfoData>;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export const PlusOneFields: React.FC<PlusOneFieldsProps> = ({
  index,
  register,
  watch,
  errors,
  onRemove,
  showRemoveButton = false,
}) => {
  const [showDietaryOptions, setShowDietaryOptions] = React.useState(false);
  const dietaryRestrictions = watch(`plusOnes.${index}.dietaryRestrictions`);
  const showSpecialNeeds = dietaryRestrictions?.includes('other');

  return (
    <motion.div
      className="plus-one-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="plus-one-header">
        <h4>Guest {index + 2}</h4>
        {showRemoveButton && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-remove-guest"
            aria-label={`Remove guest ${index + 2}`}
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group flex-grow">
          <label htmlFor={`plusOnes.${index}.name`}>Full Name *</label>
          <input
            {...register(`plusOnes.${index}.name` as const)}
            id={`plusOnes.${index}.name`}
            type="text"
            placeholder="Guest's full name"
            className={`form-input ${errors.plusOnes?.[index]?.name ? 'error' : ''}`}
          />
          {errors.plusOnes?.[index]?.name && (
            <span className="error-message">{errors.plusOnes[index]?.name?.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`plusOnes.${index}.ageGroup`}>Age Group</label>
          <select
            {...register(`plusOnes.${index}.ageGroup` as const)}
            id={`plusOnes.${index}.ageGroup`}
            className="form-input"
          >
            <option value="adult">Adult</option>
            <option value="child">Child (2-12)</option>
            <option value="infant">Infant (0-2)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <button
          type="button"
          onClick={() => setShowDietaryOptions(!showDietaryOptions)}
          className="btn-toggle-dietary"
        >
          {showDietaryOptions ? '−' : '+'} Dietary Restrictions & Special Needs
        </button>
      </div>

      <AnimatePresence>
        {showDietaryOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="dietary-section"
          >
            <div className="form-group">
              <label>Dietary Restrictions for {watch(`plusOnes.${index}.name`) || 'Guest'}</label>
              <div className="checkbox-grid compact">
                {DIETARY_OPTIONS.map((option) => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={option.value}
                      {...register(`plusOnes.${index}.dietaryRestrictions` as const)}
                    />
                    <span className="checkbox-text">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {showSpecialNeeds && (
              <motion.div
                className="form-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label htmlFor={`plusOnes.${index}.specialNeeds`}>
                  Please specify dietary needs or allergies
                </label>
                <textarea
                  {...register(`plusOnes.${index}.specialNeeds` as const)}
                  id={`plusOnes.${index}.specialNeeds`}
                  rows={2}
                  placeholder="Please describe any specific dietary requirements or allergies..."
                  className={`form-input ${errors.plusOnes?.[index]?.specialNeeds ? 'error' : ''}`}
                />
                {errors.plusOnes?.[index]?.specialNeeds && (
                  <span className="error-message">
                    {errors.plusOnes[index]?.specialNeeds?.message}
                  </span>
                )}
              </motion.div>
            )}

            <div className="form-group">
              <label htmlFor={`plusOnes.${index}.mealPreference`}>Meal Preference (Optional)</label>
              <input
                {...register(`plusOnes.${index}.mealPreference` as const)}
                id={`plusOnes.${index}.mealPreference`}
                type="text"
                placeholder="e.g., Chicken, Fish, Vegetarian entrée"
                className={`form-input ${errors.plusOnes?.[index]?.mealPreference ? 'error' : ''}`}
              />
              {errors.plusOnes?.[index]?.mealPreference && (
                <span className="error-message">
                  {errors.plusOnes[index]?.mealPreference?.message}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
