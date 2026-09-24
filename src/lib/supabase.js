import { createClient } from '@supabase/supabase-js';

// Configuración Oficial de Supabase para João Peluquero's
export const DEFAULT_SUPABASE_URL = 'https://whfatmjogohwgiipzaup.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmF0bWpvZ29od2dpaXB6YXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDE2NTAsImV4cCI6MjEwNTA3NzY1MH0.QeINJ9jVqlm_qWf3SFTgu_fMKM8cunv3BRdf6a0bM8o';

// Cargar variables de Vite con respaldo oficial
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Validar credenciales
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('tu-proyecto')
);

// Cliente Supabase siempre activo en todos los dispositivos
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Generador de UUID v4 compatible con todos los navegadores y entornos
export function generateSecureUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Service fetcher: tries Supabase first, falls back to static menu if unconfigured
 */
export async function fetchServices(fallbackServices) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: fallbackServices, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return { data, error: null, source: 'supabase' };
    }
    return { data: fallbackServices, error: null, source: 'fallback' };
  } catch (err) {
    console.warn('[Supabase Services Notice]:', err.message);
    return { data: fallbackServices, error: null, source: 'fallback' };
  }
}

/**
 * Appointment creator: inserts row into 'appointments' table in Supabase
 */
export async function createAppointment(appointmentPayload) {
  if (!isSupabaseConfigured || !supabase) {
    // Demo / Simulation mode with artificial delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    // Check if slot is already taken in localStorage demo
    try {
      const existing = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
      const isTaken = existing.some(
        (apt) =>
          apt.appointment_date === appointmentPayload.appointment_date &&
          apt.appointment_time === appointmentPayload.appointment_time &&
          apt.status !== 'cancelled'
      );
      if (isTaken) {
        return {
          data: null,
          error: new Error('Este turno ya ha sido reservado. Por favor, selecciona otro horario.')
        };
      }

      const mockId = 'JP-' + Math.floor(100000 + Math.random() * 900000);
      const mockAppointment = {
        id: mockId,
        ...appointmentPayload,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };

      existing.unshift(mockAppointment);
      localStorage.setItem('joao_demo_appointments', JSON.stringify(existing));
      return { data: mockAppointment, error: null, isMock: true };
    } catch {
      // ignore
    }

    const mockId = 'JP-' + Math.floor(100000 + Math.random() * 900000);
    const mockAppointment = {
      id: mockId,
      ...appointmentPayload,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    return { data: mockAppointment, error: null, isMock: true };
  }

  try {
    // 1. Verificación previa de disponibilidad activa en la vista segura de turnos
    const { data: existingSlot } = await supabase
      .from('appointment_slots')
      .select('appointment_time')
      .eq('appointment_date', appointmentPayload.appointment_date)
      .eq('appointment_time', appointmentPayload.appointment_time)
      .maybeSingle();

    if (existingSlot) {
      return {
        data: null,
        error: new Error('Este turno acaba de ser reservado por otro cliente. Por favor, elige otro horario.')
      };
    }

    const appointmentId = generateSecureUuid();
    const newAppointment = {
      id: appointmentId,
      service_id: appointmentPayload.service_id || null,
      service_name: appointmentPayload.service_name,
      service_price: appointmentPayload.service_price,
      client_name: appointmentPayload.client_name,
      client_phone: appointmentPayload.client_phone,
      appointment_date: appointmentPayload.appointment_date,
      appointment_time: appointmentPayload.appointment_time,
      notes: appointmentPayload.notes || null,
      status: 'confirmed'
    };

    // 2. Inserción en PostgreSQL sin '.select()' para no chocar con las políticas RLS RGPD
    // (PostgreSQL evalúa la política SELECT si se pide RETURNING, fallando para anon)
    const { error } = await supabase
      .from('appointments')
      .insert([newAppointment]);

    if (error) {
      // Código PostgreSQL 23505: unique_violation (dos reservas simultáneas)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('idx_unique_active_appointment')) {
        return {
          data: null,
          error: new Error('Este turno acaba de ser reservado por otro cliente. Por favor, selecciona otro horario.')
        };
      }
      throw error;
    }

    return { 
      data: {
        ...newAppointment,
        created_at: new Date().toISOString()
      }, 
      error: null, 
      isMock: false 
    };
  } catch (err) {
    console.error('[Supabase Appointment Error]:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch booked appointment times for a given date
 * Usa primero la vista segura appointment_slots (sin datos personales)
 */
export async function fetchBookedSlots(dateStr) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const existing = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
      return existing
        .filter((apt) => apt.appointment_date === dateStr && apt.status !== 'cancelled')
        .map((apt) => apt.appointment_time);
    } catch {
      return [];
    }
  }

  try {
    // 1. Intentar consultar vista pública segura (solo fecha y hora)
    const { data: viewData, error: viewErr } = await supabase
      .from('appointment_slots')
      .select('appointment_time')
      .eq('appointment_date', dateStr);

    if (!viewErr && viewData) {
      return viewData.map((row) => row.appointment_time);
    }

    // 2. Fallback a tabla appointments si la vista aún no se ha creado
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled');

    if (error) throw error;
    return (data || []).map((row) => row.appointment_time);
  } catch (err) {
    console.warn('[Supabase Booked Slots]:', err.message);
    return [];
  }
}

