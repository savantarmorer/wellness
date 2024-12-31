import { Box, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DailyAssessmentWithRatings } from '../types';

interface Props {
  assessments: DailyAssessmentWithRatings[];
}

export const AssessmentChart: React.FC<Props> = ({ assessments }) => {
  const chartData = assessments.map(assessment => ({
    date: new Date(assessment.date).toLocaleDateString(),
    ...assessment.ratings
  }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Histórico de Avaliações
      </Typography>
      <LineChart width={800} height={400} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.keys(chartData[0] || {}).map((key, index) => {
          if (key !== 'date') {
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`hsl(${index * 45}, 70%, 50%)`}
              />
            );
          }
          return null;
        })}
      </LineChart>
    </Box>
  );
}; 