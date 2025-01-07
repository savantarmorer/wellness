import { DailyAssessment, CommunicationPatterns } from '../types';

export async function analyzeCommunicationPatterns(
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment
): Promise<CommunicationPatterns> {
  const { comunicacao, resolucaoConflitos } = userAssessment.ratings;

  let style = '';
  let effectiveness = 0;
  let patterns: string[] = [];

  // Calculate communication effectiveness
  effectiveness = comunicacao || 0;

  // Determine communication style
  if (comunicacao >= 8) {
    style = 'assertivo';
    patterns = [
      'Comunicação clara e direta',
      'Escuta ativa presente',
      'Expressão saudável de necessidades'
    ];
  } else if (comunicacao >= 6) {
    style = 'colaborativo';
    patterns = [
      'Boa disposição para diálogo',
      'Busca de soluções conjuntas',
      'Abertura para feedback'
    ];
  } else if (comunicacao >= 4) {
    style = 'hesitante';
    patterns = [
      'Melhorar clareza na comunicação',
      'Desenvolver assertividade',
      'Praticar expressão de necessidades'
    ];
  } else {
    style = 'evitativo';
    patterns = [
      'Estabelecer comunicação regular',
      'Criar espaço seguro para diálogo',
      'Trabalhar expressão emocional'
    ];
  }

  // Add conflict resolution patterns if score is low
  if (resolucaoConflitos < 5) {
    patterns.push(
      'Desenvolver estratégias de resolução de conflitos',
      'Praticar comunicação não-violenta',
      'Estabelecer regras para discussões saudáveis'
    );
  }

  return {
    style,
    effectiveness,
    patterns,
    confidence: 0.8
  };
} 