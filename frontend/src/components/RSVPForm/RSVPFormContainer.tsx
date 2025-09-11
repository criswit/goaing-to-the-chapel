import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { RSVPFormProvider, useRSVPForm } from '../../contexts/RSVPFormContext';
import { FormStep } from '../../types/rsvp';
import { ProgressIndicator } from './ProgressIndicator';
import { StepInvitation } from './StepInvitation';
import { StepPersonal } from './StepPersonal';
import { StepDietary } from './StepDietary';
import { StepReview } from './StepReview';
import '../../styles/RSVPForm.css';
import '../../styles/PlusOneForm.css';

const RSVPFormContent: React.FC = () => {
  const { currentStep, goToStep, formData } = useRSVPForm();

  // Determine which steps are completed based on form data
  const completedSteps: FormStep[] = [];
  if (formData.invitationCode) completedSteps.push('invitation');
  if (formData.guestName && formData.email && formData.attendanceStatus) {
    completedSteps.push('personal');
  }
  if (
    formData.attendanceStatus === 'not_attending' ||
    (formData.attendanceStatus === 'attending' && currentStep !== 'dietary')
  ) {
    completedSteps.push('dietary');
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'invitation':
        return <StepInvitation key="invitation" />;
      case 'personal':
        return <StepPersonal key="personal" />;
      case 'dietary':
        return <StepDietary key="dietary" />;
      case 'review':
        return <StepReview key="review" />;
      default:
        return <StepInvitation key="invitation" />;
    }
  };

  return (
    <div className="rsvp-form-container">
      <ProgressIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      <div className="rsvp-form-content">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>
    </div>
  );
};

export const RSVPFormContainer: React.FC = () => {
  return (
    <RSVPFormProvider>
      <RSVPFormContent />
    </RSVPFormProvider>
  );
};
