import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { Layout } from '../components/Layout';
import { AnalysisHistoryList } from '../components/AnalysisHistoryList';
import { getAnalysisHistory, clearAnalysisHistory, cleanupInvalidAnalyses } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import type { GPTAnalysis } from '../types';
import { MigrationTool } from '../components/MigrationTool';

const AnalysisHistory = () => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<GPTAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCleanupDialog, setOpenCleanupDialog] = useState(false);
  const [cleanupSuccess, setCleanupSuccess] = useState(false);

  const convertToGPTAnalysis = (analysis: any): any => {
    // If it's already a string, wrap it in a text report format
    if (typeof analysis === 'string') {
      return {
        overallHealth: { score: 0, trend: 'neutral' },
        categories: {},
        strengthsAndChallenges: {
          strengths: [],
          challenges: []
        },
        communicationSuggestions: [],
        actionItems: [],
        relationshipDynamics: {
          positivePatterns: [],
          concerningPatterns: [],
          growthAreas: []
        },
        emotionalDynamics: {
          emotionalSecurity: 0,
          intimacyBalance: {
            score: 0,
            areas: {
              emotional: 0,
              physical: 0,
              intellectual: 0,
              shared: 0
            }
          },
          conflictResolution: {
            style: 'undefined',
            effectiveness: 0,
            patterns: []
          }
        },
        textReport: analysis
      };
    }

    // If it's already an object, ensure it has all required fields
    if (typeof analysis === 'object' && analysis !== null) {
      return {
        overallHealth: analysis.overallHealth || { score: 0, trend: 'neutral' },
        categories: analysis.categories || {},
        strengthsAndChallenges: analysis.strengthsAndChallenges || {
          strengths: [],
          challenges: []
        },
        communicationSuggestions: analysis.communicationSuggestions || [],
        actionItems: analysis.actionItems || [],
        relationshipDynamics: analysis.relationshipDynamics || {
          positivePatterns: [],
          concerningPatterns: [],
          growthAreas: []
        },
        emotionalDynamics: analysis.emotionalDynamics || {
          emotionalSecurity: 0,
          intimacyBalance: {
            score: 0,
            areas: {
              emotional: 0,
              physical: 0,
              intellectual: 0,
              shared: 0
            }
          },
          conflictResolution: {
            style: 'undefined',
            effectiveness: 0,
            patterns: []
          }
        },
        textReport: analysis.textReport || ''
      };
    }

    // If neither string nor object, return a default structure
    return {
      overallHealth: { score: 0, trend: 'neutral' },
      categories: {},
      strengthsAndChallenges: {
        strengths: [],
        challenges: []
      },
      communicationSuggestions: [],
      actionItems: [],
      relationshipDynamics: {
        positivePatterns: [],
        concerningPatterns: [],
        growthAreas: []
      },
      emotionalDynamics: {
        emotionalSecurity: 0,
        intimacyBalance: {
          score: 0,
          areas: {
            emotional: 0,
            physical: 0,
            intellectual: 0,
            shared: 0
          }
        },
        conflictResolution: {
          style: 'undefined',
          effectiveness: 0,
          patterns: []
        }
      },
      textReport: 'Invalid analysis format'
    };
  };

  const fetchAnalyses = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const analysisRecords = await getAnalysisHistory(currentUser.uid);
      console.log('Raw analysis records:', analysisRecords);

      const convertedAnalyses: GPTAnalysis[] = analysisRecords
        .filter(record => record.id)
        .map(record => {
          console.log('Processing record:', {
            id: record.id,
            type: record.type,
            analysisType: typeof record.analysis,
            analysisValue: record.analysis
          });

          let parsedAnalysis;
          try {
            // Handle both string and object analysis data
            if (typeof record.analysis === 'string') {
              try {
                parsedAnalysis = JSON.parse(record.analysis);
              } catch {
                // If parsing fails, treat it as a text report
                parsedAnalysis = record.analysis;
              }
            } else {
              parsedAnalysis = record.analysis;
            }
          } catch (e) {
            console.error('Error parsing analysis:', e);
            console.error('Problematic record:', record);
            parsedAnalysis = record.analysis;
          }

          // Convert to proper GPTAnalysis format
          const convertedAnalysis = convertToGPTAnalysis(parsedAnalysis);

          return {
            id: record.id!,
            userId: record.userId,
            partnerId: record.partnerId || '',
            date: record.date,
            type: record.type,
            analysis: convertedAnalysis,
            createdAt: record.createdAt.toString()
          };
        });

      setAnalyses(convertedAnalyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setError('Erro ao carregar o histórico de análises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [currentUser]);

  const handleClearHistory = async () => {
    if (!currentUser) return;

    try {
      await clearAnalysisHistory(currentUser.uid);
      setAnalyses([]);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Erro ao limpar o histórico');
    }
  };

  const handleCleanupAnalyses = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await cleanupInvalidAnalyses(currentUser.uid);
      await fetchAnalyses();
      setCleanupSuccess(true);
      setOpenCleanupDialog(false);
    } catch (error) {
      console.error('Error cleaning up analyses:', error);
      setError('Erro ao limpar análises inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Histórico de Análises
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {analyses.length > 0 ? (
              <>
                <Tooltip title="Limpar análises inválidas">
                  <IconButton
                    onClick={() => setOpenCleanupDialog(true)}
                    color="primary"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Limpar histórico">
                  <IconButton
                    onClick={() => setOpenDialog(true)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Limpar análises inválidas">
                  <span>
                    <IconButton
                      disabled
                      color="primary"
                    >
                      <CleaningServicesIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Limpar histórico">
                  <span>
                    <IconButton
                      disabled
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {cleanupSuccess && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setCleanupSuccess(false)}
          >
            Análises inválidas foram removidas com sucesso.
          </Alert>
        )}

        <MigrationTool />

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : analyses.length === 0 ? (
          <Typography>Nenhuma análise encontrada.</Typography>
        ) : (
          <AnalysisHistoryList analyses={analyses} />
        )}

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja limpar todo o histórico de análises? Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleClearHistory} color="error" autoFocus>
              Limpar Histórico
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openCleanupDialog}
          onClose={() => setOpenCleanupDialog(false)}
        >
          <DialogTitle>Confirmar Limpeza</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Esta ação irá remover todas as análises que não correspondem ao formato atual. 
              Isso ajudará a manter apenas as análises válidas no histórico. 
              Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCleanupDialog(false)}>Cancelar</Button>
            <Button onClick={handleCleanupAnalyses} color="primary" autoFocus>
              Limpar Análises Inválidas
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default AnalysisHistory;