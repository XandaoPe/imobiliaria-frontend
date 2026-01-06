// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// ⚠️ CONFIGURAÇÃO COMPLETA DO FIREBASE (use suas chaves reais)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDjWrD4Y0N5nfRYEREq6il0TmoA7libZs4",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sistema-imobiliario4.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sistema-imobiliario4",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sistema-imobiliario4.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1027177777810",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1027177777810:web:1f9b65a45722ee9fccb44b"
};

console.log('🔥 Firebase Config:', {
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId
});

// Inicialização segura
let app;
let messaging: any = null;

// Função assíncrona para inicialização
const initializeFirebase = async () => {
    try {
        app = initializeApp(firebaseConfig);

        // Verifica se o navegador suporta Firebase Messaging
        const messagingSupported = await isSupported();
        if (messagingSupported) {
            messaging = getMessaging(app);
            console.log('✅ Firebase Messaging inicializado');
        } else {
            console.warn('⚠️ Firebase Messaging não é suportado neste navegador');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        // Não quebra o app - apenas não teremos notificações
    }
};

// Inicializa o Firebase
initializeFirebase();

export const getFirebaseToken = async (): Promise<string | null> => {
    if (!messaging) {
        console.warn('Firebase Messaging não está disponível');
        return null;
    }

    try {
        // Verifica permissão
        let permission = Notification.permission;

        if (permission === 'default') {
            console.log('Solicitando permissão de notificação...');
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('Permissão de notificação não concedida:', permission);
            return null;
        }

        // Chave VAPID - use a correta do seu projeto
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY ||
            "BMOGp1Qttb9wbQLHfsW85RW9znVFXiiukT9tNzzAdUN0_Evj9jmC-5821_KGJv3X30XvmUarpgIyABnBnRpzVCg";

        console.log('Obtendo token FCM com VAPID key...');
        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log('✅ Token FCM obtido com sucesso');
            console.log('Token (início):', token.substring(0, 30) + '...');
            return token;
        } else {
            console.warn('Nenhum token FCM disponível. Verifique:');
            console.warn('1. Service Worker está registrado?');
            console.warn('2. VAPID key está correta?');
            return null;
        }
    } catch (err: any) {
        console.error('❌ Erro ao obter token Firebase:', err);

        // Erros comuns
        if (err.code === 'messaging/permission-blocked') {
            console.error('Permissão bloqueada pelo usuário');
        } else if (err.code === 'messaging/unsupported-browser') {
            console.error('Navegador não suportado');
        }

        return null;
    }
};

// Listener para mensagens quando o app está aberto (foreground)
export const onMessageListener = () =>
    new Promise((resolve) => {
        if (messaging) {
            onMessage(messaging, (payload: any) => {
                console.log('📲 Mensagem recebida em primeiro plano:', payload);

                // Mostra notificação mesmo em primeiro plano
                if (payload.notification && Notification.permission === 'granted') {
                    const title = payload.notification.title || 'Nova Notificação';
                    const body = payload.notification.body || '';

                    new Notification(title, {
                        body: body,
                        icon: '/logo192.png'
                    });
                }

                resolve(payload);
            });
        } else {
            console.warn('Messaging não disponível para onMessageListener');
            resolve(null);
        }
    });

// Exporta para uso em outros lugares
export { messaging };