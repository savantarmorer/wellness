import { DailyAssessment, ValidatedScaleAssessmentData } from '../types';

type AttachmentStyleType = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

interface AttachmentAnalysisResult {
  primary: AttachmentStyleType;
  description: string;
  recommendations: string[];
}

export async function analyzeAttachmentStyle(
  userAssessment: DailyAssessment | ValidatedScaleAssessmentData,
  partnerAssessment: DailyAssessment | ValidatedScaleAssessmentData
): Promise<AttachmentAnalysisResult> {
  // Calculate attachment style based on both assessments
  const {
    segurancaRelacionamento: userSecurity,
    conexaoEmocional: userEmotional,
    apoioMutuo: userSupport,
    transparenciaConfianca: userTrust
  } = userAssessment.ratings;

  const {
    segurancaRelacionamento: partnerSecurity,
    conexaoEmocional: partnerEmotional,
    apoioMutuo: partnerSupport,
    transparenciaConfianca: partnerTrust
  } = partnerAssessment.ratings;

  let primary: AttachmentStyleType = 'secure';
  let description = '';
  let recommendations: string[] = [];

  // Calculate individual scores
  const userSecurityScore = userSecurity || 0;
  const userEmotionalScore = userEmotional || 0;
  const userSupportScore = userSupport || 0;
  const userTrustScore = userTrust || 0;

  const partnerSecurityScore = partnerSecurity || 0;
  const partnerEmotionalScore = partnerEmotional || 0;
  const partnerSupportScore = partnerSupport || 0;
  const partnerTrustScore = partnerTrust || 0;

  // Calculate combined scores considering both partners
  const averageSecurityScore = (userSecurityScore + partnerSecurityScore) / 2;
  const averageEmotionalScore = (userEmotionalScore + partnerEmotionalScore) / 2;
  const averageSupportScore = (userSupportScore + partnerSupportScore) / 2;
  const averageTrustScore = (userTrustScore + partnerTrustScore) / 2;

  const overallScore = (averageSecurityScore + averageEmotionalScore + averageSupportScore + averageTrustScore) / 4;
  const securityDiscrepancy = Math.abs(userSecurityScore - partnerSecurityScore);
  const emotionalDiscrepancy = Math.abs(userEmotionalScore - partnerEmotionalScore);

  // Determine attachment style considering both individual and relationship dynamics
  if (overallScore >= 7 && securityDiscrepancy < 2) {
    primary = 'secure';
    description = 'Demonstra um padrão de apego seguro mútuo, com boa capacidade de conexão e confiança entre ambos.';
    recommendations = [
      'Continue cultivating the open and honest communication between both partners',
      'Maintain the balance between independence and intimacy in the relationship',
      'Celebrate significant connection moments together'
    ];
  } else if (averageTrustScore < 5 || averageSupportScore < 5 || securityDiscrepancy > 3) {
    primary = 'avoidant';
    description = 'Apresenta tendências de apego evitativo, com possíveis dificuldades mútuas em confiar e receber apoio.';
    recommendations = [
      'Pratique a vulnerabilidade em pequenos passos juntos',
      'Comuniquem suas necessidades de espaço de forma clara',
      'Desenvolvam estratégias para lidar com a intimidade emocional como casal'
    ];
  } else if (averageSecurityScore < 5 || averageEmotionalScore < 5 || emotionalDiscrepancy > 3) {
    primary = 'anxious';
    description = 'Demonstra padrões de apego ansioso, com necessidade de reasseguramento frequente na relação.';
    recommendations = [
      'Desenvolvam práticas de auto-regulação emocional juntos',
      'Trabalhem na construção de autoconfiança mútua',
      'Estabeleçam limites saudáveis na relação considerando ambas as necessidades'
    ];
  } else {
    primary = 'disorganized';
    description = 'Apresenta padrões mistos de apego, que podem variar conforme o contexto e a dinâmica do casal.';
    recommendations = [
      'Busquem consistência nas interações mútuas',
      'Desenvolvam estratégias de auto-conhecimento como casal',
      'Considerem apoio terapêutico para explorar padrões relacionais'
    ];
  }

  return {
    primary,
    description,
    recommendations
  };
} 