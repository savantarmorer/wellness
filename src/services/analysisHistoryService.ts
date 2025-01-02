import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { DailyAssessment, CategoryRatings } from '../types';
import { RelationshipAnalysis, ConsensusFormData } from './gptService';
import { generateRelationshipAnalysis } from './gptService';
import { getRelationshipContext } from './relationshipContextService';
import { 
  detectConsistentDiscrepancy, 
  detectNewInteractionPattern,
  average,
  CategoryAverages,
  DiscrepancyResult
} from './analysisUtils';
import {
  analyzeAttachmentStyle,
  analyzeCommunicationPatterns,
  calculateEmotionalSecurity,
  analyzeIntimacyBalance,
  analyzeConflictStyle,
  determineRelationshipStage,
  identifyGrowthAreas,
  analyzeRelationshipStrengths
} from './psychologicalAnalysisService';
import {
  analyzeTrends,
  identifyPatterns,
  detectCyclicalBehaviors
} from './temporalAnalysisService';

// Interface para o registro de análise
export interface AnalysisRecord {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: string | RelationshipAnalysis | ConsensusFormData;
  analysisType: 'text' | 'object';
  analysisValue: any;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  needsUpdate?: boolean;
}

// Interface para dados do Firestore
export interface FirestoreData {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: string;
  analysisType: 'text' | 'object';
  analysisValue: any;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  needsUpdate?: boolean;
}

// Weights based on meta-analysis of relationship satisfaction predictors
const CATEGORY_WEIGHTS = {
  // Core Relationship Factors (65% total)
  consensus: 0.15,     // Agreement on major issues
  affection: 0.20,     // Emotional and physical intimacy
  cohesion: 0.15,      // Shared activities and time
  satisfaction: 0.15,  // Overall relationship satisfaction

  // Relationship Maintenance Factors (35% total)
  conflict: 0.15,      // Conflict resolution patterns
  general: 0.20        // Daily stressors and external factors
};

// Inter-category correlation factors based on attachment theory
const CORRELATION_FACTORS = {
  affection_cohesion: 0.6,      // Strong correlation between affection and cohesion
  consensus_satisfaction: 0.5,   // Moderate correlation between agreement and satisfaction
  conflict_satisfaction: -0.4,   // Negative correlation between conflict and satisfaction
  general_all: 0.3              // Weak correlation between general factors and others
};