/**
 * Fetch summary of booked slots for an entire month to identify full days
 */
export async function fetchMonthBookedSlots(year, month) {
  const padMonth = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${padMonth}-01`;
  const endDate = `${year}-${padMonth}-${String(daysInMonth).padStart(2, '0')}`;

  if (!isSupabaseConfigured || !supabase) {
    try {
      const existing = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
      const countsByDate = {};
      existing
        .filter((apt) => 
          apt.status !== 'cancelled' &&
          apt.appointment_date >= startDate &&
          apt.appointment_date <= endDate
        )
        .forEach((apt) => {
          countsByDate[apt.appointment_date] = (countsByDate[apt.appointment_date] || 0) + 1;
        });
      return countsByDate;
    } catch {
      return {};
    }
  }

  try {
    // 1. Intentar vista segura
    const { data: viewData, error: viewErr } = await supabase
      .from('appointment_slots')
      .select('appointment_date')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    if (!viewErr && viewData) {
      const countsByDate = {};
      viewData.forEach((row) => {
        countsByDate[row.appointment_date] = (countsByDate[row.appointment_date] || 0) + 1;
      });
      return countsByDate;
    }

    // 2. Fallback a tabla appointments
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .neq('status', 'cancelled');

    if (error) throw error;
    const countsByDate = {};
    (data || []).forEach((row) => {
      countsByDate[row.appointment_date] = (countsByDate[row.appointment_date] || 0) + 1;
    });
    return countsByDate;
  } catch (err) {
    console.warn('[Supabase Month Booked Slots]:', err.message);
    return {};
  }
}

/**
 * Fetch all appointments for the Admin panel (real-time from Supabase)
 */
export async function fetchAdminAppointments(adminPin) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
      return { data: local, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    // 1. Intentar llamada RPC con PIN de administración
    if (adminPin) {
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('admin_get_appointments', { p_pin: adminPin });
      if (!rpcErr && rpcData) {
        return { data: rpcData, error: null };
      }
    }

    // 2. Consulta directa a tabla si tiene permisos
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: true });

    if (error) {
      const local = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
      return { data: local, error: null };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.warn('[Supabase Admin Appointments Error]:', err.message);
    const local = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
    return { data: local, error: null };
  }
}

/**
 * Update appointment status (e.g. 'completed', 'cancelled', 'confirmed')
 */
export async function updateAppointmentStatus(appointmentId, newStatus, adminPin) {
  // Siempre sincronizar almacenamiento local de demostración
  try {
    const local = JSON.parse(localStorage.getItem('joao_demo_appointments') || '[]');
    const updated = local.map((apt) => (apt.id === appointmentId ? { ...apt, status: newStatus } : apt));
    localStorage.setItem('joao_demo_appointments', JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: true, error: null };
  }

  try {
    // 1. Intentar RPC con PIN de administración
    if (adminPin) {
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('admin_update_appointment_status', { p_id: appointmentId, p_status: newStatus, p_pin: adminPin });
      if (!rpcErr) {
        return { success: true, error: null };
      }
    }

    // 2. Fallback a update directo en Supabase
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[Supabase Update Appointment Status Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * Products fetcher: queries Supabase 'products' table, falls back to default products
 */
export async function fetchProducts(fallbackProducts) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const stored = localStorage.getItem('joao_products');
      if (stored) {
        return { data: JSON.parse(stored), error: null, source: 'local_storage' };
      }
    } catch {
      // ignore
    }
    return { data: fallbackProducts, error: null, source: 'default' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      return { data, error: null, source: 'supabase' };
    }
    return { data: fallbackProducts, error: null, source: 'fallback' };
  } catch (err) {
    console.warn('[Supabase Products Notice]:', err.message);
    try {
      const stored = localStorage.getItem('joao_products');
      if (stored) {
        return { data: JSON.parse(stored), error: null, source: 'local_storage' };
      }
    } catch {
      // ignore
    }
    return { data: fallbackProducts, error: null, source: 'fallback' };
  }
}

/**
 * Add a new product (Admin action)
 */
export async function addProduct(productPayload, currentProducts = []) {
  const priceEur = parseFloat(productPayload.price_eur) || 0;
  const priceLabel = `${priceEur.toFixed(2).replace('.', ',')} €`;

  if (!isSupabaseConfigured || !supabase) {
    const newId = 'prod-' + Date.now();
    const newProduct = {
      id: newId,
      ...productPayload,
      price_eur: priceEur,
      price_label: priceLabel,
      is_active: true,
      created_at: new Date().toISOString()
    };
    const updated = [newProduct, ...currentProducts];
    try {
      localStorage.setItem('joao_products', JSON.stringify(updated));
    } catch {
      // ignore
    }
    return { data: newProduct, error: null, source: 'local' };
  }

  try {
    const cleanPayload = {
      name: productPayload.name,
      brand: productPayload.brand || 'Joao Lab',
      category: productPayload.category || 'peluqueria',
      description: productPayload.description || '',
      price_eur: priceEur,
      price_label: priceLabel,
      stock: parseInt(productPayload.stock, 10) || 10,
      image_url: productPayload.image_url || '',
      tag: productPayload.tag || (productPayload.category === 'perfumes' ? 'PERFUMERÍA' : 'PELUQUERÍA'),
      is_active: true
    };

    const { data, error } = await supabase
      .from('products')
      .insert([cleanPayload])
      .select();

    if (error) throw error;
    const createdItem = (data && data.length > 0) ? data[0] : { id: 'prod-' + Date.now(), ...cleanPayload };

    try {
      localStorage.setItem('joao_products', JSON.stringify([createdItem, ...currentProducts]));
    } catch {}

    return { data: createdItem, error: null, source: 'supabase' };
  } catch (err) {
    console.error('[Supabase Add Product Error]:', err);
    const newId = 'prod-' + Date.now();
    const fallbackItem = { id: newId, ...productPayload, price_eur: priceEur, price_label: priceLabel, is_active: true };
    try {
      localStorage.setItem('joao_products', JSON.stringify([fallbackItem, ...currentProducts]));
    } catch {}
    return { data: fallbackItem, error: null, source: 'fallback' };
  }
}

/**
 * Delete a product by ID (Admin action)
 */
export async function deleteProduct(productId, currentProducts = []) {
  if (!isSupabaseConfigured || !supabase) {
    const updated = currentProducts.filter((p) => p.id !== productId);
    try {
      localStorage.setItem('joao_products', JSON.stringify(updated));
    } catch {
      // ignore
    }
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    try {
      const updated = currentProducts.filter((p) => p.id !== productId);
      localStorage.setItem('joao_products', JSON.stringify(updated));
    } catch {}

    return { success: true, error: null };
  } catch (err) {
    console.error('[Supabase Delete Product Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * Update an existing product (Admin action)
 */
export async function updateProduct(productId, productPayload, currentProducts = []) {
  const priceEur = parseFloat(productPayload.price_eur) || 0;
  const priceLabel = `${priceEur.toFixed(2).replace('.', ',')} €`;

  if (!isSupabaseConfigured || !supabase) {
    const updated = currentProducts.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          ...productPayload,
          price_eur: priceEur,
          price_label: priceLabel,
        };
      }
      return p;
    });

    try {
      localStorage.setItem('joao_products', JSON.stringify(updated));
    } catch {
      // ignore
    }

    const updatedItem = updated.find((p) => p.id === productId);
    return { data: updatedItem, error: null, source: 'local' };
  }

  try {
    const cleanPayload = {
      name: productPayload.name,
      brand: productPayload.brand || 'Joao Lab',
      category: productPayload.category,
      description: productPayload.description || '',
      price_eur: priceEur,
      price_label: priceLabel,
      stock: parseInt(productPayload.stock, 10) || 10,
      image_url: productPayload.image_url || '',
      tag: productPayload.tag || (productPayload.category === 'perfumes' ? 'PERFUMERÍA' : 'PELUQUERÍA')
    };

    const { data, error } = await supabase
      .from('products')
      .update(cleanPayload)
      .eq('id', productId)
      .select();

    if (error) throw error;
    const updatedItem = (data && data.length > 0) ? data[0] : { id: productId, ...cleanPayload };

    try {
      const local = currentProducts.map((p) => p.id === productId ? updatedItem : p);
      localStorage.setItem('joao_products', JSON.stringify(local));
    } catch {}

    return { data: updatedItem, error: null, source: 'supabase' };
  } catch (err) {
    console.error('[Supabase Update Product Error]:', err);
    const fallbackItem = { id: productId, ...productPayload, price_eur: priceEur, price_label: priceLabel };
    try {
      const local = currentProducts.map((p) => p.id === productId ? fallbackItem : p);
      localStorage.setItem('joao_products', JSON.stringify(local));
    } catch {}
    return { data: fallbackItem, error: null, source: 'fallback' };
  }
}

/**
 * Create a product reservation: inserts into 'product_reservations' table
 */
export async function createProductReservation(reservationPayload) {
  const mockId = 'RES-' + Math.floor(100000 + Math.random() * 900000);
  const newReservation = {
    id: mockId,
    ...reservationPayload,
    status: 'pendiente',
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    try {
      const existing = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
      existing.unshift(newReservation);
      localStorage.setItem('joao_product_reservations', JSON.stringify(existing));
    } catch {
      // ignore
    }
    return { data: newReservation, error: null, source: 'local' };
  }

  try {
    const reservationId = generateSecureUuid();
    const reservationRecord = {
      id: reservationId,
      product_id: reservationPayload.product_id || null,
      product_name: reservationPayload.product_name,
      product_price: reservationPayload.product_price,
      client_name: reservationPayload.client_name,
      client_phone: reservationPayload.client_phone,
      notes: reservationPayload.notes || '',
      status: 'pendiente'
    };

    const { error } = await supabase
      .from('product_reservations')
      .insert([reservationRecord]);

    if (error) {
      console.warn('[Supabase Reservation Fallback]:', error.message);
      // Fallback to local storage if table doesn't exist yet
      try {
        const existing = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
        existing.unshift(newReservation);
        localStorage.setItem('joao_product_reservations', JSON.stringify(existing));
      } catch {
        // ignore
      }
      return { data: newReservation, error: null, source: 'local' };
    }

    return { 
      data: {
        ...reservationRecord,
        created_at: new Date().toISOString()
      }, 
      error: null, 
      source: 'supabase' 
    };
  } catch (err) {
    console.error('[Supabase Create Reservation Error]:', err);
    return { data: newReservation, error: null, source: 'local' };
  }
}

/**
 * Fetch all product reservations (for Admin)
 */
export async function fetchProductReservations() {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
      return { data: local, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    const { data, error } = await supabase
      .from('product_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const local = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
      return { data: local, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const local = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
    return { data: local, error: null };
  }
}

/**
 * Update reservation status (e.g. 'entregado')
 */
export async function updateReservationStatus(reservationId, newStatus) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('joao_product_reservations') || '[]');
      const updated = local.map((r) => r.id === reservationId ? { ...r, status: newStatus } : r);
      localStorage.setItem('joao_product_reservations', JSON.stringify(updated));
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  try {
    const { error } = await supabase
      .from('product_reservations')
      .update({ status: newStatus })
      .eq('id', reservationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[Supabase Update Reservation Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * Admin PIN verification via secure Supabase RPC
 * Never exposes the plaintext PIN to unauthorized queries over the network
 */
export async function verifyAdminPin(pin) {
  const cleanPin = (pin || '').trim();
  if (!cleanPin) return false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_verify_pin', { p_pin: cleanPin });
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase Verify PIN Notice]:', err.message);
    }
  }

  // Fallback seguro local si Supabase no está conectado
  const localPin = localStorage.getItem('joao_admin_pin_custom') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
  return cleanPin === localPin.trim();
}

/**
 * Admin PIN management: retrieves shared PIN from Supabase with fallback to local
 * Automatically syncs the latest PIN to every device
 */
export async function fetchAdminPin() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_get_pin');
      if (!error && data) {
        const clean = String(data).trim();
        localStorage.setItem('joao_admin_pin', clean);
        localStorage.setItem('joao_admin_pin_custom', clean);
        return clean;
      }
    } catch (err) {
      console.warn('[Supabase Sync PIN Error]:', err.message);
    }
  }
  return localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
}

export async function updateAdminPin(newPin) {
  const cleanPin = (newPin || '').trim();
  if (!cleanPin) return { success: false, error: 'El PIN no puede estar vacío' };
  if (cleanPin.length < 4) return { success: false, error: 'El PIN debe tener al menos 4 caracteres' };

  // 1. Guardar localmente
  try {
    localStorage.setItem('joao_admin_pin_custom', cleanPin);
    localStorage.setItem('joao_admin_pin', cleanPin);
  } catch {}

  // 2. Sincronizar en Supabase para TODOS los dispositivos automáticamente
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_set_pin', { p_new_pin: cleanPin });
      if (!error && data && data.success) {
        return { success: true, message: '¡PIN sincronizado automáticamente en todos tus dispositivos!' };
      }
      // Fallback a admin_update_pin
      const { error: rpcErr } = await supabase.rpc('admin_update_pin', {
        p_old_pin: cleanPin,
        p_new_pin: cleanPin
      });
      if (!rpcErr) {
        return { success: true, message: '¡PIN sincronizado automáticamente en todos tus dispositivos!' };
      }
      if (error) throw error;
    } catch (err) {
      console.warn('[Supabase Update PIN Error]:', err.message);
      return { 
        success: true, 
        warning: 'Guardado localmente. Recuerda ejecutar el script SQL en Supabase para sincronizarlo con otros dispositivos.' 
      };
    }
  }
  return { success: true };
}

/**
 * Prueba la conexión con Telegram directamente desde el servidor Supabase
 * ¡CERO exposición del token al navegador del cliente!
 */
export async function testTelegramViaSupabase(pin) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    const activePin = (pin || localStorage.getItem('joao_admin_pin') || 'admin1234').trim();
    const { data, error } = await supabase.rpc('admin_test_telegram', { p_pin: activePin });
    if (error) {
      return { success: false, error: error.message };
    }
    return data || { success: true, message: 'Mensaje de prueba enviado con éxito a tu Telegram.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Envía alerta de seguridad instantánea a Telegram ante bloqueos por intentos fallidos
 */
export async function sendSecurityAlertViaSupabase() {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    await supabase.rpc('admin_send_security_alert', { p_ip_or_info: 'lockout' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el estado del bot de Telegram enmascarando el token por seguridad
 */
export async function getTelegramStatusViaSupabase(pin) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      configured: false,
      bot_name: '@JoaoPeluquero_bot',
      chat_id: '6240635170',
      masked_token: '••••••••••••••••'
    };
  }
  try {
    const activePin = (pin || (typeof window !== 'undefined' ? localStorage.getItem('joao_admin_pin') : null) || 'admin1234').trim();
    const { data, error } = await supabase.rpc('admin_get_telegram_status', { p_pin: activePin });
    if (!error && data && data.success) {
      return data;
    }
  } catch {}
  return {
    success: true,
    configured: false,
    bot_name: '@JoaoPeluquero_bot',
    chat_id: '6240635170',
    masked_token: '••••••••••••••••'
  };
}

/**
 * Guarda el nuevo token de Telegram directamente en la base de datos Supabase
 * ¡CERO exposición en Git ni en el cliente web!
 */
export async function updateTelegramTokenViaSupabase(token, pin) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    const activePin = (pin || (typeof window !== 'undefined' ? localStorage.getItem('joao_admin_pin') : null) || 'admin1234').trim();
    const { data, error } = await supabase.rpc('admin_set_telegram_token', {
      p_token: token.trim(),
      p_pin: activePin
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return data || { success: true, message: '¡Token guardado de forma segura en Supabase!' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}




