import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { CategoryRatings } from '../types';

export interface DiscrepancyAnalysis {
  category: string;
  userRating: number;
  partnerRating: number;
  difference: number;
  significance: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface CommunicationExercise {
  id: string;
  title: string;
  description: string;
  duration?: string;
  date: string;
  completed: boolean;
}

export interface DiscussionTopic {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'discussed' | 'resolved';
  date: string;
}

export const analyzeDiscrepancies = (
  userAssessment: CategoryRatings,
  partnerAssessment: CategoryRatings
): DiscrepancyAnalysis[] => {
  const discrepancies: DiscrepancyAnalysis[] = [];

  // Converter CategoryRatings para Record<string, number>
  const userRatings: Record<string, number> = { ...userAssessment };
  const partnerRatings: Record<string, number> = { ...partnerAssessment };

  for (const category in userRatings) {
    if (partnerRatings[category] !== undefined) {
      const difference = Math.abs(userRatings[category] - partnerRatings[category]);
      
      if (difference >= 2) {
        const significance = difference >= 4 ? 'high' : difference >= 3 ? 'medium' : 'low';
        
        const recommendations = {
          comunicacao: {
            high: 'Existe uma diferença significativa na percepção da comunicação. Sugerimos: 1) Agendar uma "reunião semanal" de 30 minutos para discutir preocupações e expectativas; 2) Praticar a técnica do "espelho" - repetir o que o parceiro disse para garantir entendimento; 3) Considerar terapia de casal para desenvolver habilidades de comunicação.',
            medium: 'Há espaço para melhorar a comunicação. Recomendamos: 1) Criar um "diário de gratidão" compartilhado; 2) Implementar a regra dos "5 minutos de escuta ativa" diários, sem interrupções; 3) Usar "eu me sinto" em vez de acusações ao discutir problemas.',
            low: 'Pequenos ajustes podem aprimorar ainda mais a comunicação: 1) Fazer uma pergunta significativa por dia sobre o dia do parceiro; 2) Compartilhar uma apreciação específica diariamente; 3) Evitar distrações (celular, TV) durante conversas importantes.',
          },
          conexaoEmocional: {
            high: 'A conexão emocional precisa de atenção especial. Sugerimos: 1) Criar um "ritual de conexão" diário de 10 minutos (ex: abraço mindful); 2) Compartilhar três memórias felizes juntos por semana; 3) Escrever cartas mensais expressando sentimentos profundos; 4) Buscar acompanhamento terapêutico para fortalecer o vínculo.',
            medium: 'Para fortalecer a conexão emocional, tente: 1) Implementar "encontros surpresa" quinzenais; 2) Criar um álbum digital de momentos especiais juntos; 3) Praticar exercícios de vulnerabilidade - compartilhar medos e sonhos semanalmente.',
            low: 'Para manter e melhorar a conexão: 1) Criar uma playlist compartilhada de músicas significativas; 2) Estabelecer um hobby conjunto; 3) Fazer check-ins emocionais rápidos durante o dia.',
          },
          apoioMutuo: {
            high: 'O apoio mútuo precisa ser fortalecido. Recomendamos: 1) Criar uma lista de "sinais de estresse" um do outro; 2) Estabelecer check-ins semanais sobre necessidades de suporte; 3) Definir ações específicas de apoio para momentos difíceis; 4) Considerar grupos de apoio para casais.',
            medium: 'Para melhorar o apoio mútuo: 1) Criar um "banco de favores" - pequenas ações de suporte; 2) Estabelecer momentos fixos para ajudar em tarefas um do outro; 3) Celebrar as conquistas do parceiro, mesmo as pequenas.',
            low: 'Mantenha o bom apoio mútuo: 1) Revezar responsabilidades regularmente; 2) Oferecer ajuda proativamente em dias estressantes; 3) Expressar gratidão específica pelo suporte recebido.',
          },
          transparenciaConfianca: {
            high: 'A confiança precisa ser reconstruída: 1) Estabelecer "check-ins de honestidade" semanais; 2) Criar regras claras sobre privacidade e limites; 3) Compartilhar senhas e acesso a contas conjuntas; 4) Buscar aconselhamento profissional para trabalhar questões de confiança.',
            medium: 'Para fortalecer a confiança: 1) Praticar "momentos de verdade" diários - compartilhar algo que normalmente não compartilharia; 2) Criar um "contrato de confiança" com expectativas claras; 3) Manter promessas, mesmo as pequenas.',
            low: 'Mantenha a transparência: 1) Compartilhar agendas e planos regularmente; 2) Comunicar mudanças de planos prontamente; 3) Manter o parceiro informado sobre decisões importantes.',
          },
          intimidadeFisica: {
            high: 'A intimidade física precisa de atenção especial: 1) Estabelecer "momentos de toque não-sexual" diários; 2) Criar um calendário de encontros românticos; 3) Discutir abertamente desejos e limites; 4) Considerar terapia sexual se necessário.',
            medium: 'Para melhorar a intimidade física: 1) Implementar 5 minutos diários de carinho consciente; 2) Explorar novas formas de demonstrar afeto físico; 3) Criar um ambiente mais romântico em casa.',
            low: 'Mantenha a conexão física: 1) Variar as demonstrações de afeto; 2) Manter pequenos gestos de carinho durante o dia; 3) Respeitar o espaço pessoal quando necessário.',
          },
          saudeMental: {
            high: 'A saúde mental requer atenção imediata: 1) Buscar terapia individual e/ou de casal; 2) Criar um "plano de crise" conjunto; 3) Estabelecer check-ins diários sobre bem-estar emocional; 4) Identificar e reduzir gatilhos de estresse mútuos.',
            medium: 'Para cuidar da saúde mental: 1) Praticar meditação ou mindfulness juntos; 2) Criar rotinas relaxantes compartilhadas; 3) Manter um diário de humor conjunto.',
            low: 'Mantenha o equilíbrio mental: 1) Fazer atividades relaxantes juntos; 2) Respeitar momentos de solidão; 3) Celebrar pequenas vitórias diárias.',
          },
          resolucaoConflitos: {
            high: 'Os conflitos precisam ser melhor gerenciados: 1) Estabelecer "regras de briga justa"; 2) Implementar tempo limite de 30 minutos em discussões intensas; 3) Criar um "espaço seguro" físico para discussões; 4) Buscar mediação profissional se necessário.',
            medium: 'Para melhorar a resolução de conflitos: 1) Usar a técnica "problema vs. parceria"; 2) Estabelecer palavras-chave para pausar discussões; 3) Fazer "reuniões de resolução" estruturadas.',
            low: 'Mantenha a boa resolução: 1) Abordar desacordos rapidamente; 2) Praticar escuta ativa durante conflitos; 3) Focar em soluções, não em culpa.',
          },
          segurancaRelacionamento: {
            high: 'A segurança do relacionamento precisa ser fortalecida: 1) Desenvolver um "plano de futuro" conjunto; 2) Estabelecer compromissos claros e realistas; 3) Criar rituais de conexão diários; 4) Considerar aconselhamento para trabalhar inseguranças.',
            medium: 'Para aumentar a segurança: 1) Compartilhar medos e inseguranças abertamente; 2) Criar "promessas do relacionamento"; 3) Demonstrar comprometimento através de ações diárias.',
            low: 'Mantenha a segurança: 1) Reafirmar compromissos regularmente; 2) Planejar futuro junto; 3) Manter consistência nas demonstrações de afeto.',
          },
          satisfacaoGeral: {
            high: 'A satisfação geral precisa de atenção: 1) Fazer uma "auditoria do relacionamento" mensal; 2) Criar lista de desejos e expectativas; 3) Implementar mudanças significativas na rotina; 4) Considerar "reinvenção" do relacionamento com ajuda profissional.',
            medium: 'Para aumentar a satisfação: 1) Introduzir novidades regularmente; 2) Criar "momentos extraordinários" mensais; 3) Revisar e atualizar metas do casal.',
            low: 'Mantenha a satisfação: 1) Continuar inovando na rotina; 2) Manter tradições especiais; 3) Celebrar marcos do relacionamento.',
          }
        };

        discrepancies.push({
          category,
          userRating: userRatings[category],
          partnerRating: partnerRatings[category],
          difference,
          significance,
          recommendation: recommendations[category as keyof typeof recommendations]?.[significance] ||
            'Recomendamos conversar sobre as diferentes perspectivas neste aspecto do relacionamento.',
        });
      }
    }
  }

  return discrepancies.sort((a, b) => b.difference - a.difference);
};

export const generateRecommendation = (discrepancy: DiscrepancyAnalysis): string => {
  // Implemente a lógica de recomendação personalizada com base na discrepância
  return discrepancy.recommendation;
};

export const createCommunicationExercise = async (
  userId: string,
  exercise: Omit<CommunicationExercise, 'id' | 'completed'>
): Promise<void> => {
  const exercisesRef = collection(db, 'users', userId, 'exercises');
  await addDoc(exercisesRef, {
    ...exercise,
    completed: false,
    createdAt: Timestamp.now(),
  });
};

export const getExerciseHistory = async (userId: string): Promise<CommunicationExercise[]> => {
  const exercisesRef = collection(db, 'users', userId, 'exercises');
  const q = query(exercisesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date,
  })) as CommunicationExercise[];
};

