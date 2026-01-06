// public/firebase-messaging-sw.js - VERSÃO SIMPLIFICADA
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push recebido");

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      notification: {
        title: "Nova Notificação",
        body: "Clique para ver mais detalhes",
      },
    };
  }

  const options = {
    body: data.notification?.body || "Nova mensagem",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "push-notification",
    data: data.data || {},
    requireInteraction: true,
    actions: [{ action: "open", title: "Abrir" }],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || "Sistema Imobiliário",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notificação clicada");
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Se estiver usando Firebase, adicione também:
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDjWrD4Y0N5nfRYEREq6il0TmoA7libZs4",
  authDomain: "sistema-imobiliario4.firebaseapp.com",
  projectId: "sistema-imobiliario4",
  storageBucket: "sistema-imobiliaria4.appspot.com",
  messagingSenderId: "1027177777810",
  appId: "1:1027177777810:web:1f9b65a45722ee9fccb44b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Firebase: Mensagem em background", payload);

  const notificationTitle = payload.notification?.title || "Nova Notificação";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "firebase-notification",
    data: payload.data || {},
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
