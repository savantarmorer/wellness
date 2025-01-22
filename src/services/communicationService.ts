import { DailyAssessment, CommunicationPatterns } from '../types';
import { v4 as uuidv4 } from 'uuid';

const COMMUNICATION_THRESHOLDS = {
  QUALITY: {
    LOW: 3,
    MEDIUM: 6,
    HIGH: 8
  },
  FREQUENCY: {
    LOW: 3,
    MEDIUM: 6,
    HIGH: 8
  },
  DEPTH: {
    LOW: 3,
    MEDIUM: 6,
    HIGH: 8
  }
};

const COMMUNICATION_STYLES = {
  ASSERTIVE: 'assertive',
  PASSIVE: 'passive',
  AGGRESSIVE: 'aggressive',
  PASSIVE_AGGRESSIVE: 'passive-aggressive'
} as const;

interface CommunicationMetrics {
  quality: number;
  frequency: number;
  depth: number;
  transparency: number;
  conflict: number;
}

export const analyzeCommunicationPatterns = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment
): Promise<CommunicationPatterns> => {
  // Extract communication-related ratings with proper null checks
  const userComm: CommunicationMetrics = {
    quality: userAssessment.ratings?.comunicacao ?? 0,
    frequency: userAssessment.ratings?.comunicacao ?? 0,
    depth: userAssessment.ratings?.conexaoEmocional ?? 0,
    transparency: userAssessment.ratings?.transparenciaConfianca ?? 0,
    conflict: userAssessment.ratings?.resolucaoConflitos ?? 0
  };

  const partnerComm: CommunicationMetrics = {
    quality: partnerAssessment.ratings?.comunicacao ?? 0,
    frequency: partnerAssessment.ratings?.comunicacao ?? 0,
    depth: partnerAssessment.ratings?.conexaoEmocional ?? 0,
    transparency: partnerAssessment.ratings?.transparenciaConfianca ?? 0,
    conflict: partnerAssessment.ratings?.resolucaoConflitos ?? 0
  };

  // Check if we have valid data
  const hasValidData = Object.values(userComm).some(val => val > 0) && 
                      Object.values(partnerComm).some(val => val > 0);
  
  if (!hasValidData) {
    return {
      style: 'assertive',
      effectiveness: 0,
      patterns: ['Dados insuficientes para análise'],
      confidence: 0
    };
  }

  // Calculate average metrics with weighted importance
  const weights = {
    quality: 0.3,      // Communication quality is most important
    frequency: 0.15,   // Frequency of communication
    depth: 0.2,        // Depth of conversations
    transparency: 0.2, // Transparency and trust
    conflict: 0.15     // Conflict resolution
  };

  const averageMetrics: CommunicationMetrics = {
    quality: ((userComm.quality * weights.quality) + (partnerComm.quality * weights.quality)) / 2,
    frequency: ((userComm.frequency * weights.frequency) + (partnerComm.frequency * weights.frequency)) / 2,
    depth: ((userComm.depth * weights.depth) + (partnerComm.depth * weights.depth)) / 2,
    transparency: ((userComm.transparency * weights.transparency) + (partnerComm.transparency * weights.transparency)) / 2,
    conflict: ((userComm.conflict * weights.conflict) + (partnerComm.conflict * weights.conflict)) / 2
  };

  // Determine communication style based on weighted metrics
  const style = determineCommunicationStyle(averageMetrics);

  // Calculate effectiveness with weighted metrics
  const effectiveness = calculateCommunicationEffectiveness(averageMetrics);

  // Identify patterns with significance levels
  const patterns = identifyCommunicationPatterns(userComm, partnerComm);

  // Calculate confidence based on data completeness and consistency
  const confidence = calculateConfidence(userComm, partnerComm);

  return {
    style,
    effectiveness,
    patterns,
    confidence
  };
};

