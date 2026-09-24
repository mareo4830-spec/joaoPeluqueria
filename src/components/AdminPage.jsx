import React, { useState, useEffect } from 'react';
import { 
  Lock, Plus, Trash2, Check, AlertCircle, Key, LogOut, Package, 
  Sparkles, Edit2, Upload, ShoppingBag, MessageSquare, RefreshCw, Calendar as CalendarIcon, ArrowLeft, ExternalLink,
  Clock, User, Phone, CheckCircle2, XCircle, Settings, Send
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  fetchProductReservations, 
  updateReservationStatus, 
  fetchAdminAppointments, 
  updateAppointmentStatus,
  fetchAdminPin,
  verifyAdminPin,
  updateAdminPin,
  sendSecurityAlertViaSupabase,
  getTelegramStatusViaSupabase,
  updateTelegramTokenViaSupabase
} from '../lib/supabase';
import { 
  getTelegramConfig, 
  testTelegramNotification 
} from '../lib/notifications';

export default function AdminPage({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onNavigateHome,
  onNavigateToCitas
}) {
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('joao_admin_logged') === 'true';
    } catch {
      return false;
    }
  });

  // Control de Bloqueo Anti Fuerza Bruta (Máximo 3 intentos fallidos -> Bloqueo 15 minutos)
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 15 * 60 * 1000;

  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem('joao_admin_failed_attempts') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      return parseInt(localStorage.getItem('joao_admin_lockout_until') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        setSecondsRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setSecondsRemaining(0);
        if (lockoutUntil > 0) {
          setLockoutUntil(0);
          setFailedAttempts(0);
          try {
            localStorage.removeItem('joao_admin_lockout_until');
            localStorage.removeItem('joao_admin_failed_attempts');
          } catch {
            // ignore
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = secondsRemaining > 0;

  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments', 'manage', 'add', 'reservations'
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('perfumes');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tag, setTag] = useState('');
  const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'url'

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reservations & Appointments
  const [reservations, setReservations] = useState([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [appointmentsFilter, setAppointmentsFilter] = useState('all'); // 'all', 'today', 'upcoming', 'cancelled'

  useEffect(() => {
    // Sincronizar PIN activo automáticamente desde Supabase para todos los dispositivos
    fetchAdminPin();
    if (isAdminLoggedIn) {
      loadReservations();
      loadAppointments();
      loadTelegramStatus();
    }
  }, [isAdminLoggedIn]);

  const loadReservations = async () => {
    setIsLoadingReservations(true);
    const { data } = await fetchProductReservations();
    setReservations(data || []);
    setIsLoadingReservations(false);
  };

  // Telegram and Settings State
  const [telegramServerStatus, setTelegramServerStatus] = useState(null);
  const [newTelegramToken, setNewTelegramToken] = useState('');
  const [isSavingTelegramToken, setIsSavingTelegramToken] = useState(false);
  const [telegramSaveStatus, setTelegramSaveStatus] = useState(null);
  const [telegramTestStatus, setTelegramTestStatus] = useState(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const [customPinInput, setCustomPinInput] = useState('');
  const [pinChangeStatus, setPinChangeStatus] = useState(null);

  const loadTelegramStatus = async () => {
    const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || 'admin1234';
    const status = await getTelegramStatusViaSupabase(pin);
    setTelegramServerStatus(status);
  };

  const loadAppointments = async () => {
    setIsLoadingAppointments(true);
    const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
    const { data } = await fetchAdminAppointments(pin);
    setAppointments(data || []);
    setIsLoadingAppointments(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;

    const isValid = await verifyAdminPin(pinInput.trim());

    if (isValid) {
      setIsAdminLoggedIn(true);
      setAuthError(false);
      setFailedAttempts(0);
      try {
        localStorage.setItem('joao_admin_logged', 'true');
        localStorage.setItem('joao_admin_pin', pinInput.trim());
        localStorage.removeItem('joao_admin_failed_attempts');
        localStorage.removeItem('joao_admin_lockout_until');
      } catch {
        // ignore
      }
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setAuthError(true);
      setPinInput('');

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_MS;
        setLockoutUntil(lockTime);
        try {
          localStorage.setItem('joao_admin_failed_attempts', String(newAttempts));
          localStorage.setItem('joao_admin_lockout_until', String(lockTime));
        } catch {
          // ignore
        }

        // Enviar alerta instantánea de seguridad a Telegram (directamente desde el servidor)
        try {
          await sendSecurityAlertViaSupabase();
        } catch {
          // ignore
        }
      } else {
        try {
          localStorage.setItem('joao_admin_failed_attempts', String(newAttempts));
        } catch {
          // ignore
        }
      }
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('joao_admin_logged');
      localStorage.removeItem('joao_admin_pin');
    } catch {
      // ignore
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Comprime a JPEG de alta fidelidad con peso ultraligero (~60-90 KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageUrl(compressedDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const startEditProduct = (prod) => {
    setEditingProduct(prod);
    setName(prod.name || '');
    setBrand(prod.brand || '');
    setCategory(prod.category || 'perfumes');
    setPrice(prod.price_eur ? String(prod.price_eur) : '');
    setStock(prod.stock ? String(prod.stock) : '10');
    setDescription(prod.description || '');
    setImageUrl(prod.image_url || '');
    setTag(prod.tag || '');
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setBrand('');
    setCategory('perfumes');
    setPrice('');
    setStock('10');
    setDescription('');
    setImageUrl('');
    setTag('');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPriceStr = String(price || '').replace(',', '.').trim();
    const parsedPrice = parseFloat(cleanPriceStr);
    const parsedStock = parseInt(stock, 10);

    if (!cleanName) {
      alert('Por favor introduce el nombre del producto.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1000) {
      alert('Por favor introduce un precio válido en euros (entre 0,01 € y 1.000 €).');
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      alert('Por favor introduce una cantidad de stock válida (mínimo 0 unidades).');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: cleanName,
      brand: brand.trim() || 'Joao Lab',
      category,
      price_eur: parsedPrice,
      stock: parsedStock,
      description: description.trim(),
      image_url: imageUrl.trim() || (category === 'perfumes' 
        ? 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80'),
      tag: tag.trim() || (category === 'perfumes' ? 'PERFUMERÍA' : 'PELUQUERÍA')
    };

    if (editingProduct) {
      if (onUpdateProduct) {
        await onUpdateProduct(editingProduct.id, payload);
      }
    } else {
      await onAddProduct(payload);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    cancelEdit();

    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('manage');
    }, 1000);
  };

  const handleToggleAppointmentStatus = async (aptId, newStatus) => {
    const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
    await updateAppointmentStatus(aptId, newStatus, pin);
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a))
    );
  };

  const handleToggleReservationStatus = async (resId, currentStatus) => {
    const nextStatus = currentStatus === 'entregado' ? 'pendiente' : 'entregado';
    await updateReservationStatus(resId, nextStatus);
    setReservations((prev) => 
      prev.map((r) => r.id === resId ? { ...r, status: nextStatus } : r)
    );
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestStatus(null);
    const pin = localStorage.getItem('joao_admin_pin') || 'admin1234';
    const result = await testTelegramNotification(pin);
    setIsTestingTelegram(false);
    if (result.success) {
      setTelegramTestStatus({ type: 'success', message: result.message || '¡Mensaje de prueba enviado con éxito a tu Telegram desde el servidor Supabase! Revisa tu móvil.' });
    } else {
      setTelegramTestStatus({ type: 'error', message: `Error al conectar con Telegram: ${result.error}` });
    }
  };

  const handleSaveTelegramToken = async (e) => {
    e.preventDefault();
    const cleanToken = newTelegramToken.trim();
    if (!cleanToken || cleanToken.length < 20 || !cleanToken.includes(':')) {
      setTelegramSaveStatus({ 
        type: 'error', 
        message: 'Por favor, introduce un token válido de Telegram (formato: 123456789:ABCdef...).' 
      });
      return;
    }
    setIsSavingTelegramToken(true);
    setTelegramSaveStatus(null);
    const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || 'admin1234';
    const res = await updateTelegramTokenViaSupabase(cleanToken, pin);
    setIsSavingTelegramToken(false);
    if (res.success) {
      setTelegramSaveStatus({ 
        type: 'success', 
        message: res.message || '¡Token de Telegram guardado de forma segura en Supabase!' 
      });
      setNewTelegramToken('');
      await loadTelegramStatus();
    } else {
      setTelegramSaveStatus({ 
        type: 'error', 
        message: res.error || 'Error al guardar el token.' 
      });
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!customPinInput.trim() || customPinInput.trim().length < 4) {
      setPinChangeStatus({ type: 'error', message: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }
    const result = await updateAdminPin(customPinInput.trim());
    setCustomPinInput('');
    if (result.success) {
      setPinChangeStatus({ 
        type: 'success', 
        message: result.message || '¡Contraseña actualizada y sincronizada automáticamente en todos tus dispositivos!' 
      });
    } else {
      setPinChangeStatus({ type: 'error', message: result.error || 'Error al actualizar la contraseña.' });
    }
  };

  const filteredAppointments = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((apt) => {
      if (appointmentsFilter === 'today') {
        return apt.appointment_date === today;
      }
      if (appointmentsFilter === 'upcoming') {
        return apt.appointment_date >= today && apt.status !== 'cancelled';
      }
      if (appointmentsFilter === 'cancelled') {
        return apt.status === 'cancelled';
      }
      return true;
    });
  }, [appointments, appointmentsFilter]);

  const activeAppointmentsCount = appointments.filter(a => a.status !== 'cancelled').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#09090b', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Bar */}
      <header style={{ backgroundColor: '#09090b', color: '#ffffff', borderBottom: '1px solid #27272a', padding: '1rem clamp(1rem, 3vw, 2.5rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, backgroundColor: '#ffffff', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              JP
            </div>
            <div>
              <div className="font-headline" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                JOAO PELUQUERO'S · ÁREA /ADMIN
              </div>
              <div className="font-mono" style={{ fontSize: '0.65rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
                ACCESO PRIVADO EXCLUSIVO PARA ADMINISTRACIÓN
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAdminLoggedIn && onNavigateToCitas && (
              <button
                type="button"
                onClick={onNavigateToCitas}
                title="Abrir Vista Rápida de Citas para Peluquero (/citas)"
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: '1px solid #22c55e',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  boxShadow: '0 1px 4px rgba(34, 197, 94, 0.35)'
                }}
              >
                <CalendarIcon size={14} />
                <span>CITAS</span>
              </button>
            )}

            <button
              onClick={onNavigateHome}
              className="btn-outline-brutal"
              style={{ color: '#ffffff', borderColor: '#3f3f46', padding: '0.5rem 1rem', fontSize: '0.75rem' }}
            >
              <ArrowLeft size={14} />
              <span>VER WEB PÚBLICA</span>
            </button>

            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                className="font-mono"
              >
                <LogOut size={14} />
                CERRAR SESIÓN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main style={{ flex: 1, padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {!isAdminLoggedIn ? (
          /* LOGIN SCREEN */
          <div style={{ maxWidth: '440px', margin: '4rem auto', backgroundColor: '#ffffff', border: '2px solid #09090b', padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, backgroundColor: '#09090b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Key size={26} />
            </div>

            <h2 className="font-headline" style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: '#09090b' }}>
              PANEL DE CONTROL JOÃO
            </h2>
            <p className="font-mono" style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '2rem', lineHeight: 1.5 }}>
              Solo accesible para João Peluquero's. Introduce tu PIN de seguridad para gestionar productos y reservas.
            </p>

            {/* Banners de estado y bloqueo */}
            {isLockedOut ? (
              <div 
                style={{ 
                  backgroundColor: '#fef2f2', 
                  border: '2px solid #b91c1c', 
                  color: '#991b1b', 
                  padding: '1.25rem 1rem', 
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}
                className="font-mono"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.4rem' }}>
                  <Lock size={18} style={{ color: '#b91c1c' }} />
                  <span>ACCESO BLOQUEADO POR SEGURIDAD</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#7f1d1d', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  Has superado los 3 intentos permitidos. Por protección del panel, el acceso ha sido bloqueado temporalmente.
                </p>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991b1b', letterSpacing: '0.08em' }}>
                  ⏱ {formatCountdown(secondsRemaining)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: '0.35rem' }}>
                  Espera a que termine el temporizador para volver a intentarlo
                </div>
              </div>
            ) : (
              authError && (
                <div 
                  style={{ 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #ef4444', 
                    color: '#991b1b', 
                    padding: '0.75rem 1rem', 
                    marginBottom: '1.5rem',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                  }}
                  className="font-mono"
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    PIN incorrecto. Te queda(n) <strong>{Math.max(0, MAX_ATTEMPTS - failedAttempts)}</strong> intento(s) antes del bloqueo.
                  </span>
                </div>
              )
            )}

            <form onSubmit={handleLogin}>
              <input
                type="password"
                required
                disabled={isLockedOut}
                placeholder={isLockedOut ? "Acceso temporalmente bloqueado" : "Introduce tu PIN de acceso"}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setAuthError(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: isLockedOut ? '2px solid #ef4444' : '2px solid #09090b',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.15em',
                  marginBottom: '1.25rem',
                  borderRadius: 0,
                  outline: 'none',
                  backgroundColor: isLockedOut ? '#f4f4f5' : '#ffffff',
                  cursor: isLockedOut ? 'not-allowed' : 'text'
                }}
              />

              <button
                type="submit"
                disabled={isLockedOut}
                className="btn-solid-black"
                style={{ 
                  width: '100%', 
                  padding: '0.95rem',
                  opacity: isLockedOut ? 0.5 : 1,
                  cursor: isLockedOut ? 'not-allowed' : 'pointer'
                }}
              >
                {isLockedOut ? `BLOQUEADO (${formatCountdown(secondsRemaining)})` : 'DESBLOQUEAR PANEL'}
              </button>

              <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: '1.5rem' }}>
                Área de administración privada · João Peluquero's
              </div>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div>
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }} className="font-mono">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('appointments');
                  loadAppointments();
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: activeTab === 'appointments' ? '#09090b' : '#ffffff',
                  color: activeTab === 'appointments' ? '#ffffff' : '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <CalendarIcon size={15} />
                CITAS Y HORARIOS ({activeAppointmentsCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: activeTab === 'manage' ? '#09090b' : '#ffffff',
                  color: activeTab === 'manage' ? '#ffffff' : '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Package size={15} />
                INVENTARIO ({products.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  cancelEdit();
                  setActiveTab('add');
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: activeTab === 'add' ? '#09090b' : '#ffffff',
                  color: activeTab === 'add' ? '#ffffff' : '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={15} />
                {editingProduct ? 'EDITANDO PRODUCTO' : 'AÑADIR PRODUCTO'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('reservations');
                  loadReservations();
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: activeTab === 'reservations' ? '#09090b' : '#ffffff',
                  color: activeTab === 'reservations' ? '#ffffff' : '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShoppingBag size={15} />
                PEDIDOS & RESERVAS ({reservations.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: activeTab === 'settings' ? '#09090b' : '#ffffff',
                  color: activeTab === 'settings' ? '#ffffff' : '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Settings size={15} />
                AJUSTES & CONTRASEÑA
              </button>
            </div>

            {/* TAB: APPOINTMENTS / CITAS */}
            {activeTab === 'appointments' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="font-headline" style={{ fontSize: '1.65rem', color: '#09090b' }}>
                      AGENDA DE CITAS EN SALÓN
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      Control de reservas de clientes en tiempo real. Cancela o completa turnos al instante.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadAppointments}
                    className="btn-outline-brutal"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={14} />
                    ACTUALIZAR AGENDA
                  </button>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="font-mono">
                  {[
                    { id: 'all', label: 'TODAS', count: appointments.length },
                    { id: 'today', label: 'HOY', count: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length },
                    { id: 'upcoming', label: 'PRÓXIMAS', count: appointments.filter(a => a.appointment_date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length },
                    { id: 'cancelled', label: 'CANCELADAS', count: appointments.filter(a => a.status === 'cancelled').length }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAppointmentsFilter(f.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        border: '1px solid #09090b',
                        backgroundColor: appointmentsFilter === f.id ? '#09090b' : '#ffffff',
                        color: appointmentsFilter === f.id ? '#ffffff' : '#09090b',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>

                {isLoadingAppointments ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }} className="font-mono">
                    Cargando citas de Supabase...
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed #d4d4d8' }} className="font-mono">
                    <CalendarIcon size={38} style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
                      NO HAY CITAS QUE COINCIDAN CON EL FILTRO
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.35rem' }}>
                      Cuando un cliente reserve a través de la web pública, aparecerá aquí inmediatamente.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredAppointments.map((apt) => {
                      const isCancelled = apt.status === 'cancelled';
                      const isCompleted = apt.status === 'completed';
                      const cleanPhone = (apt.client_phone || '').replace(/\D/g, '');
                      const waUrl = `https://wa.me/34${cleanPhone.startsWith('34') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(
                        `¡Hola ${apt.client_name}! Te contacto de Joao Peluquero's en relación a tu cita de "${apt.service_name}" el día ${apt.appointment_date} a las ${apt.appointment_time}.`
                      )}`;

                      return (
                        <div 
                          key={apt.id}
                          style={{
                            border: '1px solid #09090b',
                            padding: '1.25rem',
                            backgroundColor: isCancelled ? '#fafafa' : '#ffffff',
                            opacity: isCancelled ? 0.75 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="font-headline" style={{ fontSize: '1.3rem', color: '#09090b', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                  {apt.service_name}
                                </span>
                                <span className="font-headline" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b' }}>
                                  ({apt.service_price})
                                </span>
                              </div>

                              {/* Horario y Fecha destacados */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }} className="font-mono">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#09090b', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <CalendarIcon size={13} />
                                  {apt.appointment_date}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f4f4f5', border: '1px solid #09090b', color: '#09090b', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <Clock size={13} />
                                  {apt.appointment_time} h
                                </span>
                              </div>

                              <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#27272a', marginTop: '0.5rem' }}>
                                Cliente: <strong>{apt.client_name}</strong> · Móvil: <strong>{apt.client_phone}</strong>
                              </div>

                              {apt.notes && (
                                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                  Nota: "{apt.notes}"
                                </div>
                              )}
                            </div>

                            <span 
                              className="font-mono" 
                              style={{ 
                                fontSize: '0.6875rem', 
                                padding: '0.25rem 0.65rem', 
                                backgroundColor: isCancelled ? '#fee2e2' : isCompleted ? '#dcfce7' : '#fef3c7',
                                color: isCancelled ? '#991b1b' : isCompleted ? '#166534' : '#92400e',
                                border: '1px solid',
                                borderColor: isCancelled ? '#fca5a5' : isCompleted ? '#bbf7d0' : '#fde68a',
                                fontWeight: 700
                              }}
                            >
                              {isCancelled ? '✕ CANCELADA' : isCompleted ? '✓ COMPLETADA' : 'CONFIRMADA'}
                            </span>
                          </div>

                          {/* Action footer */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e4e4e7', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                              Registrada: {apt.created_at ? new Date(apt.created_at).toLocaleString('es-ES') : 'N/A'}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {!isCancelled && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-solid-black"
                                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                                >
                                  <MessageSquare size={14} />
                                  WHATSAPP
                                </a>
                              )}

                              {!isCancelled && !isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAppointmentStatus(apt.id, 'completed')}
                                  className="btn-outline-brutal"
                                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                                >
                                  MARCAR COMPLETADA
                                </button>
                              )}

                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Seguro que deseas cancelar la cita de ${apt.client_name} el ${apt.appointment_date} a las ${apt.appointment_time}? El horario quedará liberado automáticamente.`)) {
                                      handleToggleAppointmentStatus(apt.id, 'cancelled');
                                    }
                                  }}
                                  style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    padding: '0.45rem 0.85rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700
                                  }}
                                >
                                  CANCELAR CITA
                                </button>
                              )}

                              {isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAppointmentStatus(apt.id, 'confirmed')}
                                  className="btn-outline-brutal"
                                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                                >
                                  REACTIVAR CITA
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: INVENTORY / MANAGE */}
            {activeTab === 'manage' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="font-headline" style={{ fontSize: '1.65rem', color: '#09090b' }}>
                      GESTIÓN DE PRODUCTOS Y PERFUMES
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      Desde aquí puedes editar fotos, precios, o eliminar cualquier artículo del catálogo público.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      cancelEdit();
                      setActiveTab('add');
                    }}
                    className="btn-solid-black"
                    style={{ padding: '0.65rem 1.15rem', fontSize: '0.75rem' }}
                  >
                    <Plus size={14} />
                    NUEVO PRODUCTO
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {products.map((item) => (
                    <div 
                      key={item.id}
                      style={{
                        border: '1px solid #09090b',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #09090b', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span 
                            className="font-mono" 
                            style={{ 
                              fontSize: '0.5625rem', 
                              padding: '0.15rem 0.4rem', 
                              backgroundColor: '#09090b', 
                              color: '#ffffff',
                              fontWeight: 700
                            }}
                          >
                            {item.category === 'perfumes' ? 'PERFUMERÍA' : 'PELUQUERÍA'}
                          </span>

                          <h3 className="font-headline" style={{ fontSize: '1.15rem', color: '#09090b', marginTop: '0.35rem', lineHeight: 1.2 }}>
                            {item.name}
                          </h3>

                          <div className="font-headline" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b', marginTop: '0.25rem' }}>
                            {item.price_label || `${item.price_eur} €`}
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #e4e4e7', paddingTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => startEditProduct(item)}
                          className="btn-solid-black"
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
                        >
                          <Edit2 size={13} />
                          EDITAR / FOTO
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar "${item.name}" del catálogo?`)) {
                              onDeleteProduct(item.id);
                            }
                          }}
                          style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            padding: '0.6rem 0.85rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} />
                          ELIMINAR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ADD / EDIT PRODUCT */}
            {activeTab === 'add' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="font-headline" style={{ fontSize: '1.65rem', color: '#09090b' }}>
                      {editingProduct ? `EDITANDO: ${editingProduct.name}` : 'CREAR NUEVO PRODUCTO O PERFUME'}
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      Se sincronizará en tiempo real con Supabase y el catálogo público.
                    </p>
                  </div>

                  {editingProduct && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn-outline-brutal"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                    >
                      CANCELAR EDICIÓN
                    </button>
                  )}
                </div>

                {saveSuccess && (
                  <div 
                    style={{ 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #22c55e', 
                      color: '#166534', 
                      padding: '0.85rem', 
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    className="font-mono"
                  >
                    <Check size={18} />
                    <span>{editingProduct ? '¡Producto actualizado correctamente!' : '¡Producto añadido al catálogo con éxito!'}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProduct}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        NOMBRE DEL PRODUCTO / PERFUME *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Afnan 9PM Eau de Parfum (100ml)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div>
                      <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        CATEGORÍA *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit', backgroundColor: '#ffffff' }}
                      >
                        <option value="perfumes">Perfumes (Árabes y de Autor)</option>
                        <option value="peluqueria">Productos de Peluquería (Ceras, Polvos, Aceites)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        PRECIO DE VENTA EN LOCAL (€) *
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="1"
                        required
                        placeholder="Ej. 38.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div>
                      <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        MARCA / LÍNEA
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Afnan / Joao Lab"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>

                  {/* FOTOGRAFÍA DUAL (SUBIR ARCHIVO O URL) */}
                  <div style={{ backgroundColor: '#fafafa', border: '1px solid #09090b', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#09090b' }}>
                        FOTOGRAFÍA DEL PRODUCTO
                      </label>

                      <div style={{ display: 'flex', gap: '0.5rem' }} className="font-mono">
                        <button
                          type="button"
                          onClick={() => setImageMode('upload')}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.4rem 0.75rem',
                            background: imageMode === 'upload' ? '#09090b' : '#ffffff',
                            color: imageMode === 'upload' ? '#ffffff' : '#09090b',
                            border: '1px solid #09090b',
                            cursor: 'pointer'
                          }}
                        >
                          SUBIR DESDE TU DISPOSITIVO / MÓVIL
                        </button>

                        <button
                          type="button"
                          onClick={() => setImageMode('url')}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.4rem 0.75rem',
                            background: imageMode === 'url' ? '#09090b' : '#ffffff',
                            color: imageMode === 'url' ? '#ffffff' : '#09090b',
                            border: '1px solid #09090b',
                            cursor: 'pointer'
                          }}
                        >
                          PEGAR ENLACE WEB (URL)
                        </button>
                      </div>
                    </div>

                    {imageMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="admin-file-upload-page"
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="admin-file-upload-page"
                          className="btn-outline-brutal"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <Upload size={18} />
                          <span className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                            PULSA AQUÍ PARA ELEGIR FOTO DESDE TU GALERÍA O CÁMARA
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit', backgroundColor: '#ffffff' }}
                        />
                      </div>
                    )}

                    {/* Image Preview Box */}
                    {imageUrl && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #09090b' }}>
                        <img
                          src={imageUrl}
                          alt="Vista previa"
                          style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #09090b' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                            ✓ FOTOGRAFÍA CARGADA Y LISTA
                          </div>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 0,
                              marginTop: '0.35rem'
                            }}
                            className="font-mono"
                          >
                            Quitar esta foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.75rem' }}>
                    <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      DESCRIPCIÓN COMERCIAL DEL PRODUCTO
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe notas aromáticas, fijación, consejos de aplicación..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid #09090b', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn-outline-brutal"
                        style={{ padding: '0.9rem 1.75rem' }}
                      >
                        CANCELAR
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-solid-black"
                      style={{ padding: '0.9rem 2rem' }}
                    >
                      {isSaving ? 'GUARDANDO EN SUPABASE...' : (editingProduct ? 'ACTUALIZAR PRODUCTO' : 'PUBLICAR EN LA TIENDA')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: RESERVATIONS */}
            {activeTab === 'reservations' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="font-headline" style={{ fontSize: '1.65rem', color: '#09090b' }}>
                      PEDIDOS Y RESERVAS DE PRODUCTOS
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      Listado de clientes que han reservado perfumes o productos para recoger en tienda.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadReservations}
                    className="btn-outline-brutal"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={14} />
                    ACTUALIZAR LISTA
                  </button>
                </div>

                {isLoadingReservations ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }} className="font-mono">
                    Cargando reservas en tiempo real...
                  </div>
                ) : reservations.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed #d4d4d8' }} className="font-mono">
                    <ShoppingBag size={38} style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
                      NO HAY RESERVAS REGISTRADAS TODAVÍA
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.35rem' }}>
                      En cuanto un cliente reserve un perfume o producto desde la tienda, aparecerá aquí al instante.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reservations.map((res) => {
                      const isPending = res.status !== 'entregado';
                      const cleanPhone = (res.client_phone || '').replace(/\D/g, '');
                      const waUrl = `https://wa.me/34${cleanPhone.startsWith('34') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(
                        `¡Hola ${res.client_name}! Te contacto de Joao Peluquero's en relación a tu reserva de ${res.product_name}. Ya lo tenemos preparado en tienda para cuando gustes pasar.`
                      )}`;

                      return (
                        <div 
                          key={res.id}
                          style={{
                            border: '1px solid #09090b',
                            padding: '1.25rem',
                            backgroundColor: isPending ? '#ffffff' : '#fafafa',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="font-headline" style={{ fontSize: '1.3rem', color: '#09090b' }}>
                                  {res.product_name}
                                </span>
                                <span className="font-headline" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b' }}>
                                  ({res.product_price})
                                </span>
                              </div>
                              <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#27272a', marginTop: '0.3rem' }}>
                                Cliente: <strong>{res.client_name}</strong> · Teléfono: <strong>{res.client_phone}</strong>
                              </div>
                              {res.notes && (
                                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                  Nota: "{res.notes}"
                                </div>
                              )}
                            </div>

                            <span 
                              className="font-mono" 
                              style={{ 
                                fontSize: '0.6875rem', 
                                padding: '0.25rem 0.65rem', 
                                backgroundColor: isPending ? '#fef3c7' : '#dcfce7',
                                color: isPending ? '#92400e' : '#166534',
                                border: '1px solid',
                                borderColor: isPending ? '#fde68a' : '#bbf7d0',
                                fontWeight: 700
                              }}
                            >
                              {isPending ? 'PENDIENTE DE RECOGIDA' : '✓ ENTREGADO'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e4e4e7', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                              Fecha: {new Date(res.created_at).toLocaleString('es-ES')}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-solid-black"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                              >
                                <MessageSquare size={14} />
                                ABRIR WHATSAPP CON CLIENTE
                              </a>

                              <button
                                type="button"
                                onClick={() => handleToggleReservationStatus(res.id, res.status)}
                                className="btn-outline-brutal"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                              >
                                {isPending ? 'MARCAR COMO ENTREGADO' : 'VOLVER A PENDIENTE'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SETTINGS & TELEGRAM NOTIFICATIONS */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Telegram Bot Established Card */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Send size={22} style={{ color: '#09090b' }} />
                        <h2 className="font-headline" style={{ fontSize: '1.65rem', color: '#09090b' }}>
                          NOTIFICACIONES TELEGRAM (BLINDADO EN SERVIDOR)
                        </h2>
                      </div>
                      <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                        Arquitectura Zero-Client-Exposure: el nuevo bot está blindado en Supabase (pg_net) y vinculado a tu móvil.
                      </p>
                    </div>

                    <div className="tech-badge" style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>
                      🛡️ TOKEN PROTEGIDO EN SERVIDOR
                    </div>
                  </div>

                  {/* Established Bot Details */}
                  <div 
                    style={{ 
                      backgroundColor: '#fafafa', 
                      border: '1px solid #e4e4e7', 
                      padding: '1.25rem', 
                      marginBottom: '1.5rem' 
                    }}
                    className="font-mono"
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ color: '#71717a', display: 'block', fontSize: '0.6875rem' }}>BOT OFICIAL:</span>
                        <strong style={{ color: '#09090b' }}>{telegramServerStatus?.bot_name || '@JoaoPeluquero_bot'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#71717a', display: 'block', fontSize: '0.6875rem' }}>CHAT ID DESTINATARIO:</span>
                        <strong style={{ color: '#09090b' }}>{telegramServerStatus?.chat_id || '6240635170'} (Móvil de João)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#71717a', display: 'block', fontSize: '0.6875rem' }}>TOKEN TELEGRAM:</span>
                        <strong style={{ color: telegramServerStatus?.configured ? '#16a34a' : '#ea580c' }}>
                          {telegramServerStatus?.masked_token || '••••••••••••••••'} ({telegramServerStatus?.configured ? 'Protegido' : 'Pendiente'})
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#71717a', display: 'block', fontSize: '0.6875rem' }}>ESTADO DEL SERVICIO:</span>
                        <strong style={{ color: telegramServerStatus?.configured ? '#16a34a' : '#ca8a04' }}>
                          {telegramServerStatus?.configured ? '● Notificaciones 24/7 en tiempo real' : '⚠️ Pendiente de configurar token'}
                        </strong>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '1rem', borderTop: '1px solid #e4e4e7', paddingTop: '0.75rem', lineHeight: 1.5 }}>
                      🛡️ <b>Ciberseguridad activa:</b> Ningún visitante de la web puede capturar tu token con F12 ni inspeccionando peticiones de red. Cada cita o reserva dispara automáticamente una petición HTTP desde los servidores de Supabase hacia Telegram.
                    </p>
                  </div>

                  {/* Formulario Seguro para Actualizar Token en Servidor */}
                  <form onSubmit={handleSaveTelegramToken} style={{ marginBottom: '1.5rem', backgroundColor: '#fafafa', padding: '1.25rem', border: '1px solid #e4e4e7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Key size={16} style={{ color: '#09090b' }} />
                      <strong className="font-headline" style={{ fontSize: '0.95rem', color: '#09090b' }}>
                        GUARDAR NUEVO TOKEN DE TELEGRAM (ALMACENAMIENTO SEGURO)
                      </strong>
                    </div>
                    <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1rem', lineHeight: 1.4 }}>
                      Si generaste un nuevo token o revocaste el anterior en @BotFather, pégalo aquí. Se guardará directamente en tu base de datos Supabase cifrado y nunca se expondrá en Git ni a los clientes web.
                    </p>

                    {telegramSaveStatus && (
                      <div 
                        style={{ 
                          padding: '0.75rem 1rem', 
                          marginBottom: '1rem', 
                          backgroundColor: telegramSaveStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${telegramSaveStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                          color: telegramSaveStatus.type === 'success' ? '#166534' : '#991b1b',
                          fontSize: '0.8125rem'
                        }}
                        className="font-mono"
                      >
                        {telegramSaveStatus.message}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="password"
                        placeholder="Pega tu nuevo token de Telegram (ej: 123456789:ABCdef...)"
                        value={newTelegramToken}
                        onChange={(e) => setNewTelegramToken(e.target.value)}
                        className="font-mono"
                        style={{
                          flex: 1,
                          minWidth: '260px',
                          padding: '0.75rem',
                          border: '1px solid #d4d4d8',
                          fontSize: '0.8125rem',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSavingTelegramToken}
                        className="btn-solid-black font-mono"
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.8125rem' }}
                      >
                        {isSavingTelegramToken ? 'GUARDANDO...' : 'ACTUALIZAR TOKEN EN SERVIDOR'}
                      </button>
                    </div>
                  </form>

                  {/* Telegram Status feedback banner */}
                  {telegramTestStatus && (
                    <div 
                      style={{ 
                        padding: '1rem', 
                        marginBottom: '1.5rem', 
                        backgroundColor: telegramTestStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${telegramTestStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                        color: telegramTestStatus.type === 'success' ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}
                      className="font-mono"
                    >
                      {telegramTestStatus.type === 'success' ? (
                        <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.8125rem' }}>{telegramTestStatus.message}</span>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram}
                      className="btn-solid-black"
                      style={{ padding: '0.85rem 1.5rem', fontSize: '0.8125rem' }}
                    >
                      <Send size={15} />
                      {isTestingTelegram ? 'ENVIANDO MENSAJE...' : 'ENVIAR MENSAJE DE PRUEBA A MI TELEGRAM'}
                    </button>
                  </div>
                </div>

                {/* PIN Management Card */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <Key size={20} style={{ color: '#09090b' }} />
                    <h2 className="font-headline" style={{ fontSize: '1.4rem', color: '#09090b' }}>
                      CAMBIAR PIN DE ACCESO AL PANEL
                    </h2>
                  </div>
                  <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1.5rem' }}>
                    Establece tu propia contraseña privada para entrar al panel de administración desde cualquier dispositivo.
                  </p>

                  {pinChangeStatus && (
                    <div 
                      style={{ 
                        padding: '1rem', 
                        marginBottom: '1.5rem', 
                        backgroundColor: pinChangeStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${pinChangeStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                        color: pinChangeStatus.type === 'success' ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}
                      className="font-mono"
                    >
                      {pinChangeStatus.type === 'success' ? (
                        <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.8125rem' }}>{pinChangeStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePin} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#09090b', marginBottom: '0.35rem' }}>
                        NUEVO PIN PRIVADO (MÍNIMO 4 CARACTERES) *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Nuevo PIN personal"
                        value={customPinInput}
                        onChange={(e) => setCustomPinInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1px solid #09090b',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          borderRadius: 0
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-solid-black"
                      style={{ padding: '0.85rem 1.5rem', fontSize: '0.8125rem', width: 'fit-content' }}
                    >
                      ACTUALIZAR PIN DE ACCESO
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
