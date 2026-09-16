/**
 * Servicio de Notificaciones Profesional para Joao Peluquero's
 * Notificaciones automáticas de citas y reservas gratuitas con sanitización robusta
 */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getTelegramConfig() {
  const token = (typeof window !== 'undefined' ? localStorage.getItem('joao_telegram_token') : null) || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  const chatId = (typeof window !== 'undefined' ? localStorage.getItem('joao_telegram_chat_id') : null) || import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
  return { 
    token: token.trim(), 
    chatId: chatId.trim(), 
    isConfigured: Boolean(token.trim() && chatId.trim()) 
  };
}

export function saveTelegramConfig(token, chatId) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('joao_telegram_token', (token || '').trim());
      localStorage.setItem('joao_telegram_chat_id', (chatId || '').trim());
    }
    return true;
  } catch {
    return false;
  }
}

export async function testTelegramNotification(customToken, customChatId) {
  const config = getTelegramConfig();
  const token = (customToken ? customToken.trim() : config.token);
  const chatId = (customChatId ? customChatId.trim() : config.chatId);

  if (!token || !chatId) {
    return { success: false, error: 'Debes proporcionar tanto el Bot Token como el Chat ID de Telegram.' };
  }

  try {
    const text = 
      `💈 <b>JOAO PELUQUERO'S — PRUEBA DE CONEXIÓN CON TELEGRAM</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ¡El bot de Telegram está correctamente conectado con la web!\n` +
      `Recibirás aquí automáticamente cada cita agendada y cada reserva de producto.`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data?.description || 'Error al conectar con Telegram API' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function sendNotification({ type, title, customerName, customerPhone, details, amount }) {
  const timestamp = new Date().toLocaleString('es-ES', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });

  const payload = {
    type, // 'appointment' or 'product_reservation'
    title,
    customerName,
    customerPhone,
    details,
    amount,
    timestamp
  };

  // 1. Guardar en localStorage para el centro de notificaciones de João
  try {
    const existing = JSON.parse(localStorage.getItem('joao_admin_notifications') || '[]');
    existing.unshift({
      id: 'notif-' + Date.now(),
      ...payload,
      read: false
    });
    localStorage.setItem('joao_admin_notifications', JSON.stringify(existing.slice(0, 50)));
  } catch {
    // ignore
  }

  // 2. Notificación Directa a TELEGRAM BOT con sanitización HTML y timeout
  const { token: telegramToken, chatId: telegramChatId } = getTelegramConfig();

  if (telegramToken && telegramChatId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const isProduct = type === 'product_reservation';
      const telegramText = 
        `💈 <b>JOAO PELUQUERO'S — ${isProduct ? 'RESERVA DE PRODUCTO' : 'NUEVA CITA'}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Cliente:</b> ${escapeHtml(customerName)}\n` +
        `📞 <b>Teléfono:</b> ${escapeHtml(customerPhone)}\n` +
        `📋 <b>Servicio / Pedido:</b> ${escapeHtml(details)}\n` +
        `💶 <b>Importe:</b> ${escapeHtml(amount || 'N/A')}\n` +
        `⏰ <b>Registro:</b> ${escapeHtml(timestamp)}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👉 <i>Gestionar en tu panel: /admin</i>`;

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: telegramText,
          parse_mode: 'HTML'
        }),
        signal: controller.signal
      });
    } catch (tgErr) {
      console.warn('[Telegram Notification Error]:', tgErr.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 3. Webhook alternativo opcional con timeout seguro
  const webhookUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    const hookController = new AbortController();
    const hookTimeout = setTimeout(() => hookController.abort(), 5000);

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 **${title}**\n👤 Cliente: ${customerName}\n📞 Teléfono: ${customerPhone}\n📋 Detalles: ${details}\n💶 Importe: ${amount}\n⏰ Fecha: ${timestamp}`
        }),
        signal: hookController.signal
      });
    } catch (err) {
      console.warn('[Notification Webhook Warning]:', err.message);
    } finally {
      clearTimeout(hookTimeout);
    }
  }

  return { success: true };
}
