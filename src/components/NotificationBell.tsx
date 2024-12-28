import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext';
import { Notification, subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    console.log('NotificationBell - Usuário atual:', currentUser?.uid);
    if (!currentUser) return;

    console.log('NotificationBell - Iniciando inscrição nas notificações');
    const unsubscribe = subscribeToNotifications(currentUser.uid, (newNotifications) => {
      console.log('NotificationBell - Novas notificações recebidas:', newNotifications);
      setNotifications(newNotifications);
    });

    return () => {
      console.log('NotificationBell - Cancelando inscrição nas notificações');
      unsubscribe();
    };
  }, [currentUser]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('NotificationBell - Menu aberto');
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    console.log('NotificationBell - Menu fechado');
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('NotificationBell - Notificação clicada:', notification);
    if (!notification.id) return;

    try {
      await markNotificationAsRead(notification.id);
      console.log('NotificationBell - Notificação marcada como lida');

      if (notification.type === 'partner_invitation' && notification.data?.inviterId) {
        console.log('NotificationBell - Aceitando convite de parceiro');
        const userRef = doc(db, 'users', currentUser!.uid);
        await updateDoc(userRef, {
          partnerId: notification.data.inviterId
        });
        console.log('NotificationBell - Convite aceito com sucesso');
      }

      handleClose();
    } catch (error) {
      console.error('NotificationBell - Erro ao processar notificação:', error);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'partner_invitation':
        return (
          <MenuItem onClick={() => handleNotificationClick(notification)}>
            <div>
              <Typography variant="subtitle2">{notification.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="primary">
                Clique para aceitar o convite
              </Typography>
            </div>
          </MenuItem>
        );
      default:
        return (
          <MenuItem onClick={() => handleNotificationClick(notification)}>
            <div>
              <Typography variant="subtitle2">{notification.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
            </div>
          </MenuItem>
        );
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            maxHeight: '80vh',
            width: '300px',
            overflow: 'auto',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              {renderNotificationContent(notification)}
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
}; 