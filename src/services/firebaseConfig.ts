// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { deleteToken } from "firebase/messaging";


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

export const limparTokenFirebase = async (): Promise<void> => {
    try {
        if (!messaging) {
            console.warn('Messaging não disponível para limpar');
            return;
        }

        // 1. Remove o token do Firebase
        await deleteToken(messaging);
        console.log('✅ Token Firebase removido');

        // 2. Remove a subscription do Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    console.log('✅ Subscription removida');
                }
            } catch (swError) {
                console.warn('Erro ao remover subscription:', swError);
            }
        }

        // 3. Limpa cache local
        localStorage.removeItem('fcmToken');
        sessionStorage.removeItem('fcmToken');

    } catch (error) {
        console.error('❌ Erro ao limpar token Firebase:', error);
    }
};

// ⭐️ FUNÇÃO PARA GERAR NOVO TOKEN (com cache local)
export const getFirebaseToken = async (): Promise<string | null> => {
    try {
        // Verifica se já tem token em cache (por usuário)
        const userId = localStorage.getItem('currentUserId');
        const cachedTokenKey = `fcmToken_${userId}`;
        const cachedToken = localStorage.getItem(cachedTokenKey);

        if (cachedToken) {
            console.log('✅ Usando token FCM em cache para usuário:', userId);
            return cachedToken;
        }

        if (!messaging) {
            console.warn('Firebase Messaging não está disponível');
            return null;
        }

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

        // Chave VAPID
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY ||
            "BMOGp1Qttb9wbQLHfsW85RW9znVFXiiukT9tNzzAdUN0_Evj9jmC-5821_KGJv3X30XvmUarpgIyABnBnRpzVCg";

        console.log('Gerando NOVO token FCM...');
        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log('✅ Novo token FCM gerado');

            // Salva no cache local com ID do usuário
            if (userId) {
                localStorage.setItem(cachedTokenKey, token);
                console.log('Token salvo em cache para usuário:', userId);
            }

            return token;
        }

        return null;

    } catch (err: any) {
        console.error('❌ Erro ao obter token Firebase:', err);
        return null;
    }
};

export const forcarNovoToken = async (): Promise<string | null> => {
    try {
        // 1. Limpa token antigo
        await limparTokenFirebase();

        // 2. Remove cache local
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
            localStorage.removeItem(`fcmToken_${userId}`);
        }

        // 3. Aguarda um momento
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Gera novo token
        return await getFirebaseToken();

    } catch (error) {
        console.error('Erro ao forçar novo token:', error);
        return null;
    }
};

export { messaging };