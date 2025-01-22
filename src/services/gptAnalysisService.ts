import { UnifiedAnalysis, GPTAnalysis, DailyAssessment, MoodType } from '../types';
import { generateDailyInsight } from './gptService';
import { db } from './firebase';
import { doc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export const generateWrittenAnalysis = async (analysis: UnifiedAnalysis): Promise<string> => {
  const {
    gptAnalysis,
    relationshipAnalysis,
    moodAnalysis,
    temporalAnalysis,
    attachmentAnalysis,
    communicationPatterns,
    dailyInsight
  } = analysis;

  // Create assessment object for GPT analysis
  const assessment: DailyAssessment = {
    id: `assessment_${new Date().getTime()}`,
    userId: gptAnalysis?.userId || '',
    partnerId: gptAnalysis?.partnerId || '',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type: 'individual',
    emotionalSecurity: (relationshipAnalysis?.emotionalDynamics?.emotionalSecurity || 0),
    intimacy: (relationshipAnalysis?.categories?.communication?.impactScore || 0),
    communication: (relationshipAnalysis?.categories?.communication?.score || 0),
    trust: (relationshipAnalysis?.categories?.communication?.score || 0),
    mood: {
      primary: ((gptAnalysis?.analysis?.moodPatterns?.user?.dominant || 'neutral') as MoodType),
      intensity: (gptAnalysis?.analysis?.moodPatterns?.overall?.stability || 0),
      notes: ''
    },
    ratings: {
      comunicacao: (relationshipAnalysis?.categories?.communication?.score || 0),
      resolucaoConflitos: (relationshipAnalysis?.emotionalDynamics?.conflictResolution?.effectiveness || 0),
      conexaoEmocional: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.emotional || 0),
      apoioMutuo: (relationshipAnalysis?.emotionalDynamics?.emotionalSecurity || 0),
      transparenciaConfianca: (relationshipAnalysis?.categories?.communication?.score || 0),
      intimidadeFisica: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.physical || 0),
      saudeMental: (relationshipAnalysis?.emotionalDynamics?.stability || 0),
      segurancaRelacionamento: (relationshipAnalysis?.emotionalDynamics?.emotionalSecurity || 0),
      satisfacaoGeral: (relationshipAnalysis?.overallHealth?.score || 0),
      alinhamentoObjetivos: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.intellectual || 0),
      qualidadeTempo: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.shared || 0),
      intimidade: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.score || 0),
      autocuidado: (relationshipAnalysis?.emotionalDynamics?.stability || 0),
      gratidao: (relationshipAnalysis?.overallHealth?.score || 0)
    },
    validatedScales: relationshipAnalysis?.validatedScales || {
      das: {
        total: 0,
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0
      },
      gottman: {
        fourHorsemen: {
          critica: 0,
          defensividade: 0,
          desprezo: 0,
          stonewalling: 0
        },
        bidsForConnection: {
          tentativas: 0,
          respostasPositivas: 0,
          respostasNegativas: 0,
          respostasNeutras: 0
        },
        resolucaoConflitos: 0,
        significadoCompartilhado: 0,
        reparacao: 0,
        influenciaPositiva: 0
      }
    },
    context: {
      communication: {
        hadMeaningfulTalk: (communicationPatterns?.effectiveness || 0) > 0.5,
        feltUnderstood: (communicationPatterns?.effectiveness || 0) > 0.7,
        quality: communicationPatterns?.effectiveness || 0,
        topics: communicationPatterns?.patterns || []
      },
      conflict: {
        hadConflict: (relationshipAnalysis?.emotionalDynamics?.conflictResolution?.effectiveness || 0) < 0.5,
        resolvedSameDay: (relationshipAnalysis?.emotionalDynamics?.conflictResolution?.effectiveness || 0) > 0.7,
        impactOnMood: 1 - (relationshipAnalysis?.emotionalDynamics?.conflictResolution?.effectiveness || 0)
      },
      support: {
        neededSupport: (relationshipAnalysis?.emotionalDynamics?.emotionalSecurity || 0) < 0.5,
        receivedSupport: (relationshipAnalysis?.emotionalDynamics?.emotionalSecurity || 0) > 0.7,
        supportType: []
      },
      activities: {
        didActivity: (relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.shared || 0) > 0,
        enjoyment: relationshipAnalysis?.emotionalDynamics?.intimacyBalance?.areas?.shared || 0,
        type: []
      },
      crisis: {
        hadSignificantCrises: false,
        crisisType: 'communication',
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low',
        resolutionStatus: 'unresolved'
      }
    }
  };

  // Return existing insight if available, otherwise generate new one
  if (dailyInsight) {
    return dailyInsight;
  }

  try {
    // Generate the analysis using the existing GPT service
    const result = await generateDailyInsight(assessment, assessment);
    if (!result.success || !result.data) {
      console.warn('[GPTAnalysisService] No insight generated:', result.error?.message || 'Unknown error');
      return '';
    }
    return result.data.insights?.join('\n') || '';
  } catch (error) {
    console.error('[GPTAnalysisService] Error generating daily insight:', error);
    return '';
  }
};

export const saveAnalysis = async (analysis: Omit<GPTAnalysis, 'id'>): Promise<GPTAnalysis> => {
  try {
    const timestamp = new Date().toISOString();
    const id = `gpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const completeAnalysis: GPTAnalysis = {
      ...analysis,
      id,
      timestamp
    };
    
    const docRef = doc(db, 'gptAnalysis', id);
    await setDoc(docRef, completeAnalysis);
    
    return completeAnalysis;
  } catch (error) {
    console.error('[GPTAnalysisService] Error saving analysis:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const getLatestAnalysis = async (userId: string, partnerId: string): Promise<GPTAnalysis | null> => {
  if (!userId || !partnerId) {
    console.warn('[GPTAnalysisService] Missing required parameters');
    return null;
  }

  try {
    const analysesRef = collection(db, 'gptAnalysis');
    const q = query(
      analysesRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('[GPTAnalysisService] No previous analysis found');
      return null;
    }

    const latestAnalysis = querySnapshot.docs[0].data() as GPTAnalysis;
    if (!latestAnalysis) {
      console.warn('[GPTAnalysisService] Retrieved document is empty');
      return null;
    }

    console.log('[GPTAnalysisService] Retrieved latest analysis:', latestAnalysis);
    return latestAnalysis;
  } catch (error) {
    console.error('[GPTAnalysisService] Error getting latest analysis:', error instanceof Error ? error.message : String(error));
    return null;
  }
}; 