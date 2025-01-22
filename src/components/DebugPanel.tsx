import React from 'react';
import { Box, Typography, List, ListItem, IconButton } from '@mui/material';
import { useDebug } from '../contexts/DebugContext';
import BugReportIcon from '@mui/icons-material/BugReport';

interface DebugPanelProps {
  logs: string[];
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs }) => {
  const { isDebugMode, toggleDebug } = useDebug();

  if (!isDebugMode) {
    return (
      <IconButton onClick={toggleDebug} sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <BugReportIcon />
      </IconButton>
    );
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, maxWidth: 400, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3 }}>
      <Typography variant="h6">Debug Panel</Typography>
      <List dense>
        {logs.map((log, index) => (
          <ListItem key={index}>{log}</ListItem>
        ))}
      </List>
      <IconButton onClick={toggleDebug}>
        <BugReportIcon />
      </IconButton>
    </Box>
  );
}; 