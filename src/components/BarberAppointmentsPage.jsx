import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Clock, Phone, MessageSquare, CheckCircle2, XCircle, 
  RefreshCw, ArrowLeft, ExternalLink, Scissors, User, AlertCircle, 
  ChevronLeft, ChevronRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { 
  fetchAdminAppointments, 
  updateAppointmentStatus, 
  fetchAdminPin 
} from '../lib/supabase';

export default function BarberAppointmentsPage({ onNavigateHome, onNavigateToAdmin }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('joao_admin_logged') === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Date selection: default to today (ISO YYYY-MM-DD)
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dayAfterTomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [filterMode, setFilterMode] = useState('date'); // 'date' or 'upcoming_all'

  // Live clock
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch appointments from Supabase
  const loadAppointments = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
      const { data, error } = await fetchAdminAppointments(pin);
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.warn('[Barber Appointments Load Error]:', err.message);
      setErrorMsg('No se pudieron actualizar las citas. Comprueba la conexión.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic auto-refresh every 25 seconds
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAppointments();
      const interval = setInterval(() => {
        loadAppointments(true);
      }, 25000);
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn, loadAppointments]);

  // Handle PIN Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(false);
    let serverPin = null;
    try {
      serverPin = await fetchAdminPin();
    } catch {}

    const correctPin = (serverPin || localStorage.getItem('joao_admin_pin_custom') || import.meta.env.VITE_ADMIN_PIN || 'admin1234').trim();

    if (pinInput.trim() === correctPin) {
      setIsAdminLoggedIn(true);
      setAuthError(false);
      try {
        localStorage.setItem('joao_admin_logged', 'true');
        localStorage.setItem('joao_admin_pin', pinInput.trim());
      } catch {}
    } else {
      setAuthError(true);
      setPinInput('');
    }
  };

  // Toggle status (completada, cancelada, confirmada)
  const handleUpdateStatus = async (aptId, newStatus) => {
    const pin = localStorage.getItem('joao_admin_pin_custom') || localStorage.getItem('joao_admin_pin') || import.meta.env.VITE_ADMIN_PIN || 'admin1234';
    
    // Actualización optimista local
    setAppointments((prev) => 
      prev.map((a) => a.id === aptId ? { ...a, status: newStatus } : a)
    );

    const res = await updateAppointmentStatus(aptId, newStatus, pin);
    if (!res.success) {
      loadAppointments(true);
    }
  };

  // Navigate date
  const handleShiftDate = (days) => {
    setFilterMode('date');
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const nextIso = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextIso);
  };

  // Filtered appointments for the active view
  const visibleAppointments = useMemo(() => {
    if (filterMode === 'upcoming_all') {
      return appointments
        .filter((a) => a.appointment_date >= todayIso && a.status !== 'cancelled')
        .sort((a, b) => {
          if (a.appointment_date === b.appointment_date) {
            return a.appointment_time.localeCompare(b.appointment_time);
          }
          return a.appointment_date.localeCompare(b.appointment_date);
        });
    }

    return appointments
      .filter((a) => a.appointment_date === selectedDate)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDate, filterMode, todayIso]);

  // Daily statistics for selected date
  const stats = useMemo(() => {
    const list = appointments.filter((a) => a.appointment_date === selectedDate);
    const total = list.length;
    const confirmed = list.filter((a) => a.status === 'confirmed').length;
    const completed = list.filter((a) => a.status === 'completed').length;
    const cancelled = list.filter((a) => a.status === 'cancelled').length;

    const totalIncome = list
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, a) => {
        const raw = String(a.service_price || '').replace('€', '').replace(',', '.').trim();
        const parsed = parseFloat(raw);
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);

    return { total, confirmed, completed, cancelled, totalIncome };
  }, [appointments, selectedDate]);

  // Format date display (e.g. "Miércoles, 16 de Septiembre")
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  // IF NOT AUTHENTICATED AS ADMIN: SHOW QUICK BARBER ACCESS SCREEN
  if (!isAdminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#18181b', border: '1px solid #27272a', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: 46, height: 46, backgroundColor: '#ffffff', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Scissors size={24} />
            </div>
          </div>

          <h1 className="font-headline" style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            AGENDA DE CITAS · JOÃO
          </h1>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '1.5rem' }}>
            Acceso privado exclusivo para el peluquero.
          </p>

          {authError && (
            <div 
              style={{ 
                backgroundColor: '#7f1d1d', 
                border: '1px solid #dc2626', 
                color: '#ffffff', 
                padding: '0.65rem 0.85rem', 
                marginBottom: '1rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              className="font-mono"
            >
              <AlertCircle size={16} />
              <span>PIN incorrecto. Inténtalo de nuevo.</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="password"
              required
              autoFocus
              inputMode="numeric"
              placeholder="Introduce tu PIN"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setAuthError(false);
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                border: '1px solid #3f3f46',
                backgroundColor: '#09090b',
                color: '#ffffff',
                fontSize: '1.25rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '0.25em',
                marginBottom: '1.25rem',
                outline: 'none',
                borderRadius: 0
              }}
            />

            <button
              type="submit"
              className="btn-solid-black"
              style={{ width: '100%', padding: '0.9rem', backgroundColor: '#ffffff', color: '#09090b', fontWeight: 800 }}
            >
              ENTRAR A MI AGENDA
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onNavigateHome}
              className="font-mono"
              style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Volver a la web principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED BARBER AGENDA VIEW
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#09090b', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Barber Header Bar */}
      <header style={{ backgroundColor: '#09090b', color: '#ffffff', borderBottom: '2px solid #27272a', padding: '0.85rem clamp(1rem, 3vw, 2.5rem)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, backgroundColor: '#ffffff', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Scissors size={20} />
            </div>
            <div>
              <div className="font-headline" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                AGENDA EN VIVO · JOÃO
              </div>
              <div className="font-mono" style={{ fontSize: '0.65rem', color: '#a1a1aa', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                <span>SINCRONIZADO EN TIEMPO REAL</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => loadAppointments(true)}
              disabled={isRefreshing}
              className="btn-outline-brutal"
              style={{ 
                padding: '0.45rem 0.85rem', 
                fontSize: '0.75rem', 
                color: '#ffffff', 
                borderColor: '#3f3f46',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#18181b'
              }}
              title="Refrescar citas"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="font-mono">{isRefreshing ? 'CARGANDO...' : 'ACTUALIZAR'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="btn-outline-brutal"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', color: '#ffffff', borderColor: '#3f3f46', backgroundColor: '#18181b' }}
            >
              PANEL ADMIN
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="btn-outline-brutal"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', color: '#ffffff', borderColor: '#3f3f46', backgroundColor: '#18181b' }}
            >
              VER WEB
            </button>
          </div>

        </div>
      </header>

      {/* Main Agenda Body */}
      <main style={{ flex: 1, padding: 'clamp(1rem, 2.5vw, 2rem) clamp(0.75rem, 3vw, 2.5rem)', maxWidth: '1050px', width: '100%', margin: '0 auto' }}>
        
        {/* Error notification banner */}
        {errorMsg && (
          <div 
            style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #ef4444', 
              color: '#991b1b', 
              padding: '0.75rem 1rem', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}
            className="font-mono"
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Date Selector and Quick Day Pills */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 0 #09090b' }}>
          
          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }} className="font-mono">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayIso);
                setFilterMode('date');
              }}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: filterMode === 'date' && selectedDate === todayIso ? '#09090b' : '#f4f4f5',
                color: filterMode === 'date' && selectedDate === todayIso ? '#ffffff' : '#09090b',
                border: '1px solid #09090b',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              HOY ({appointments.filter(a => a.appointment_date === todayIso && a.status !== 'cancelled').length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDate(tomorrowIso);
                setFilterMode('date');
              }}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: filterMode === 'date' && selectedDate === tomorrowIso ? '#09090b' : '#f4f4f5',
                color: filterMode === 'date' && selectedDate === tomorrowIso ? '#ffffff' : '#09090b',
                border: '1px solid #09090b',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              MAÑANA ({appointments.filter(a => a.appointment_date === tomorrowIso && a.status !== 'cancelled').length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDate(dayAfterTomorrowIso);
                setFilterMode('date');
              }}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: filterMode === 'date' && selectedDate === dayAfterTomorrowIso ? '#09090b' : '#f4f4f5',
                color: filterMode === 'date' && selectedDate === dayAfterTomorrowIso ? '#ffffff' : '#09090b',
                border: '1px solid #09090b',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              PASADO MAÑANA ({appointments.filter(a => a.appointment_date === dayAfterTomorrowIso && a.status !== 'cancelled').length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('upcoming_all')}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: filterMode === 'upcoming_all' ? '#09090b' : '#f4f4f5',
                color: filterMode === 'upcoming_all' ? '#ffffff' : '#09090b',
                border: '1px solid #09090b',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              TODAS LAS PRÓXIMAS ({appointments.filter(a => a.appointment_date >= todayIso && a.status !== 'cancelled').length})
            </button>
          </div>

          {/* Date Navigator (Previous / Current Date / Next) */}
          {filterMode === 'date' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #e4e4e7', paddingTop: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="btn-outline-brutal"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Día anterior"
                >
                  <ChevronLeft size={16} />
                  <span className="font-mono">ANTERIOR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="btn-outline-brutal"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Día siguiente"
                >
                  <span className="font-mono">SIGUIENTE</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Formatted Date Title */}
              <div style={{ textAlign: 'center' }}>
                <div className="font-headline" style={{ fontSize: 'clamp(1.15rem, 3vw, 1.45rem)', textTransform: 'capitalize', color: '#09090b' }}>
                  {formattedSelectedDate}
                </div>
                {selectedDate === todayIso && (
                  <span className="tech-badge" style={{ backgroundColor: '#16a34a', color: '#ffffff', marginTop: '0.2rem' }}>
                    ● DÍA ACTUAL (HOY)
                  </span>
                )}
              </div>

              {/* Direct date picker input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} style={{ color: '#71717a' }} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setFilterMode('date');
                    }
                  }}
                  style={{
                    padding: '0.4rem 0.6rem',
                    border: '1px solid #09090b',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    borderRadius: 0,
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

            </div>
          )}

        </div>

        {/* Daily Summary Counters */}
        {filterMode === 'date' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.85rem 1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block' }}>TOTAL CITAS</span>
              <span className="font-headline" style={{ fontSize: '1.75rem', color: '#09090b' }}>{stats.total}</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.85rem 1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block' }}>PENDIENTES</span>
              <span className="font-headline" style={{ fontSize: '1.75rem', color: '#d97706' }}>{stats.confirmed}</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.85rem 1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block' }}>COMPLETADAS</span>
              <span className="font-headline" style={{ fontSize: '1.75rem', color: '#16a34a' }}>{stats.completed}</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.85rem 1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block' }}>CAJA ESTIMADA</span>
              <span className="font-headline" style={{ fontSize: '1.75rem', color: '#09090b' }}>{stats.totalIncome.toFixed(2).replace('.', ',')} €</span>
            </div>
          </div>
        )}

        {/* Appointments List / Timeline */}
        {isLoading ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '3rem 1rem', textAlign: 'center' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#09090b' }} />
            <div className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700 }}>CARGANDO CITAS DEL SERVIDOR...</div>
          </div>
        ) : visibleAppointments.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #09090b', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem', color: '#a1a1aa' }} />
            <h3 className="font-headline" style={{ fontSize: '1.35rem', color: '#09090b', marginBottom: '0.35rem' }}>
              NO HAY CITAS REGISTRADAS
            </h3>
            <p className="font-mono" style={{ fontSize: '0.8125rem', color: '#71717a', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {filterMode === 'date' 
                ? `No hay ninguna cita programada para el ${formattedSelectedDate}.`
                : 'No hay ninguna cita próxima pendiente en la agenda.'}
            </p>
            {selectedDate !== todayIso && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                className="btn-solid-black"
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.8125rem' }}
              >
                VOLVER AL DÍA DE HOY
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {visibleAppointments.map((apt) => {
              const isCompleted = apt.status === 'completed';
              const isCancelled = apt.status === 'cancelled';
              const isConfirmed = apt.status === 'confirmed' || !apt.status;

              // WhatsApp message url
              const cleanPhone = String(apt.client_phone || '').replace(/\D/g, '');
              const waPhone = cleanPhone.startsWith('34') ? cleanPhone : (cleanPhone.length === 9 ? `34${cleanPhone}` : cleanPhone);
              const waText = encodeURIComponent(
                `Hola ${apt.client_name}, te escribo de João Peluquero's respecto a tu cita del ${apt.appointment_date} a las ${apt.appointment_time} (${apt.service_name}). ¡Te esperamos en el salón!`
              );
              const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

              return (
                <div
                  key={apt.id || `${apt.appointment_date}-${apt.appointment_time}`}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #09090b',
                    boxShadow: isCompleted ? 'none' : '0 2px 0 #09090b',
                    padding: 'clamp(1rem, 2.5vw, 1.35rem)',
                    opacity: isCancelled ? 0.6 : isCompleted ? 0.8 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    
                    {/* Left: Time and Service Info */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {/* Big Bold Time */}
                      <div 
                        style={{ 
                          backgroundColor: isCompleted ? '#f4f4f5' : isCancelled ? '#fef2f2' : '#09090b', 
                          color: isCompleted ? '#71717a' : isCancelled ? '#dc2626' : '#ffffff',
                          padding: '0.65rem 0.85rem',
                          textAlign: 'center',
                          minWidth: '85px',
                          border: '1px solid #09090b'
                        }}
                        className="font-mono"
                      >
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>
                          {apt.appointment_time}
                        </div>
                        {filterMode === 'upcoming_all' && (
                          <div style={{ fontSize: '0.625rem', marginTop: '0.25rem', color: isCompleted ? '#a1a1aa' : '#e4e4e7' }}>
                            {apt.appointment_date}
                          </div>
                        )}
                      </div>

                      {/* Service & Client Details */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 className="font-headline" style={{ fontSize: '1.25rem', color: '#09090b', margin: 0, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                            {apt.service_name}
                          </h4>
                          <span className="tech-badge" style={{ backgroundColor: '#f4f4f5', color: '#09090b', border: '1px solid #09090b', fontWeight: 800 }}>
                            {apt.service_price}
                          </span>
                        </div>

                        {/* Client details */}
                        <div className="font-mono" style={{ fontSize: '0.875rem', marginTop: '0.4rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#09090b', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={15} style={{ color: '#71717a' }} />
                            {apt.client_name}
                          </span>
                          <span style={{ color: '#a1a1aa' }}>·</span>
                          <a 
                            href={`tel:${apt.client_phone}`}
                            style={{ color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                          >
                            <Phone size={14} style={{ color: '#16a34a' }} />
                            {apt.client_phone}
                          </a>
                        </div>

                        {/* Optional notes */}
                        {apt.notes && (
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '0.35rem', backgroundColor: '#fafafa', padding: '0.35rem 0.5rem', borderLeft: '2px solid #09090b' }}>
                            Nota: {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Badge */}
                    <div>
                      {isCompleted && (
                        <span className="tech-badge" style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>
                          ✓ COMPLETADA
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="tech-badge" style={{ backgroundColor: '#d97706', color: '#ffffff' }}>
                          ● PENDIENTE / EN AGENDA
                        </span>
                      )}
                      {isCancelled && (
                        <span className="tech-badge" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                          ✕ CANCELADA
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Bottom Action Buttons (Large, Comfortable Touch-Targets) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f4f4f5', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                    
                    {/* Direct WhatsApp Button */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-solid-black"
                      style={{ 
                        padding: '0.55rem 0.95rem', 
                        fontSize: '0.75rem', 
                        backgroundColor: '#16a34a', 
                        borderColor: '#15803d', 
                        color: '#ffffff',
                        textDecoration: 'none' 
                      }}
                    >
                      <MessageSquare size={14} />
                      WHATSAPP
                    </a>

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${apt.client_phone}`}
                      className="btn-outline-brutal"
                      style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem', textDecoration: 'none', color: '#09090b' }}
                    >
                      <Phone size={14} />
                      LLAMAR
                    </a>

                    {/* Complete Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        className="btn-outline-brutal"
                        style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem', color: '#16a34a', borderColor: '#16a34a', marginLeft: 'auto' }}
                      >
                        <CheckCircle2 size={14} />
                        MARCAR COMO REALIZADA
                      </button>
                    )}

                    {/* Reopen / Reset Button */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        className="btn-outline-brutal"
                        style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                      >
                        VOLVER A PENDIENTE
                      </button>
                    )}

                    {/* Cancel Button */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas cancelar la cita de ${apt.client_name} a las ${apt.appointment_time}?`)) {
                            handleUpdateStatus(apt.id, 'cancelled');
                          }
                        }}
                        className="btn-outline-brutal"
                        style={{ padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="Cancelar cita"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
}