const determineCommunicationStyle = (metrics: {
  quality: number;
  frequency: number;
  depth: number;
  transparency: number;
  conflict: number;
}): typeof COMMUNICATION_STYLES[keyof typeof COMMUNICATION_STYLES] => {
  const { quality, transparency, conflict } = metrics;

  if (quality >= COMMUNICATION_THRESHOLDS.QUALITY.HIGH && 
      transparency >= COMMUNICATION_THRESHOLDS.QUALITY.HIGH) {
    return COMMUNICATION_STYLES.ASSERTIVE;
  }

  if (conflict >= COMMUNICATION_THRESHOLDS.QUALITY.HIGH && 
      transparency <= COMMUNICATION_THRESHOLDS.QUALITY.LOW) {
    return COMMUNICATION_STYLES.AGGRESSIVE;
  }

  if (quality <= COMMUNICATION_THRESHOLDS.QUALITY.LOW && 
      transparency <= COMMUNICATION_THRESHOLDS.QUALITY.LOW) {
    return COMMUNICATION_STYLES.PASSIVE;
  }

  if (conflict >= COMMUNICATION_THRESHOLDS.QUALITY.MEDIUM && 
      transparency <= COMMUNICATION_THRESHOLDS.QUALITY.MEDIUM) {
    return COMMUNICATION_STYLES.PASSIVE_AGGRESSIVE;
  }

  return COMMUNICATION_STYLES.ASSERTIVE;
};

const calculateCommunicationEffectiveness = (metrics: {
  quality: number;
  frequency: number;
  depth: number;
  transparency: number;
  conflict: number;
}): number => {
  const weights = {
    quality: 0.3,
    frequency: 0.2,
    depth: 0.2,
    transparency: 0.2,
    conflict: 0.1
  };

  return Object.entries(metrics).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights]);
  }, 0) / 10; // Normalize to 0-1 range
};

const identifyCommunicationPatterns = (
  userComm: CommunicationMetrics,
  partnerComm: CommunicationMetrics
): string[] => {
  const patterns: string[] = [];
  const THRESHOLDS = {
    DISCREPANCY: 3,
    LOW: 3,
    MEDIUM: 6,
    HIGH: 8
  };

  // Check for communication quality discrepancy
  const qualityDiff = Math.abs(userComm.quality - partnerComm.quality);
  if (qualityDiff >= THRESHOLDS.DISCREPANCY) {
    patterns.push(`Percepção divergente da qualidade da comunicação (diferença: ${qualityDiff.toFixed(1)})`);
  }

  // Check for depth/superficiality pattern
  const avgDepth = (userComm.depth + partnerComm.depth) / 2;
  if (avgDepth < THRESHOLDS.MEDIUM) {
    patterns.push('Comunicação tendendo ao superficial');
  } else if (avgDepth >= THRESHOLDS.HIGH) {
    patterns.push('Comunicação profunda e significativa');
  }

  // Check for transparency issues
  const avgTransparency = (userComm.transparency + partnerComm.transparency) / 2;
  if (avgTransparency < THRESHOLDS.MEDIUM) {
    patterns.push('Oportunidade de melhorar a transparência');
  } else if (avgTransparency >= THRESHOLDS.HIGH) {
    patterns.push('Alto nível de transparência e confiança');
  }

  // Check for conflict resolution patterns
  const avgConflict = (userComm.conflict + partnerComm.conflict) / 2;
  if (avgConflict < THRESHOLDS.MEDIUM) {
    patterns.push('Dificuldade na resolução de conflitos');
  } else if (avgConflict >= THRESHOLDS.HIGH) {
    patterns.push('Boa capacidade de resolução de conflitos');
  }

  // Check for frequency patterns
  const avgFrequency = (userComm.frequency + partnerComm.frequency) / 2;
  if (avgFrequency < THRESHOLDS.MEDIUM) {
    patterns.push('Frequência de comunicação abaixo do ideal');
  } else if (avgFrequency >= THRESHOLDS.HIGH) {
    patterns.push('Comunicação frequente e consistente');
  }

  return patterns;
};

const calculateConfidence = (userComm: CommunicationMetrics, partnerComm: CommunicationMetrics): number => {
  // Check data completeness
  const userComplete = Object.values(userComm).filter((v: number) => v > 0).length / Object.values(userComm).length;
  const partnerComplete = Object.values(partnerComm).filter((v: number) => v > 0).length / Object.values(partnerComm).length;
  
  // Check consistency between partners
  const differences = Object.keys(userComm).map(key => 
    Math.abs(userComm[key as keyof CommunicationMetrics] - partnerComm[key as keyof CommunicationMetrics])
  );
  const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  
  // Calculate final confidence score
  const completenessScore = (userComplete + partnerComplete) / 2;
  const consistencyScore = Math.max(0, 1 - (avgDifference / 10));
  
  return Math.min(1, (completenessScore * 0.6) + (consistencyScore * 0.4));
}; 