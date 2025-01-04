import { processUpdateQueue } from './analysisHistoryService';
import { auth } from './firebase';

// Processa a fila de atualizações a cada 5 minutos
export const startUpdateQueueProcessor = () => {
  const INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos

  const processQueue = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in, skipping update queue processing');
        return;
      }
      await processUpdateQueue(currentUser.uid);
    } catch (error) {
      console.error('Error processing update queue:', error);
    }
  };

  // Processa imediatamente ao iniciar
  processQueue();

  // Configura o intervalo de processamento
  const intervalId = setInterval(processQueue, INTERVAL);

  // Retorna uma função para parar o processamento se necessário
  return () => clearInterval(intervalId);
};

// Inicia o processamento quando o app é carregado
export const initializeScheduledTasks = () => {
  const stopUpdateProcessor = startUpdateQueueProcessor();

  // Retorna uma função para limpar todas as tarefas agendadas
  return () => {
    stopUpdateProcessor();
  };
}; 