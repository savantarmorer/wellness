# Reorganização das Funções de Cálculo

Este documento descreve a reorganização das funções de cálculo originalmente localizadas em `relationshipAnalysisService.ts`. As funções foram distribuídas em três arquivos diferentes para melhor organização e manutenção.

## Funções Originais e Nova Localização

### Arquivo: `calculosRelacionamento.ts`
Funções principais de análise:
- `calculateEmotionalSync` - Calcula sincronização emocional entre usuário e parceiro
- `calculateMoodStability` - Calcula estabilidade do humor ao longo do tempo
- `calculateCommunicationQuality` - Avalia qualidade da comunicação baseada em entradas correspondentes
- `calculateEmotionalSecurity` - Calcula segurança emocional do relacionamento
- `calculateSyncScore` - Calcula pontuação de sincronização entre dois humores
- `calculateEmotionalSynchronicity` - Calcula sincronicidade emocional usando algoritmo húngaro
- `calculateMoodCategorySimilarity` - Calcula similaridade entre categorias de humor

### Arquivo: `calculosRelacionamento2.ts`
Funções auxiliares de processamento:
- `findClosestEntry` - Encontra entrada mais próxima dentro de janela de tempo
- `hasSharedContext` - Verifica contexto compartilhado entre entradas
- `calculateMoodSimilarity` - Calcula similaridade entre dois humores
- `calculateValenceSimilarity` - Calcula similaridade de valência entre humores
- `calculateTimeDecay` - Calcula decaimento temporal entre timestamps
- `calculateMoodMatchScore` - Calcula pontuação de correspondência entre humores
- `calculateMoodPatterns` - Analisa padrões de humor e transições
- `calculateDataConsistency` - Avalia consistência dos dados entre usuários
- `calculateFrequencyCorrelation` - Calcula correlação entre frequências de humor
- `hasMatchingActivities` - Verifica atividades correspondentes
- `isSupportiveMood` - Verifica se humor é considerado suportivo
- `hasRelatedContext` - Verifica relação entre contextos
- `calculateMoodVariability` - Calcula variabilidade do humor
- `clipIntensity` - Ajusta intensidade do humor para range válido
- `getMoodValence` - Obtém valência do humor (positivo/negativo)
- `calculateOverallCommunicationScore` - Calcula pontuação geral de comunicação
- `identifyCommunicationTrend` - Identifica tendência na comunicação
- `identifyCommunicationPatterns` - Identifica padrões de comunicação
- `analyzeQualityPattern` - Analisa padrões de qualidade
- `analyzeResolutionPattern` - Analisa padrões de resolução
- `analyzeEmotionalPattern` - Analisa padrões emocionais

### Arquivo: `calculosRelacionamento3.ts`
Funções de insights e análises secundárias:
- `analyzeDominantMoods` - Analisa humores dominantes
- `calculateIntimacyBalance` - Calcula equilíbrio de intimidade
- `generateEmotionalInsights` - Gera insights emocionais
- `determineEmotionalTrend` - Determina tendências emocionais
- `calculateIndividualStability` - Calcula estabilidade individual
- `filterInsightsByCategory` - Filtra insights por categoria
- `filterInsightsByDescription` - Filtra insights por descrição
- `calculateOverallEmotionalHealth` - Calcula saúde emocional geral
- `createDefaultRelationshipContext` - Cria contexto padrão de relacionamento
- `toAnalysisMoodEntry` - Converte entrada para formato de análise
- `checkResolution` - Verifica resolução de conflitos
- `impactToScore` - Converte impacto em pontuação
- `enjoymentToScore` - Converte aproveitamento em pontuação
- `calculateInitiationBalance` - Calcula equilíbrio de iniciativa
- `calculateTimingConsistency` - Calcula consistência temporal
- `countSupportiveResponses` - Conta respostas de suporte
- `analyzeGottmanMetrics` - Analisa métricas de Gottman
- `analyzeEmotionalDynamics` - Analisa dinâmicas emocionais
- `identifyrecommendations` - Identifica recomendações
- `analyzeRelationshipStrengths` - Analisa pontos fortes do relacionamento

## Interfaces Relacionadas
As interfaces necessárias para os cálculos foram mantidas em `src/types/index.ts`:
- `MoodEntry`
- `EmotionalSyncEntry`
- `ValidatedScaleAssessmentData`
- `AssessmentMetadata`
- `RelationshipGoal`
- `GoalProgress`
- `GottmanMetrics`
- `EmotionalDynamics`
- `CategoryAverages`
- `DiscrepancyResult`

## Propósito da Reorganização
A reorganização foi feita para:
1. Melhorar a manutenibilidade do código
2. Separar responsabilidades
3. Facilitar testes unitários
4. Reduzir acoplamento
5. Melhorar legibilidade

Todos os nomes de funções foram mantidos exatamente como no código original para preservar compatibilidade com importações existentes. 