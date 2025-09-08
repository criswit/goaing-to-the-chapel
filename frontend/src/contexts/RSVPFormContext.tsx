import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RSVPFormData, GuestInfo, FormStep, RSVPFormContextType } from '../types/rsvp';

const RSVPFormContext = createContext<RSVPFormContextType | undefined>(undefined);

const FORM_STEPS: FormStep[] = ['invitation', 'personal', 'dietary', 'review'];
const STORAGE_KEY = 'wedding-rsvp-form-data';

interface RSVPFormProviderProps {
  children: ReactNode;
}

export const RSVPFormProvider: React.FC<RSVPFormProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('invitation');
  const [formData, setFormData] = useState<Partial<RSVPFormData>>({});
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.guestInfo) {
          setGuestInfo(parsed.guestInfo);
        }
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      formData,
      guestInfo,
      currentStep,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, guestInfo, currentStep]);

  const updateFormData = (data: Partial<RSVPFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    const currentIndex = FORM_STEPS.indexOf(currentStep);
    if (currentIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = FORM_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(FORM_STEPS[currentIndex - 1]);
    }
  };

  const goToStep = (step: FormStep) => {
    setCurrentStep(step);
  };

  const resetForm = () => {
    setFormData({});
    setGuestInfo(null);
    setCurrentStep('invitation');
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: RSVPFormContextType = {
    currentStep,
    formData,
    guestInfo,
    updateFormData,
    setGuestInfo,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
  };

  return <RSVPFormContext.Provider value={value}>{children}</RSVPFormContext.Provider>;
};

export const useRSVPForm = () => {
  const context = useContext(RSVPFormContext);
  if (!context) {
    throw new Error('useRSVPForm must be used within an RSVPFormProvider');
  }
  return context;
};
