// public/firebase-messaging-sw.js - VERSÃO ATUALIZADA
console.log("🔥 Firebase Messaging Service Worker carregado");

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado");
  event.waitUntil(clients.claim());
});

// Handler para mensagens push
self.addEventListener("push", (event) => {
  console.log("📲 Push event recebido:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log("📦 Dados da notificação:", data);
  } catch (e) {
    console.error("❌ Erro ao parsear dados push:", e);
  }

  // Configurar notificação baseada no tipo
  let title = "Sistema Imobiliário";
  let body = "Nova notificação do sistema";
  let icon = "/logo192.png";
  let tag = "notificacao";
  let dataToSend = {};

  // Verificar se é notificação de VISITA
  if (data.data && data.data.type === "nova_visita") {
    title = "📍 Nova Visita Agendada";
    body = data.data.clienteNome
      ? `Visita agendada para ${data.data.clienteNome}`
      : "Nova visita foi agendada";
    tag = "visita_agendada";
    dataToSend = {
      type: "nova_visita",
      negociacaoId: data.data.negociacaoId,
      imovelId: data.data.imovelId,
      link: data.data.link || "/negociacoes",
    };

    console.log("📅 Notificação de visita detectada:", dataToSend);
  }
  // Verificar se é notificação genérica do Firebase
  else if (data.notification) {
    title = data.notification.title || title;
    body = data.notification.body || body;
    if (data.data) dataToSend = data.data;
  }

  const options = {
    body: body,
    icon: icon,
    badge: "/logo192.png",
    tag: tag,
    data: dataToSend,
    renotify: true,
    actions: [
      {
        action: "open",
        title: "Abrir",
      },
      {
        action: "close",
        title: "Fechar",
      },
    ],
  };

  console.log("📤 Mostrando notificação:", { title, body, data: dataToSend });

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notificação clicada:", event.notification.data);

  event.notification.close();

  const data = event.notification.data;

  if (event.action === "open" || !event.action) {
    // Redireciona para a página apropriada
    let url = "/";

    if (data?.type === "nova_visita" && data.negociacaoId) {
      url = `/negociacoes/${data.negociacaoId}`;
      console.log("🔗 Redirecionando para negociação:", data.negociacaoId);
    } else if (data?.type === "lead") {
      url = "/leads";
    } else if (data?.type === "agendamento") {
      url = "/agendamentos";
    }

    console.log("🌐 Abrindo URL:", url);

    event.waitUntil(clients.openWindow(url));
  }
});

// Handler para mensagens do cliente
self.addEventListener("message", (event) => {
  console.log("📨 Mensagem do cliente:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
