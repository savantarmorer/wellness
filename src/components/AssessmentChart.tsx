import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyAssessmentWithRatings } from '../types';

const METRICS: Record<string, string> = {
  comunicacao: 'Comunicação',
  conexaoEmocional: 'Conexão Emocional',
  apoioMutuo: 'Apoio Mútuo',
  transparenciaConfianca: 'Transparência e Confiança',
  intimidadeFisica: 'Intimidade Física',
  saudeMental: 'Saúde Mental',
  resolucaoConflitos: 'Resolução de Conflitos',
  segurancaRelacionamento: 'Segurança no Relacionamento',
  satisfacaoGeral: 'Satisfação Geral',
  alinhamentoObjetivos: 'Alinhamento de Objetivos',
  intimidade: 'Intimidade',
  autocuidado: 'Autocuidado',
  gratidao: 'Gratidão',
  qualidadeTempo: 'Qualidade do Tempo'
};

interface Props {
  assessments: DailyAssessmentWithRatings[];
  loading?: boolean;
  title?: string;
}

export const AssessmentChart: React.FC<Props> = ({ 
  assessments, 
  loading = false,
  title = 'Histórico de Avaliações'
}) => {
  console.log('AssessmentChart props:', { assessments, loading, title });

  if (loading) {
    return (
      <Paper sx={{ p: 3, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  // Handle empty assessments
  if (!assessments || assessments.length === 0) {
    return (
      <Paper sx={{ p: 3, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Nenhum dado disponível para exibir no gráfico
        </Typography>
      </Paper>
    );
  }

  const chartData = assessments.map(assessment => {
    console.log('Processing assessment:', assessment);
    return {
      date: new Date(assessment.date).toLocaleDateString(),
      ...assessment.ratings
    };
  });

  console.log('Chart data:', chartData);

  // Get metrics that exist in the data
  const metrics = Object.keys(chartData[0] || {}).filter(key => key !== 'date');
  console.log('Available metrics:', metrics);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 5]} /> 
            <Tooltip />
            <Legend />
            {metrics.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`hsl(${index * 45}, 70%, 50%)`}
                dot={false}
                name={METRICS[key] || key}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}; 