export const calculateConsensusScores = (answers: Record<string, string>): ConsensusFormData['scores'] => {
  const scoreMap: Record<string, number> = {};
  
  // Convert string values to numbers using validated scales
  Object.entries(answers).forEach(([key, value]) => {
    if (!isNaN(Number(value))) {
      scoreMap[key] = Number(value);
    } else {
      // Convert frequency options using validated frequency scale
      switch (value.toLowerCase()) {
        case 'diariamente':
        case 'todos os dias':
        case 'uma vez por dia':
        case 'frequentemente':
          scoreMap[key] = 5;
          break;
        case 'quase todos os dias':
        case 'algumas vezes por semana':
        case 'às vezes':
          scoreMap[key] = 3.5; // Adjusted to reflect actual frequency impact
          break;
        case 'raramente':
          scoreMap[key] = 2;
          break;
        case 'nunca':
          scoreMap[key] = 1;
          break;
        case 'sim':
          scoreMap[key] = 1; // For negative questions
          break;
        case 'não':
          scoreMap[key] = 5; // For negative questions
          break;
        default:
          scoreMap[key] = 3;
      }
    }
  });

  // Calculate base category scores
  const consensusScore = [
    'finances', 'recreation', 'religion', 'friendships', 'conventions'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 5;

  const affectionScore = [
    'affection_demonstration', 'kissing', 'sexual_satisfaction'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const cohesionScore = [
    'time_together', 'stimulating_ideas', 'projects_together'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const satisfactionScore = [
    'divorce_thoughts', 'regret', 'arguments'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const conflictScore = [
    'leave_after_fight', 'calm_discussion', 'lose_patience'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const generalScore = [
    'too_tired', 'lack_affection'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 2;

  // Apply correlation adjustments
  const adjustedAffectionScore = affectionScore * (1 + CORRELATION_FACTORS.affection_cohesion * (cohesionScore / 5 - 0.5));
  const adjustedCohesionScore = cohesionScore * (1 + CORRELATION_FACTORS.affection_cohesion * (affectionScore / 5 - 0.5));
  const adjustedConsensusScore = consensusScore * (1 + CORRELATION_FACTORS.consensus_satisfaction * (satisfactionScore / 5 - 0.5));
  const adjustedSatisfactionScore = satisfactionScore * (1 + CORRELATION_FACTORS.consensus_satisfaction * (consensusScore / 5 - 0.5));
  const adjustedConflictScore = conflictScore * (1 + CORRELATION_FACTORS.conflict_satisfaction * (satisfactionScore / 5 - 0.5));

  // Apply general factor correlation
  const generalAdjustment = CORRELATION_FACTORS.general_all * (generalScore / 5 - 0.5);
  const allScores = [
    adjustedAffectionScore,
    adjustedCohesionScore,
    adjustedConsensusScore,
    adjustedSatisfactionScore,
    adjustedConflictScore,
    generalScore
  ];

  const finalScores = allScores.map(score => 
    score * (1 + generalAdjustment)
  );

  // Calculate weighted overall score
  const overallScore = 
    finalScores[0] * CATEGORY_WEIGHTS.affection +
    finalScores[1] * CATEGORY_WEIGHTS.cohesion +
    finalScores[2] * CATEGORY_WEIGHTS.consensus +
    finalScores[3] * CATEGORY_WEIGHTS.satisfaction +
    finalScores[4] * CATEGORY_WEIGHTS.conflict +
    finalScores[5] * CATEGORY_WEIGHTS.general;

  return {
    consensus: Math.min(5, Math.max(1, finalScores[2])),
    affection: Math.min(5, Math.max(1, finalScores[0])),
    cohesion: Math.min(5, Math.max(1, finalScores[1])),
    satisfaction: Math.min(5, Math.max(1, finalScores[3])),
    conflict: Math.min(5, Math.max(1, finalScores[4])),
    general: Math.min(5, Math.max(1, finalScores[5])),
    overall: Math.min(5, Math.max(1, overallScore))
  };
};

export const saveAnalysis = async (
  userId: string,
  type: 'individual' | 'collective',
  analysis: string | RelationshipAnalysis | ConsensusFormData,
  partnerId?: string
): Promise<void> => {
  try {
    // Validate required fields
    if (!userId) throw new Error('userId is required');
    if (!type) throw new Error('type is required');
    if (!analysis) throw new Error('analysis is required');

    const analysisCollection = collection(db, 'gptAnalysis');
    
    // Calculate scores for consensus form
    if (typeof analysis === 'object' && 'type' in analysis && analysis.type === 'consensus_form') {
      if (!analysis.answers || Object.keys(analysis.answers).length === 0) {
        throw new Error('Consensus form answers are required');
      }
      analysis.scores = calculateConsensusScores(analysis.answers);
    }

    // Process the analysis data
    let analysisType: 'text' | 'object' = 'text';
    let analysisValue = null;

    if (typeof analysis === 'string') {
      analysisType = 'text';
      analysisValue = analysis;
    } else {
      analysisType = 'object';
      analysisValue = analysis;
    }

    // Validate date format
    const currentDate = new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      throw new Error('Invalid date format');
    }

    const analysisData = {
      userId,
      type,
      analysis: typeof analysis === 'string' ? analysis : JSON.stringify(analysis),
      date: currentDate,
      createdAt: Timestamp.now(),
      analysisType,
      analysisValue,
      needsUpdate: false
    };

    if (partnerId) {
      Object.assign(analysisData, { partnerId });
    }

    // Validate analysis data before saving
    if (analysisType === 'object' && !analysisValue) {
      throw new Error('Invalid analysis data');
    }

    await addDoc(analysisCollection, analysisData);

    // Se for uma análise individual e houver um partnerId,
    // verifica se existe uma análise do parceiro para o mesmo dia
    if (type === 'individual' && partnerId) {
      await checkAndUpdatePartnerAnalysis(userId, partnerId, analysisData.date);
    }
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

// Nova função para verificar e atualizar análises do parceiro
export const checkAndUpdatePartnerAnalysis = async (
  userId: string,
  partnerId: string,
  date: string
): Promise<void> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('userId', '==', partnerId),
      where('date', '==', date),
      where('type', '==', 'individual')
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const partnerAnalysis = snapshot.docs[0];
      
      // Marca ambas as análises para atualização
      await updateDoc(doc(db, 'gptAnalysis', partnerAnalysis.id), {
        needsUpdate: true
      });

      // Agenda a atualização das análises
      await updateHistoricalAnalyses(userId, partnerId, date, date);
    }
  } catch (error) {
    console.error('Error checking partner analysis:', error);
    throw error;
  }
};

// Função para processar atualizações pendentes
export const processUpdateQueue = async (): Promise<void> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('needsUpdate', '==', true)
    );

    const snapshot = await getDocs(q);
    const analyses = snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreData;
      return {
        id: doc.id,
        userId: data.userId,
        partnerId: data.partnerId,
        date: data.date,
        type: data.type,
        analysis: data.analysis,
        analysisType: data.analysisType,
        analysisValue: data.analysisValue,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        needsUpdate: data.needsUpdate
      } as AnalysisRecord;
    });

    // Agrupa análises por par de usuários e data
    const updateGroups = analyses.reduce((acc, analysis) => {
      const key = `${analysis.userId}_${analysis.partnerId}_${analysis.date}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(analysis);
      return acc;
    }, {} as Record<string, AnalysisRecord[]>);

    // Processa cada grupo de atualizações
    for (const analyses of Object.values(updateGroups)) {
      if (analyses.length === 2) { // Temos ambas as análises
        const [analysis1, analysis2] = analyses;
        
        // Gera nova análise combinada
        const context = await getRelationshipContext(analysis1.userId);
        if (!context) continue;

        // Converte as análises para o formato esperado
        let assessment1: DailyAssessment;
        let assessment2: DailyAssessment;

        try {
          assessment1 = typeof analysis1.analysis === 'string' 
            ? JSON.parse(analysis1.analysis)
            : analysis1.analysis as unknown as DailyAssessment;

          assessment2 = typeof analysis2.analysis === 'string'
            ? JSON.parse(analysis2.analysis)
            : analysis2.analysis as unknown as DailyAssessment;

          const updatedAnalysis = await generateRelationshipAnalysis(
            assessment1,
            assessment2,
            context
          );

          // Adiciona análises detalhadas
          const averages = calculateAverageScores([assessment1], [assessment2]);
          const discrepancies = analyzeDiscrepancies([assessment1], [assessment2]);
          const insights = generateTimeframeInsights(averages, discrepancies, 7); // última semana

          const enrichedAnalysis = {
            ...updatedAnalysis,
            detailedAnalysis: {
              averages,
              discrepancies,
              insights,
              interactionPattern: detectNewInteractionPattern(
                Object.values(assessment1.ratings),
                Object.values(assessment2.ratings)
              ),
              psychologicalInsights: {
                attachmentStyle: analyzeAttachmentStyle(averages, discrepancies),
                communicationPatterns: analyzeCommunicationPatterns(assessment1, assessment2),
                emotionalDynamics: {
                  emotionalSecurity: calculateEmotionalSecurity(averages),
                  intimacyBalance: analyzeIntimacyBalance(averages),
                  conflictResolution: analyzeConflictStyle(assessment1, assessment2)
                },
                relationshipStage: determineRelationshipStage(averages, discrepancies),
                growthAreas: identifyGrowthAreas(averages, discrepancies),
                strengthsAnalysis: analyzeRelationshipStrengths(averages)
              },
              temporalAnalysis: {
                trends: analyzeTrends([assessment1], [assessment2]),
                patterns: identifyPatterns([assessment1], [assessment2]),
                cyclicalBehaviors: detectCyclicalBehaviors([assessment1], [assessment2])
              }
            }
          };

          // Atualiza ambos os documentos com a análise enriquecida
          for (const analysis of analyses) {
            const docRef = doc(db, 'gptAnalysis', analysis.id);
            await updateDoc(docRef, {
              analysis: JSON.stringify(enrichedAnalysis),
              needsUpdate: false,
              updatedAt: Timestamp.now()
            });
          }
        } catch (error) {
          console.error('Error processing assessments:', error);
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error processing update queue:', error);
    throw error;
  }
};

export const getAnalysisForDate = async (
  userId: string,
  date: string,
  type: 'individual' | 'collective'
): Promise<AnalysisRecord | null> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('userId', '==', userId),
      where('date', '==', date),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Convert the analysis back to the correct format
    let processedAnalysis = data.analysis;
    if (data.analysisType === 'object' && typeof data.analysis === 'string') {
      try {
        processedAnalysis = JSON.parse(data.analysis);
      } catch (e) {
        console.error('Error parsing analysis:', e);
      }
    }

    return {
      id: doc.id,
      ...data,
      analysis: processedAnalysis
    } as AnalysisRecord;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (userId: string): Promise<AnalysisRecord[]> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Raw Firestore document:', {
        id: doc.id,
        data: data
      });

      // Convert the analysis back to the correct format
      let processedAnalysis = data.analysis;
      if (data.analysisType === 'object' && typeof data.analysis === 'string') {
        try {
          processedAnalysis = JSON.parse(data.analysis);
        } catch (e) {
          console.error('Error parsing analysis:', e);
        }
      }

      return {
        id: doc.id,
        ...data,
        analysis: processedAnalysis
      };
    }) as AnalysisRecord[];

    console.log('Processed analysis records:', records);
    return records;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

// Função para atualizar análises retroativamente quando um parceiro preenche depois
export const updateHistoricalAnalyses = async (
  userId: string,
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    
    // Busca as avaliações do usuário e do parceiro no período
    const userAssessmentsQuery = query(
      collection(db, 'assessments'),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const partnerAssessmentsQuery = query(
      collection(db, 'assessments'),
      where('userId', '==', partnerId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const [userSnapshot, partnerSnapshot] = await Promise.all([
      getDocs(userAssessmentsQuery),
      getDocs(partnerAssessmentsQuery)
    ]);

    const userAssessments = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyAssessment[];

    const partnerAssessments = partnerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyAssessment[];

    // Busca o contexto do relacionamento
    const relationshipContext = await getRelationshipContext(userId);
    if (!relationshipContext) return;

    // Para cada dia no período
    const dates = getDatesInRange(startDate, endDate);
    for (const date of dates) {
      const userAssessment = userAssessments.find(a => a.date === date);
      const partnerAssessment = partnerAssessments.find(a => a.date === date);

      // Se ambos têm avaliação para o dia
      if (userAssessment && partnerAssessment) {
        // Gera nova análise
        const analysis = await generateRelationshipAnalysis(
          userAssessment,
          partnerAssessment,
          relationshipContext
        );

        // Calcula médias e discrepâncias
        const averageScores = calculateAverageScores([userAssessment], [partnerAssessment]);
        const discrepancies = analyzeDiscrepancies([userAssessment], [partnerAssessment]);

        // Extrai arrays de scores das avaliações
        const userScores = Object.values(userAssessment.ratings);
        const partnerScores = Object.values(partnerAssessment.ratings);

        // Enriquece a análise com insights adicionais
        const enrichedAnalysis = {
          ...analysis,
          averageScores,
          discrepancies,
          insights: generateTimeframeInsights(averageScores, discrepancies, 1),
          patterns: detectNewInteractionPattern(userScores, partnerScores)
        };

        // Salva a análise atualizada
        const analysisData = {
          userId,
          partnerId,
          type: 'collective' as const,
          date,
          analysis: JSON.stringify(enrichedAnalysis),
          analysisType: 'object' as const,
          analysisValue: enrichedAnalysis,
          createdAt: Timestamp.now(),
          needsUpdate: false
        };

        // Busca análise existente para o dia
        const existingAnalysisQuery = query(
          analysisCollection,
          where('userId', '==', userId),
          where('partnerId', '==', partnerId),
          where('date', '==', date),
          where('type', '==', 'collective')
        );

        const existingAnalysisSnapshot = await getDocs(existingAnalysisQuery);

        if (!existingAnalysisSnapshot.empty) {
          // Atualiza análise existente
          const docRef = doc(db, 'gptAnalysis', existingAnalysisSnapshot.docs[0].id);
          await updateDoc(docRef, analysisData);
        } else {
          // Cria nova análise
          await addDoc(analysisCollection, analysisData);
        }
      }
    }
  } catch (error) {
    console.error('Error updating historical analyses:', error);
    throw error;
  }
};

// Função auxiliar para gerar array de datas no intervalo
const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export const calculateAverageScores = (
  userHistory: DailyAssessment[], 
  partnerHistory: DailyAssessment[]
): CategoryAverages => {
  const categories = Object.keys(CATEGORY_WEIGHTS);
  const result = {} as CategoryAverages;
  
  categories.forEach(category => {
    const userScores = userHistory.map(h => h.ratings[category as keyof CategoryRatings]);
    const partnerScores = partnerHistory.map(h => h.ratings[category as keyof CategoryRatings]);
    
    result[category as keyof CategoryAverages] = average([...userScores, ...partnerScores]);
  });
  
  return result;
};

export const analyzeDiscrepancies = (
  userHistory: DailyAssessment[], 
  partnerHistory: DailyAssessment[]
): DiscrepancyResult[] => {
  const categories = Object.keys(CATEGORY_WEIGHTS);
  const results: DiscrepancyResult[] = [];
  
  categories.forEach(category => {
    const userScores = userHistory.map(h => h.ratings[category as keyof CategoryRatings]);
    const partnerScores = partnerHistory.map(h => h.ratings[category as keyof CategoryRatings]);
    
    const avgDiff = Math.abs(average(userScores) - average(partnerScores));
    const pattern = detectConsistentDiscrepancy(userScores, partnerScores);
    
    results.push({
      category,
      difference: avgDiff,
      significance: avgDiff > 2 ? 'high' : avgDiff > 1 ? 'medium' : 'low',
      pattern
    });
  });
  
  return results;
};

export const generateTimeframeInsights = (
  averageScores: CategoryAverages, 
  discrepancies: DiscrepancyResult[], 
  days: number
): string[] => {
  const insights: string[] = [];
  
  // Insights baseados em médias
  Object.entries(averageScores).forEach(([category, score]) => {
    if (score < 2) {
      insights.push(`Atenção necessária na área de ${category} (média baixa: ${score.toFixed(1)})`);
    } else if (score > 4) {
      insights.push(`Ponto forte do relacionamento: ${category} (média alta: ${score.toFixed(1)})`);
    }
  });
  
  // Insights baseados em discrepâncias
  discrepancies
    .filter(d => d.significance === 'high')
    .forEach(d => {
      insights.push(`Diferença significativa em ${d.category}: ${d.pattern || 'necessita alinhamento'}`);
    });
  
  // Insights baseados no período
  if (days <= 7) {
    insights.push('Análise de curto prazo - continue monitorando para tendências mais claras');
  } else if (days >= 30) {
    insights.push('Análise de longo prazo - padrões identificados são mais confiáveis');
  }
  
  return insights;
};

export const clearAnalysisHistory = async (userId: string): Promise<void> => {
  try {
    const analysisRef = collection(db, 'analyses');
    const q = query(analysisRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(async (doc) => {
      await deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log('Successfully cleared analysis history for user:', userId);
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    throw new Error('Failed to clear analysis history');
  }
};

export const cleanupInvalidAnalyses = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 Starting cleanup of invalid analyses');
    const analysisRef = collection(db, 'analysisHistory');
    const q = query(
      analysisRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    let deletedCount = 0;
    let totalCount = snapshot.size;

    snapshot.forEach((doc) => {
      const data = doc.data();
      let isValid = false;

      try {
        // Check if analysis exists and has the correct structure
        if (data.analysis) {
          const analysis = typeof data.analysis === 'string' 
            ? JSON.parse(data.analysis) 
            : data.analysis;

          isValid = (
            typeof analysis === 'object' &&
            analysis !== null &&
            'overallHealth' in analysis &&
            typeof analysis.overallHealth === 'object' &&
            'score' in analysis.overallHealth &&
            'trend' in analysis.overallHealth &&
            'categories' in analysis &&
            typeof analysis.categories === 'object' &&
            'strengthsAndChallenges' in analysis &&
            typeof analysis.strengthsAndChallenges === 'object' &&
            'strengths' in analysis.strengthsAndChallenges &&
            'challenges' in analysis.strengthsAndChallenges &&
            'communicationSuggestions' in analysis &&
            Array.isArray(analysis.communicationSuggestions) &&
            'actionItems' in analysis &&
            Array.isArray(analysis.actionItems) &&
            'relationshipDynamics' in analysis &&
            typeof analysis.relationshipDynamics === 'object' &&
            'positivePatterns' in analysis.relationshipDynamics &&
            'concerningPatterns' in analysis.relationshipDynamics &&
            'growthAreas' in analysis.relationshipDynamics &&
            'emotionalDynamics' in analysis &&
            typeof analysis.emotionalDynamics === 'object' &&
            'emotionalSecurity' in analysis.emotionalDynamics &&
            'intimacyBalance' in analysis.emotionalDynamics &&
            'conflictResolution' in analysis.emotionalDynamics
          );
        }
      } catch (error) {
        console.log('❌ Invalid analysis format:', {
          id: doc.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        isValid = false;
      }

      if (!isValid) {
        console.log('🗑️ Deleting invalid analysis:', {
          id: doc.id,
          date: data.date,
          type: data.type
        });
        deletePromises.push(deleteDoc(doc.ref));
        deletedCount++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    console.log('✅ Cleanup completed:', {
      totalAnalyses: totalCount,
      deletedAnalyses: deletedCount,
      remainingAnalyses: totalCount - deletedCount
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}; 