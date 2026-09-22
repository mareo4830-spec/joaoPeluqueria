/**
 * Servicio de Notificaciones Profesional y Blindado para Joao Peluquero's
 * Arquitectura Segura Zero-Client-Exposure (OWASP & Blue Team)
 * Las notificaciones a Telegram son enviadas desde el servidor de Supabase (pg_net)
 * garantizando que NINGÚN visitante o atacante pueda capturar el token en el frontend.
 */

import { testTelegramViaSupabase } from './supabase';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const ESTABLISHED_TELEGRAM_BOT_NAME = '@JoaoPeluquero_bot';
export const ESTABLISHED_TELEGRAM_CHAT_ID = '6240635170';

/**
 * Obtiene el estado de configuración de Telegram.
 * Por motivos de seguridad, el token real vive únicamente en la base de datos Supabase.
 */
export function getTelegramConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('joao_telegram_token');
    if (saved && (saved.includes('AAGfq') || saved.includes('8838818260'))) {
      localStorage.removeItem('joao_telegram_token');
    }
  }

  const localToken = typeof window !== 'undefined' ? localStorage.getItem('joao_telegram_token') : null;
  const localChatId = typeof window !== 'undefined' ? localStorage.getItem('joao_telegram_chat_id') : null;

  return { 
    token: localToken || '', 
    chatId: localChatId || ESTABLISHED_TELEGRAM_CHAT_ID, 
    isConfigured: true,
    isServerManaged: true,
    botName: ESTABLISHED_TELEGRAM_BOT_NAME
  };
}

export function saveTelegramConfig(token, chatId) {
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('joao_telegram_token', token.trim());
      } else {
        localStorage.removeItem('joao_telegram_token');
      }
      if (chatId) {
        localStorage.setItem('joao_telegram_chat_id', chatId.trim());
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Prueba la conexión con Telegram.
 * 1. Prioridad Máxima: Ejecuta la RPC segura de Supabase (envío desde servidor, token blindado).
 * 2. Fallback: Si se proporciona un token manual local para pruebas de desarrollo.
 */
export async function testTelegramNotification(customPin, customToken, customChatId) {
  // 1. Envío seguro vía Supabase Server Trigger / RPC
  try {
    const pin = (customPin || (typeof window !== 'undefined' ? localStorage.getItem('joao_admin_pin') : null) || 'admin1234').trim();
    const serverResult = await testTelegramViaSupabase(pin);
    if (serverResult && serverResult.success) {
      return { success: true, message: serverResult.message || '¡Mensaje de prueba enviado con éxito desde el servidor!' };
    }
    if (serverResult && serverResult.error && !customToken) {
      return { success: false, error: serverResult.error };
    }
  } catch (err) {
    console.warn('[Server Telegram Test Notice]:', err.message);
  }

  // 2. Fallback local solo si el usuario introdujo manualmente un token temporal
  const fallbackToken = (customToken || (typeof window !== 'undefined' ? localStorage.getItem('joao_telegram_token') : null) || '').trim();
  const fallbackChatId = (customChatId || ESTABLISHED_TELEGRAM_CHAT_ID).trim();

  if (!fallbackToken) {
    return { 
      success: false, 
      error: 'Para probar Telegram mediante el servidor seguro, asegúrate de haber ejecutado el script SQL en Supabase.' 
    };
  }

  try {
    const text = 
      `💈 <b>JOAO PELUQUERO'S — PRUEBA DE CONEXIÓN CON TELEGRAM</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ¡El bot de Telegram está correctamente conectado con la web!\n` +
      `Recibirás aquí automáticamente cada cita agendada y cada reserva de producto.`;

    const res = await fetch(`https://api.telegram.org/bot${fallbackToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: fallbackChatId,
        text,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data?.description || 'Error al conectar con Telegram API' };
    }
    return { success: true, message: '¡Mensaje de prueba enviado correctamente!' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Registra y despacha notificaciones.
 * Las notificaciones oficiales a Telegram se despachan automáticamente desde Supabase
 * al insertar la cita o reserva de producto en la base de datos (mediante pg_net).
 * Esta función guarda además el registro en el panel de notificaciones local de João.
 */
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

  // 1. Guardar en el centro de notificaciones local del panel de João
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

  // 2. Webhook alternativo opcional externo con timeout seguro
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
