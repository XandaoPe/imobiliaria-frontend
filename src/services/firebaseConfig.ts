// src/services/firebaseConfig.ts - VERSÃO SIMPLIFICADA
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDjWrD4Y0N5nfRYEREq6il0TmoA7libZs4",
    authDomain: "sistema-imobiliario4.firebaseapp.com",
    projectId: "sistema-imobiliario4",
    storageBucket: "sistema-imobiliario4.appspot.com",
    messagingSenderId: "1027177777810",
    appId: "1:1027177777810:web:1f9b65a45722ee9fccb44b"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

console.log('✅ Firebase configurado');

export const getFirebaseToken = async (): Promise<string | null> => {
    try {
        // 1. Verifica permissão
        const permission = Notification.permission;

        if (permission !== 'granted') {
            console.log('Solicitando permissão...');
            const newPermission = await Notification.requestPermission();
            if (newPermission !== 'granted') {
                console.warn('Permissão negada');
                return null;
            }
        }

        // 2. Chave VAPID
        const vapidKey = "BMOGp1Qttb9wbQLHfsW85RW9znVFXiiukT9tNzzAdUN0_Evj9jmC-5821_KGJv3X30XvmUarpgIyABnBnRpzVCg";

        // 3. Obtém token
        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log('✅ Token FCM obtido');
            return token;
        }

        console.warn('Token não disponível');
        return null;

    } catch (error) {
        console.error('❌ Erro no Firebase:', error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload: any) => {
            console.log('📲 Notificação recebida:', payload);

            // Mostra notificação
            if (payload.notification && Notification.permission === 'granted') {
                new Notification(
                    payload.notification.title || 'Notificação',
                    {
                        body: payload.notification.body || '',
                        icon: '/logo192.png'
                    }
                );
            }

            resolve(payload);
        });
    });

export { messaging };

export const setupAgendaNotificationHandler = () => {
    onMessage(messaging, (payload: any) => {
        console.log('📅 Notificação de agenda recebida:', payload);

        if (payload.data?.type === 'new_agendamento' || payload.data?.type === 'status_agendamento') {
            // Dispara evento para atualizar contadores
            window.dispatchEvent(new CustomEvent('agendaNotification'));

            // Mostra notificação local
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || 'Nova Agenda', {
                    body: payload.notification?.body || '',
                    icon: '/logo192.png'
                });
            }
        }
    });
};