import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

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
  });
}; 