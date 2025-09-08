import React from 'react';
import { motion } from 'framer-motion';
import { FormStep } from '../../types/rsvp';
import '../../styles/RSVPForm.css';

interface ProgressIndicatorProps {
  currentStep: FormStep;
  onStepClick?: (step: FormStep) => void;
  completedSteps?: FormStep[];
}

const STEPS: { key: FormStep; label: string; number: number }[] = [
  { key: 'invitation', label: 'Invitation', number: 1 },
  { key: 'personal', label: 'Your Details', number: 2 },
  { key: 'dietary', label: 'Preferences', number: 3 },
  { key: 'review', label: 'Review', number: 4 },
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
}) => {
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="rsvp-progress-indicator">
      <div className="progress-steps">
        {STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = completedSteps.includes(step.key) || index < currentStepIndex;
          const isClickable = onStepClick && (isCompleted || index <= currentStepIndex);

          return (
            <div key={step.key} className="progress-step-container">
              <motion.div
                className={`progress-step ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                } ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && onStepClick && onStepClick(step.key)}
                whileHover={isClickable ? { scale: 1.1 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="step-circle">
                  {isCompleted ? (
                    <svg
                      className="checkmark"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 10L8 14L16 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="step-number">{step.number}</span>
                  )}
                </div>
                <span className="step-label">{step.label}</span>
              </motion.div>
              {index < STEPS.length - 1 && (
                <div className={`progress-line ${index < currentStepIndex ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile progress bar */}
      <div className="mobile-progress-bar">
        <div className="progress-text">
          Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
        </div>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
};