export const completeExercise = async (userId: string, exerciseId: string): Promise<void> => {
  const exerciseRef = doc(db, 'users', userId, 'exercises', exerciseId);
  await updateDoc(exerciseRef, {
    completed: true,
    completedAt: Timestamp.now(),
  });
};

export const addDiscussionTopic = async (
  userId: string,
  topic: Omit<DiscussionTopic, 'id' | 'status'>
): Promise<void> => {
  const topicsRef = collection(db, 'users', userId, 'topics');
  await addDoc(topicsRef, {
    ...topic,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

export const getDiscussionTopics = async (userId: string): Promise<DiscussionTopic[]> => {
  const topicsRef = collection(db, 'users', userId, 'topics');
  const q = query(topicsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date,
  })) as DiscussionTopic[];
};

export const updateTopicStatus = async (
  userId: string,
  topicId: string,
  status: 'pending' | 'discussed' | 'resolved'
): Promise<void> => {
  const topicRef = doc(db, 'users', userId, 'topics', topicId);
  await updateDoc(topicRef, {
    status,
    updatedAt: Timestamp.now(),
  });
};

export const deleteTopic = async (userId: string, topicId: string): Promise<void> => {
  const topicRef = doc(db, 'users', userId, 'topics', topicId);
  await deleteDoc(topicRef);
}; 