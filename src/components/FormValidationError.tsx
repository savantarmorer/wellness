import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import type { FormValidation, FormError } from '../types';
import { useFormValidation } from '../context/FormValidationContext';

interface Props {
  formId: string;
  field?: string;
  showWarnings?: boolean;
}

export const FormValidationError: React.FC<Props> = ({ formId, field, showWarnings = true }) => {
  const { getFormValidation, getFormError } = useFormValidation();
  const validation = getFormValidation(formId);
  const error = getFormError(formId);

  if (!validation && !error) {
    return null;
  }

  const renderValidationErrors = (validation: FormValidation) => {
    if (!validation.errors || Object.keys(validation.errors).length === 0) {
      return null;
    }

    const errors = field 
      ? { [field]: validation.errors[field] }
      : validation.errors;

    return Object.entries(errors).map(([key, message]) => (
      message && (
        <Alert severity="error" key={key} sx={{ mb: 1 }}>
          <AlertTitle>{key}</AlertTitle>
          {message}
        </Alert>
      )
    ));
  };

  const renderValidationWarnings = (validation: FormValidation) => {
    if (!showWarnings || !validation.warnings || validation.warnings.length === 0) {
      return null;
    }

    return validation.warnings.map((warning, index) => (
      <Alert severity="warning" key={index} sx={{ mb: 1 }}>
        {warning}
      </Alert>
    ));
  };

  const renderFormError = (error: FormError) => {
    return (
      <Alert severity="error" sx={{ mb: 1 }}>
        <AlertTitle>{error.operation || 'Error'}</AlertTitle>
        {error.message}
        {error.details && (
          <Box component="pre" sx={{ mt: 1, fontSize: '0.8em', whiteSpace: 'pre-wrap' }}>
            {error.details}
          </Box>
        )}
      </Alert>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      {validation && (
        <>
          {renderValidationErrors(validation)}
          {renderValidationWarnings(validation)}
        </>
      )}
      {error && renderFormError(error)}
    </Box>
  );
}; 