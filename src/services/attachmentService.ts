import { DailyAssessment, AttachmentStyle, ValidatedScaleAssessmentData } from '../types';

interface AttachmentAnalysisResult {
  primary: AttachmentStyle;
  description: string;
  recommendations: string[];
}

export async function analyzeAttachmentStyle(
  userAssessment: DailyAssessment | ValidatedScaleAssessmentData,
  partnerAssessment: DailyAssessment | ValidatedScaleAssessmentData
): Promise<AttachmentAnalysisResult> {
  // Calculate attachment style based on assessment scores
  const {
    segurancaRelacionamento,
    conexaoEmocional,
    apoioMutuo,
    transparenciaConfianca
  } = userAssessment.ratings;

  let primary: AttachmentStyle = {
    primary: 'secure',
    description: 'Secure attachment style',
    recommendations: ['Continue fostering trust and open communication']
  };
  let description = '';
  let recommendations: string[] = [];

  const securityScore = segurancaRelacionamento || 0;
  const emotionalScore = conexaoEmocional || 0;
  const supportScore = apoioMutuo || 0;
  const trustScore = transparenciaConfianca || 0;

  const averageScore = (securityScore + emotionalScore + supportScore + trustScore) / 4;

  if (averageScore >= 7) {
    primary = {
      primary: 'secure',
      description: 'Secure attachment style',
      recommendations: ['Continue fostering trust and open communication']
    };
    description = 'Demonstra um padrão de apego seguro, com boa capacidade de conexão e confiança.';
    recommendations = [
      'Continue cultivating the open and honest communication',
      'Maintain the balance between independence and intimacy',
      'Celebrate significant connection moments'
    ];
  } else if (trustScore < 5 || supportScore < 5) {
    primary = {
      primary: 'avoidant',
      description: 'Avoidant attachment style',
      recommendations: ['Work on building trust and emotional intimacy']
    };
    description = 'Apresenta tendências de apego evitativo, com possível dificuldade em confiar e receber apoio.';
    recommendations = [
      'Pratique a vulnerabilidade em pequenos passos',
      'Comunique suas necessidades de espaço de forma clara',
      'Desenvolva estratégias para lidar com a intimidade emocional'
    ];
  } else if (securityScore < 5 || emotionalScore < 5) {
    primary = {
      primary: 'anxious',
      description: 'Anxious attachment style',
      recommendations: ['Focus on building self-confidence and independence']
    };
    description = 'Demonstra padrões de apego ansioso, com necessidade de reasseguramento frequente.';
    recommendations = [
      'Desenvolva práticas de auto-regulação emocional',
      'Trabalhe na construção de autoconfiança',
      'Estabeleça limites saudáveis na relação'
    ];
  } else {
    primary = {
      primary: 'disorganized',
      description: 'Disorganized attachment style',
      recommendations: ['Seek professional support to establish secure patterns']
    };
    description = 'Apresenta padrões mistos de apego, que podem variar conforme o contexto.';
    recommendations = [
      'Busque consistência nas interações',
      'Desenvolva estratégias de auto-conhecimento',
      'Considere apoio terapêutico para explorar padrões'
    ];
  }

  return {
    primary,
    description,
    recommendations
  };
} 