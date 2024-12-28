import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export interface Notification {
  id?: string;
  userId: string;
  type: 'assessment_completed' | 'analysis_ready' | 'reminder' | 'goal_achieved' | 'partner_invitation';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    assessmentId?: string;
    inviterId?: string;
    inviterEmail?: string;
  };
}

// Classe para gerenciar notificações push
class PushNotificationService {
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/sounds/notification.mp3');
    }
  }

  async requestPermission(userId: string): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Obter token do FCM
        const messaging = getMessaging();
        const token = await getToken(messaging);

        // Salvar token no Firestore
        const userDoc = doc(db, 'users', userId);
        const userData = await getDoc(userDoc);
        
        await setDoc(userDoc, {
          ...userData.data(),
          fcmToken: token,
          notificationsEnabled: true
        });

        // Configurar handler de mensagens
        onMessage(messaging, (payload) => {
          this.showNotification(payload);
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão para notificações:', error);
    }
  }

  private async showNotification(payload: any) {
    // Tocar som
    if (this.audio) {
      try {
        await this.audio.play();
      } catch (error) {
        console.error('Erro ao tocar som de notificação:', error);
      }
    }

    // Mostrar notificação se o app não estiver em foco
    if (!document.hasFocus() && 'Notification' in window) {
      const notification = new Notification('Dr. Bread', {
        body: payload.notification?.body || 'Nova notificação',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        silent: true, // Som é controlado manualmente
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  async disableNotifications(userId: string): Promise<void> {
    try {
      const userDoc = doc(db, 'users', userId);
      const userData = await getDoc(userDoc);
      
      await setDoc(userDoc, {
        ...userData.data(),
        notificationsEnabled: false,
        fcmToken: null
      });
    } catch (error) {
      console.error('Erro ao desabilitar notificações:', error);
    }
  }
}

// Serviço de notificações existente
export const addPartnerInvitation = async (
  inviterId: string,
  inviterEmail: string,
  targetUserEmail: string
): Promise<void> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetUserEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Usuário não encontrado');
    }

    const targetUser = snapshot.docs[0];
    const notification: Notification = {
      userId: targetUser.id,
      type: 'partner_invitation',
      title: 'Convite de Parceiro',
      message: `${inviterEmail} gostaria de se conectar com você como parceiro.`,
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        inviterId,
        inviterEmail
      }
    };

    await addNotification(notification);
  } catch (error) {
    console.error('Error sending partner invitation:', error);
    throw new Error('Erro ao enviar convite de parceiro');
  }
};

export const addNotification = async (notification: Notification): Promise<string> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, notification);
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw new Error('Erro ao criar notificação');
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Erro ao marcar notificação como lida');
  }
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw new Error('Erro ao obter notificações não lidas');
  }
};

export const subscribeToNotifications = (
  userId: string,
  onNotification: (notifications: Notification[]) => void
) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    onNotification(notifications);
  });
};

// Exportar instância do serviço de notificações push
export const pushNotificationService = new PushNotificationService(); 