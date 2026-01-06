// src/services/firebaseConfig.ts - VERSÃO CORRIGIDA
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Verifica se o Firebase Messaging é suportado
let messaging: any = null;

export const initializeMessaging = async () => {
    try {
        const supported = await isSupported();
        if (supported) {
            const { getMessaging } = await import("firebase/messaging");
            messaging = getMessaging(app);
            console.log('✅ Firebase Messaging inicializado');
        } else {
            console.warn('⚠️ Firebase Messaging não é suportado neste navegador');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Messaging:', error);
    }
    return messaging;
};

export const getFirebaseToken = async (): Promise<string | null> => {
    try {
        if (!messaging) {
            messaging = await initializeMessaging();
        }

        if (!messaging) {
            console.warn('Messaging não disponível');
            return null;
        }

        // Verifica se o service worker está registrado
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker não suportado');
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        if (!registration) {
            console.warn('Service Worker não registrado');
            return null;
        }

        // Solicita permissão se necessário
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('Permissão de notificação não concedida:', permission);
            return null;
        }

        // Obtém o token
        const token = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('✅ Token FCM obtido:', token.substring(0, 20) + '...');
            return token;
        } else {
            console.warn('Nenhum token disponível');
            return null;
        }

    } catch (error: any) {
        console.error('❌ Erro ao obter token FCM:', error);

        // Erros específicos do Firebase
        if (error.code === 'messaging/permission-blocked') {
            console.error('Permissão bloqueada pelo usuário');
        } else if (error.code === 'messaging/permission-default') {
            console.error('Usuário ainda não decidiu sobre a permissão');
        } else if (error.code === 'messaging/unsupported-browser') {
            console.error('Navegador não suportado');
        }

        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (messaging) {
            onMessage(messaging, (payload) => {
                console.log('📲 Mensagem recebida em primeiro plano:', payload);
                resolve(payload);
            });
        }
    });

// Inicializa na importação
initializeMessaging();