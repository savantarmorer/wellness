import { useEffect, useState } from 'react';
import { Snackbar, Button } from '@mui/material';

function ReloadPrompt() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowReload(true);
              }
            });
          }
        });
      }).catch(error => {
        console.log('SW registration failed:', error);
      });

      // Listen for controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
  }, []);

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
      action={
        <>
          <Button color="secondary" size="small" onClick={handleClose}>
            Depois
          </Button>
          <Button color="primary" size="small" onClick={handleReload}>
            Atualizar
          </Button>
        </>
      }
    />
  );
}

export default ReloadPrompt; 