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
import { callOpenAI } from './openaiClient';
import { THERAPIST_SYSTEM_PROMPT } from './prompts';
import OpenAI from 'openai';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface Discrepancy {
  category: string;
  userScore: number;
  partnerScore: number;
  difference: number;
  significance: string;
}

export interface DiscrepancyAnalysis {
  category: string;
  userRating: number;
  partnerRating: number;
  difference: number;
  significance: 'high' | 'medium' | 'low';
  recommendation: string;
  gptCommentary: string;
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

export const analyzeDiscrepancies = async (
  userAssessment: CategoryRatings,
  partnerAssessment: CategoryRatings
): Promise<DiscrepancyAnalysis[]> => {
  const discrepancies: DiscrepancyAnalysis[] = [];

  // Converter CategoryRatings para Record<string, number>
  const userRatings: Record<string, number> = { ...userAssessment };
  const partnerRatings: Record<string, number> = { ...partnerAssessment };

  const recommendations = {
    comunicacao: {
      high: 'Existe uma diferença significativa na percepção da comunicação. Sugerimos: 1) Agendar uma "reunião semanal" de 30 minutos para discutir preocupações e expectativas; 2) Praticar a técnica do "espelho" - repetir o que o parceiro disse para garantir entendimento; 3) Considerar terapia de casal para desenvolver habilidades de comunicação.',
      medium: 'Há espaço para melhorar a comunicação. Recomendamos: 1) Criar um "diário de gratidão" compartilhado; 2) Implementar a regra dos "5 minutos de escuta ativa" diários, sem interrupções; 3) Usar "eu me sinto" em vez de acusações ao discutir problemas.',
      low: 'Pequenos ajustes podem aprimorar ainda mais a comunicação: 1) Fazer uma pergunta significativa por dia sobre o dia do parceiro; 2) Compartilhar uma apreciação específica diariamente; 3) Evitar distrações (celular, TV) durante conversas importantes.'
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
      high: 'Existe uma diferença significativa na resolução de conflitos. Os conflitos precisam ser melhor gerenciados: 1) Estabelecer "regras de briga justa"; 2) Implementar tempo limite de 30 minutos em discussões intensas; 3) Criar um "espaço seguro" físico para discussões; 4) Buscar mediação profissional se necessário.',
      medium: 'Há espaço para melhorar a resolução de conflitos: 1) Usar a técnica "problema vs. parceria"; 2) Estabelecer palavras-chave para pausar discussões; 3) Fazer "reuniões de resolução" estruturadas.',
      low: 'Pequenos ajustes podem aprimorar a resolução de conflitos: 1) Abordar desacordos rapidamente; 2) Praticar escuta ativa durante conflitos; 3) Focar em soluções, não em culpa.'
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

  for (const category in userRatings) {
    if (partnerRatings[category] !== undefined) {
      const userRating = userRatings[category];
      const partnerRating = partnerRatings[category];
      const difference = Math.abs(userRating - partnerRating);

      if (difference >= 2) {
        const significance = difference >= 2 ? 'high' : difference >= 1.5 ? 'medium' : 'low';

        // Generate GPT commentary for the discrepancy
        const gptCommentary = await generateGPTCommentary({
          category,
          userRating,
          partnerRating,
          difference,
          significance
        });

        discrepancies.push({
          category,
          userRating,
          partnerRating,
          difference,
          significance,
          recommendation: recommendations[category as keyof typeof recommendations]?.[significance] ||
            'Recomendamos conversar sobre as diferentes perspectivas neste aspecto do relacionamento.',
          gptCommentary
        });
      }
    }
  }

  return discrepancies.sort((a, b) => b.difference - a.difference);
};

export const generateGPTCommentary = async (
  { category, userRating, partnerRating, difference, significance }: Omit<DiscrepancyAnalysis, 'recommendation' | 'gptCommentary'>
): Promise<string> => {
  try {
    const response = await callOpenAI({
      messages: [
        { role: 'system', content: THERAPIST_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this discrepancy in the relationship assessment:
            Category: ${category}
            User Score: ${userRating}
            Partner Score: ${partnerRating}
            Difference: ${difference}
            Significance: ${significance}
            
            Please provide a brief, empathetic commentary about this discrepancy and its potential impact on the relationship.`
        }
      ]
    });

    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    return response.choices[0].message.content || 'Não foi possível gerar um comentário para esta discrepância.';
  } catch (error) {
    console.error('Error generating GPT commentary:', error);
    return 'Não foi possível gerar um comentário para esta discrepância.';
  }
};

export const generateRecommendation = (discrepancy: DiscrepancyAnalysis): string => {
  const recommendations = {
    comunicacao: {
      high: 'Existe uma diferença significativa na percepção da comunicação. Sugerimos: 1) Agendar uma "reunião semanal" de 30 minutos para discutir preocupações e expectativas; 2) Praticar a técnica do "espelho" - repetir o que o parceiro disse para garantir entendimento; 3) Considerar terapia de casal para desenvolver habilidades de comunicação.',
      medium: 'Há espaço para melhorar a comunicação. Recomendamos: 1) Criar um "diário de gratidão" compartilhado; 2) Implementar a regra dos "5 minutos de escuta ativa" diários, sem interrupções; 3) Usar "eu me sinto" em vez de acusações ao discutir problemas.',
      low: 'Pequenos ajustes podem aprimorar ainda mais a comunicação: 1) Fazer uma pergunta significativa por dia sobre o dia do parceiro; 2) Compartilhar uma apreciação específica diariamente; 3) Evitar distrações (celular, TV) durante conversas importantes.'
    },
    conexaoEmocional: {
      high: 'A diferença na percepção da conexão emocional é significativa. Sugerimos: 1) Estabelecer um momento diário de "check-in emocional"; 2) Compartilhar memórias positivas do relacionamento; 3) Explorar juntos novas atividades que promovam intimidade emocional.',
      medium: 'Para fortalecer a conexão emocional, recomendamos: 1) Criar um ritual de compartilhamento diário de sentimentos; 2) Planejar momentos regulares de qualidade juntos; 3) Expressar apreciação por gestos de carinho.',
      low: 'Para manter e melhorar a conexão emocional: 1) Continuar demonstrando interesse pelos sentimentos um do outro; 2) Celebrar pequenas conquistas juntos; 3) Manter momentos de vulnerabilidade e abertura.'
    },
    apoioMutuo: {
      high: 'Há uma discrepância significativa na percepção do apoio mútuo. Sugerimos: 1) Discutir abertamente as expectativas de suporte; 2) Identificar áreas específicas onde cada um precisa de mais apoio; 3) Desenvolver planos concretos de como oferecer suporte um ao outro.',
      medium: 'Para melhorar o apoio mútuo: 1) Perguntar regularmente "Como posso te apoiar hoje?"; 2) Reconhecer e agradecer os gestos de apoio; 3) Compartilhar objetivos e sonhos, buscando formas de se apoiarem.',
      low: 'Para fortalecer ainda mais o apoio mútuo: 1) Manter a prática de oferecer ajuda proativamente; 2) Celebrar as conquistas um do outro; 3) Continuar mostrando disponibilidade em momentos difíceis.'
    },
    transparenciaConfianca: {
      high: 'A diferença na percepção da transparência e confiança requer atenção. Sugerimos: 1) Estabelecer acordos claros sobre privacidade e limites; 2) Praticar honestidade emocional em conversas diárias; 3) Trabalhar com um terapeuta para reconstruir a confiança.',
      medium: 'Para fortalecer a transparência e confiança: 1) Compartilhar pensamentos e sentimentos regularmente; 2) Cumprir compromissos e promessas consistentemente; 3) Ser transparente sobre necessidades e expectativas.',
      low: 'Para manter e melhorar a confiança: 1) Continuar sendo consistente nas palavras e ações; 2) Manter a transparência nas decisões; 3) Valorizar a honestidade mútua.'
    },
    intimidadeFisica: {
      high: 'Existe uma diferença significativa na percepção da intimidade física. Sugerimos: 1) Conversar abertamente sobre necessidades e limites; 2) Explorar diferentes formas de expressão física de afeto; 3) Considerar aconselhamento específico para questões de intimidade.',
      medium: 'Para melhorar a intimidade física: 1) Criar momentos regulares de proximidade não-sexual; 2) Expressar desejos e preferências de forma clara; 3) Desenvolver rituais de conexão física diária.',
      low: 'Para manter e enriquecer a intimidade física: 1) Continuar respeitando os limites um do outro; 2) Manter a comunicação aberta sobre desejos; 3) Explorar novas formas de conexão física.'
    },
    saudeMental: {
      high: 'A diferença na percepção da saúde mental é preocupante. Sugerimos: 1) Buscar apoio profissional individual e/ou conjunto; 2) Desenvolver estratégias de comunicação sobre estados emocionais; 3) Criar um plano de suporte mútuo para momentos difíceis.',
      medium: 'Para melhorar o suporte à saúde mental: 1) Praticar escuta ativa sem julgamentos; 2) Respeitar o espaço individual quando necessário; 3) Aprender a reconhecer sinais de estresse um no outro.',
      low: 'Para manter o cuidado com a saúde mental: 1) Continuar praticando empatia e compreensão; 2) Manter o equilíbrio entre proximidade e espaço pessoal; 3) Celebrar progressos no bem-estar emocional.'
    },
    resolucaoConflitos: {
      high: 'A diferença na percepção da resolução de conflitos precisa de atenção. Sugerimos: 1) Estabelecer regras básicas para discussões; 2) Aprender técnicas de comunicação não-violenta; 3) Considerar mediação profissional para conflitos recorrentes.',
      medium: 'Para melhorar a resolução de conflitos: 1) Praticar pausas durante discussões acaloradas; 2) Focar em soluções em vez de culpa; 3) Validar os sentimentos um do outro durante desentendimentos.',
      low: 'Para manter uma boa resolução de conflitos: 1) Continuar praticando escuta ativa; 2) Manter o foco na solução conjunta; 3) Valorizar o compromisso mútuo com o entendimento.'
    },
    segurancaRelacionamento: {
      high: 'A diferença na percepção da segurança do relacionamento é significativa. Sugerimos: 1) Explorar as raízes da insegurança em terapia; 2) Desenvolver rituais de reafirmação do compromisso; 3) Trabalhar juntos em um plano de fortalecimento da relação.',
      medium: 'Para fortalecer a segurança no relacionamento: 1) Expressar regularmente compromisso e dedicação; 2) Criar momentos de conexão significativa; 3) Discutir e alinhar expectativas futuras.',
      low: 'Para manter e melhorar a segurança: 1) Continuar demonstrando consistência no compromisso; 2) Manter a comunicação sobre o futuro; 3) Celebrar a estabilidade construída.'
    },
    satisfacaoGeral: {
      high: 'A diferença na satisfação geral requer atenção especial. Sugerimos: 1) Fazer um "inventário" detalhado das áreas de satisfação e insatisfação; 2) Desenvolver um plano conjunto de melhorias; 3) Considerar aconselhamento para alinhar expectativas.',
      medium: 'Para melhorar a satisfação geral: 1) Identificar e trabalhar em áreas específicas de melhoria; 2) Criar metas conjuntas de curto e longo prazo; 3) Celebrar progressos e conquistas juntos.',
      low: 'Para manter e aumentar a satisfação: 1) Continuar investindo na qualidade do relacionamento; 2) Manter o diálogo sobre expectativas; 3) Buscar novas formas de crescimento conjunto.'
    }
  };

  return recommendations[discrepancy.category as keyof typeof recommendations]?.[discrepancy.significance] ||
    'Recomendamos conversar sobre as diferentes perspectivas neste aspecto do relacionamento.';
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