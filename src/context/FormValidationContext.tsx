import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FormValidation, FormError } from '../types';

interface FormValidationContextType {
  validationState: Record<string, FormValidation>;
  validationErrors: Record<string, FormError>;
  setFormValidation: (formId: string, validation: FormValidation) => void;
  setFormError: (formId: string, error: FormError) => void;
  clearFormValidation: (formId: string) => void;
  clearFormError: (formId: string) => void;
  clearAll: () => void;
  getFormValidation: (formId: string) => FormValidation | undefined;
  getFormError: (formId: string) => FormError | undefined;
}

const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export const useFormValidation = () => {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within a FormValidationProvider');
  }
  return context;
};

export const FormValidationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [validationState, setValidationState] = useState<Record<string, FormValidation>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, FormError>>({});

  const setFormValidation = useCallback((formId: string, validation: FormValidation) => {
    setValidationState(prev => ({
      ...prev,
      [formId]: validation
    }));
  }, []);

  const setFormError = useCallback((formId: string, error: FormError) => {
    setValidationErrors(prev => ({
      ...prev,
      [formId]: error
    }));
  }, []);

  const clearFormValidation = useCallback((formId: string) => {
    setValidationState(prev => {
      const newState = { ...prev };
      delete newState[formId];
      return newState;
    });
  }, []);

  const clearFormError = useCallback((formId: string) => {
    setValidationErrors(prev => {
      const newState = { ...prev };
      delete newState[formId];
      return newState;
    });
  }, []);

  const clearAll = useCallback(() => {
    setValidationState({});
    setValidationErrors({});
  }, []);

  const getFormValidation = useCallback((formId: string) => {
    return validationState[formId];
  }, [validationState]);

  const getFormError = useCallback((formId: string) => {
    return validationErrors[formId];
  }, [validationErrors]);

  return (
    <FormValidationContext.Provider
      value={{
        validationState,
        validationErrors,
        setFormValidation,
        setFormError,
        clearFormValidation,
        clearFormError,
        clearAll,
        getFormValidation,
        getFormError
      }}
    >
      {children}
    </FormValidationContext.Provider>
  );
}; 