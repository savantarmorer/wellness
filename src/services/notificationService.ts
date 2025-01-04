import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';
import type { NearbyPlace } from './locationService';

const messaging = getMessaging(app);

export interface Notification {
  id?: string;
  userId: string;
  type: 'assessment_completed' | 'analysis_ready' | 'reminder' | 'goal_achieved' | 'partner_invitation' | 'dateInvite';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    assessmentId?: string;
    inviterId?: string;
    inviterEmail?: string;
    place?: NearbyPlace;
    date?: string;
    fromUserId?: string;
    notes?: string;
  };
}

export const addPartnerInvitation = async (
  inviterId: string,
  inviterEmail: string,
  targetUserEmail: string
): Promise<void> => {
  try {
    // First, find the user with the target email
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
  }, (error) => {
    if (error.code === 'permission-denied') {
      console.log('Permission denied for notifications - user likely logged out');
      return;
    }
    console.error('Error in notifications subscription:', error);
  });
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const scheduleReminderNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    // Agendar notificação para 20h se ainda não fez a avaliação
    const now = new Date();
    const reminderTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      20, // 20h
      0,
      0
    );

    if (now < reminderTime) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      setTimeout(() => {
        new Notification('Lembrete de Avaliação', {
          body: 'Não se esqueça de fazer sua avaliação diária!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'daily-reminder'
        });
      }, timeUntilReminder);
    }
  }
};

export const showWelcomeBack = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Bem-vindo(a) de volta!', {
      body: 'Continue mantendo seu relacionamento saudável.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'welcome-back'
    });
  }
};

interface DateInvite {
  fromUserId: string;
  toUserId: string;
  place: NearbyPlace;
  date: Date;
  notes?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export const sendDateInvite = async ({
  fromUserId,
  toUserId,
  place,
  date,
  notes,
}: Omit<DateInvite, 'status' | 'createdAt'>) => {
  try {
    const invite: DateInvite = {
      fromUserId,
      toUserId,
      place,
      date,
      notes,
      status: 'pending',
      createdAt: new Date(),
    };

    // Adiciona o convite ao Firestore
    const invitesRef = collection(db, 'dateInvites');
    await addDoc(invitesRef, {
      ...invite,
      date: date.toISOString(),
      createdAt: serverTimestamp(),
    });

    // Adiciona uma notificação para o parceiro
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: toUserId,
      type: 'dateInvite',
      title: 'Novo convite de encontro!',
      message: `Você recebeu um convite para um encontro em ${place.name}`,
      read: false,
      createdAt: serverTimestamp(),
      data: {
        place,
        date: date.toISOString(),
        fromUserId,
        notes,
      },
    });
  } catch (error) {
    console.error('Error sending date invite:', error);
    throw error;
  }
}; 