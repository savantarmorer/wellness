import { ValidationResult, DailyAssessment } from '../types';

export const validateAssessment = (assessment: DailyAssessment): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Validate required fields
  if (!assessment.userId) {
    errors.push('User ID is required');
    isValid = false;
  }

  if (!assessment.partnerId) {
    errors.push('Partner ID is required');
    isValid = false;
  }

  if (!assessment.date) {
    errors.push('Date is required');
    isValid = false;
  }

  // Validate mood
  if (!assessment.mood) {
    errors.push('Mood is required');
    isValid = false;
  } else {
    if (!assessment.mood.primary) {
      errors.push('Primary mood is required');
      isValid = false;
    }
    if (typeof assessment.mood.intensity !== 'number' || assessment.mood.intensity < 0 || assessment.mood.intensity > 5) {
      errors.push('Mood intensity must be a number between 0 and 5');
      isValid = false;
    }
  }

  // Validate ratings
  if (!assessment.ratings) {
    errors.push('Ratings are required');
    isValid = false;
  } else {
    const requiredRatings = [
      'satisfacaoGeral',
      'alinhamentoObjetivos',
      'conexaoEmocional',
      'apoioMutuo',
      'segurancaRelacionamento',
      'comunicacao',
      'intimidade',
      'resolucaoConflitos',
      'transparenciaConfianca',
      'intimidadeFisica',
      'saudeMental',
      'autocuidado',
      'gratidao',
      'qualidadeTempo'
    ];

    for (const rating of requiredRatings) {
      if (typeof assessment.ratings[rating] !== 'number' || assessment.ratings[rating] < 0 || assessment.ratings[rating] > 5) {
        errors.push(`${rating} rating must be a number between 0 and 5`);
        isValid = false;
      }
    }
  }

  return {
    isValid,
    errors,
    warnings,
    consistency: {
      default: {
        score: isValid ? 1 : 0,
        confidence: 0.8,
        flags: []
      }
    },
    reliability: isValid ? 1 : 0,
    completeness: isValid ? 1 : 0,
    recommendations: errors.map(error => `Please fix: ${error}`)
  };
};

export const validateAssessmentHistory = (
  userAssessment: DailyAssessment,
  lastAssessment?: DailyAssessment
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Basic validation first
  const basicValidation = validateAssessment(userAssessment);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Check for duplicate assessments
  if (lastAssessment && lastAssessment.date === userAssessment.date) {
    errors.push('An assessment for this date already exists');
    isValid = false;
  }

  // Check for future dates
  const assessmentDate = new Date(userAssessment.date);
  if (assessmentDate > new Date()) {
    errors.push('Assessment date cannot be in the future');
    isValid = false;
  }

  // Check for mood changes
  if (lastAssessment?.mood && userAssessment.mood) {
    const moodChange = Math.abs(lastAssessment.mood.intensity - userAssessment.mood.intensity);
    if (moodChange > 3) {
      warnings.push('Large mood change detected');
    }
  }

  // Check assessment frequency
  if (lastAssessment && lastAssessment.createdAt && userAssessment.createdAt) {
    const timeDiff = new Date(userAssessment.createdAt).getTime() - new Date(lastAssessment.createdAt).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 12) {
      warnings.push('Multiple assessments within 12 hours');
    }
  }

  return {
    isValid,
    errors,
    warnings,
    consistency: {
      default: {
        score: isValid ? 1 : 0,
        confidence: 0.8,
        flags: []
      }
    },
    reliability: isValid ? 1 : 0,
    completeness: isValid ? 1 : 0,
    recommendations: errors.map(error => `Please fix: ${error}`)
  };
}; 