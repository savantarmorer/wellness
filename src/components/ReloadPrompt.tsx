import { useEffect, useState } from 'react';
import { Snackbar, Button, Stack } from '@mui/material';

function ReloadPrompt() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('controllerchange', () => {
          if (showReload) {
            window.location.reload();
          }
        });
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'RELOAD_PAGE') {
          setShowReload(true);
        }
      });
    }
  }, [showReload]);

  const handleClose = () => {
    setShowReload(false);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Snackbar
      open={showReload}
      message="Nova versão disponível"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          backgroundColor: 'background.paper',
          color: 'text.primary',
        },
      }}
      action={
        <Stack direction="row" spacing={1}>
          <Button
            color="secondary"
            size="small"
            onClick={handleClose}
            sx={{ color: 'text.secondary' }}
          >
            Depois
          </Button>
          <Button
            color="primary"
            size="small"
            onClick={handleReload}
            variant="contained"
          >
            Atualizar
          </Button>
        </Stack>
      }
    />
  );
}

export default ReloadPrompt; 