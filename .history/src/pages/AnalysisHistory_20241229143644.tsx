import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import AnalysisHistoryList from '../components/AnalysisHistoryList';
import type { AnalysisHistoryItem } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analysis-tab-${index}`,
    'aria-controls': `analysis-tabpanel-${index}`,
  };
}

export default function AnalysisHistory() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        const analysisRef = collection(db, 'analysisHistory');
        const q = query(
          analysisRef,
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        const analysisData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AnalysisHistoryItem[];

        setAnalyses(analysisData);
      } catch (error) {
        console.error('Error fetching analyses:', error);
        setError('Erro ao carregar o histórico de análises.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [currentUser]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const individualAnalyses = analyses.filter((a) => a.type === 'individual');
  const combinedAnalyses = analyses.filter((a) => a.type === 'combined');

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Histórico de Análises
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="analysis history tabs"
            >
              <Tab label="Todas" {...a11yProps(0)} />
              <Tab label="Individuais" {...a11yProps(1)} />
              <Tab label="Combinadas" {...a11yProps(2)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <AnalysisHistoryList analyses={analyses} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AnalysisHistoryList analyses={individualAnalyses} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <AnalysisHistoryList analyses={combinedAnalyses} />
          </TabPanel>
        </Box>
      </Container>
    </Layout>
  );
} 