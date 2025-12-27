importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Essas infos você pega no Console do Firebase > Configurações do Projeto
const firebaseConfig = {
  apiKey: "AIzaSyDjWrD4Y0N5nfRYEREq6il0TmoA7libZs4",
  authDomain: "sistema-imobiliario4.firebaseapp.com",
  projectId: "sistema-imobiliario4",
  storageBucket: "sistema-imobiliario4.appspot.com",
  messagingSenderId: "1027177777810", // ID REAL
  appId: "1:1027177777810:web:1f9b65a45722ee9fccb44b", // ID REAL
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Captura a notificação quando o app está em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log("Mensagem recebida em background: ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
    data: { url: "/leads" }, // Faz abrir na tela de leads ao clicar
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
