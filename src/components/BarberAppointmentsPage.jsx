import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const dateInputRef = useRef(null);

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

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
    const confirmed = list.filter((a) => a.status === 'confirmed' || !a.status).length;
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

  // Format date display (e.g. "Miércoles, 16 Sep")
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short'
    });
  }, [selectedDate]);

  const todayCount = useMemo(() => appointments.filter(a => a.appointment_date === todayIso && a.status !== 'cancelled').length, [appointments, todayIso]);
  const tomorrowCount = useMemo(() => appointments.filter(a => a.appointment_date === tomorrowIso && a.status !== 'cancelled').length, [appointments, tomorrowIso]);
  const dayAfterCount = useMemo(() => appointments.filter(a => a.appointment_date === dayAfterTomorrowIso && a.status !== 'cancelled').length, [appointments, dayAfterTomorrowIso]);
  const upcomingCount = useMemo(() => appointments.filter(a => a.appointment_date >= todayIso && a.status !== 'cancelled').length, [appointments, todayIso]);

  // IF NOT AUTHENTICATED AS ADMIN: SHOW QUICK BARBER ACCESS SCREEN
  if (!isAdminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
        <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#18181b', border: '1px solid #27272a', padding: '1.75rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#ffffff', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Scissors size={22} />
            </div>
          </div>

          <h1 className="font-headline" style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            AGENDA DE CITAS · JOÃO
          </h1>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Introduce tu PIN de administrador para consultar tu agenda en directo.
          </p>

          {authError && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', padding: '0.65rem 0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }} className="font-mono">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>PIN incorrecto. Inténtalo de nuevo.</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Introduce tu PIN"
              required
              autoFocus
              className="font-mono"
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#09090b',
                color: '#ffffff',
                border: '1px solid #3f3f46',
                borderRadius: 0,
                fontSize: '16px',
                textAlign: 'center',
                letterSpacing: '0.25em',
                marginBottom: '1rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              className="btn-solid-black"
              style={{ width: '100%', padding: '0.85rem', backgroundColor: '#ffffff', color: '#09090b', fontWeight: 800, fontSize: '0.8125rem' }}
            >
              ENTRAR A MI AGENDA
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
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

  // AUTHENTICATED BARBER AGENDA VIEW (100% Mobile First & Responsive)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#09090b', display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Top Barber Header Bar */}
      <header style={{ backgroundColor: '#09090b', color: '#ffffff', borderBottom: '2px solid #27272a', padding: '0.65rem clamp(0.75rem, 2.5vw, 1.5rem)', position: 'sticky', top: 0, zIndex: 40, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div style={{ width: 32, height: 32, backgroundColor: '#ffffff', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              <Scissors size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="font-headline" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                AGENDA JOÃO
              </div>
              <div className="font-mono" style={{ fontSize: '0.6rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                <span>EN VIVO</span>
              </div>
            </div>
          </div>

          {/* Action Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => loadAppointments(true)}
              disabled={isRefreshing}
              className="font-mono"
              style={{ 
                padding: '0.4rem 0.55rem', 
                fontSize: '0.6875rem', 
                color: '#ffffff', 
                border: '1px solid #3f3f46',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: '#18181b',
                cursor: 'pointer'
              }}
              title="Refrescar citas"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? '...' : 'REFRESCAR'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="font-mono"
              style={{ padding: '0.4rem 0.55rem', fontSize: '0.6875rem', color: '#ffffff', border: '1px solid #3f3f46', backgroundColor: '#18181b', cursor: 'pointer' }}
              title="Panel de Administración"
            >
              ADMIN
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="font-mono"
              style={{ padding: '0.4rem 0.55rem', fontSize: '0.6875rem', color: '#ffffff', border: '1px solid #3f3f46', backgroundColor: '#18181b', cursor: 'pointer' }}
              title="Volver a la web pública"
            >
              WEB
            </button>
          </div>

        </div>
      </header>

      {/* Main Agenda Body */}
      <main style={{ flex: 1, padding: '0.85rem clamp(0.65rem, 2.5vw, 1.25rem)', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        
        {/* Error notification banner */}
        {errorMsg && (
          <div 
            style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #ef4444', 
              color: '#991b1b', 
              padding: '0.65rem 0.85rem', 
              marginBottom: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.75rem' 
            }} 
            className="font-mono"
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Day Filter Tabs - Touch scrollable */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '0.35rem', 
            overflowX: 'auto', 
            paddingBottom: '0.35rem', 
            marginBottom: '0.75rem', 
            scrollbarWidth: 'none', 
            WebkitOverflowScrolling: 'touch' 
          }} 
          className="font-mono"
        >
          <button
            type="button"
            onClick={() => { setSelectedDate(todayIso); setFilterMode('date'); }}
            style={{
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap',
              backgroundColor: filterMode === 'date' && selectedDate === todayIso ? '#09090b' : '#ffffff',
              color: filterMode === 'date' && selectedDate === todayIso ? '#ffffff' : '#09090b',
              border: '1px solid #09090b',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            HOY ({todayCount})
          </button>

          <button
            type="button"
            onClick={() => { setSelectedDate(tomorrowIso); setFilterMode('date'); }}
            style={{
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap',
              backgroundColor: filterMode === 'date' && selectedDate === tomorrowIso ? '#09090b' : '#ffffff',
              color: filterMode === 'date' && selectedDate === tomorrowIso ? '#ffffff' : '#09090b',
              border: '1px solid #09090b',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            MAÑANA ({tomorrowCount})
          </button>

          <button
            type="button"
            onClick={() => { setSelectedDate(dayAfterTomorrowIso); setFilterMode('date'); }}
            style={{
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap',
              backgroundColor: filterMode === 'date' && selectedDate === dayAfterTomorrowIso ? '#09090b' : '#ffffff',
              color: filterMode === 'date' && selectedDate === dayAfterTomorrowIso ? '#ffffff' : '#09090b',
              border: '1px solid #09090b',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            PASADO ({dayAfterCount})
          </button>

          <button
            type="button"
            onClick={handleOpenCalendar}
            style={{
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap',
              backgroundColor: '#ffffff',
              color: '#09090b',
              border: '1px solid #09090b',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Abrir calendario completo"
          >
            <Calendar size={13} />
            <span>CALENDARIO</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('upcoming_all')}
            style={{
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap',
              backgroundColor: filterMode === 'upcoming_all' ? '#09090b' : '#ffffff',
              color: filterMode === 'upcoming_all' ? '#ffffff' : '#09090b',
              border: '1px solid #09090b',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: 'auto'
            }}
          >
            TODAS ({upcomingCount})
          </button>
        </div>

        {/* Date Navigator - Left Arrow, Center Calendar Button, Right Arrow (Zero Overlap Guaranteed) */}
        {filterMode === 'date' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #09090b', 
              padding: '0.45rem 0.65rem', 
              marginBottom: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '0.5rem',
              width: '100%'
            }}
          >
            {/* 1. Botón Día Anterior (A la izquierda) */}
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              style={{ 
                width: 38, 
                height: 38, 
                border: '1px solid #09090b', 
                backgroundColor: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                flexShrink: 0,
                borderRadius: 0
              }}
              title="Día anterior"
              aria-label="Día anterior"
            >
              <ChevronLeft size={20} />
            </button>

            {/* 2. Botón Centro: Toca para abrir Calendario */}
            <button
              type="button"
              onClick={handleOpenCalendar}
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#f4f4f5',
                border: '1px solid #e4e4e7',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0
              }}
              title="Toca para elegir cualquier fecha en el calendario"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', maxWidth: '100%' }}>
                <Calendar size={14} style={{ color: '#09090b', flexShrink: 0 }} />
                <span 
                  className="font-headline" 
                  style={{ 
                    fontSize: 'clamp(0.95rem, 3.8vw, 1.25rem)', 
                    textTransform: 'capitalize', 
                    color: '#09090b', 
                    lineHeight: 1.1, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}
                >
                  {formattedSelectedDate}
                </span>
              </div>
              {selectedDate === todayIso ? (
                <span style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
                  ● DÍA DE HOY (TOCA PARA CAMBIAR DÍA)
                </span>
              ) : (
                <span style={{ fontSize: '0.6rem', color: '#71717a', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
                  Toca para elegir otra fecha
                </span>
              )}
            </button>

            {/* Input nativo de fecha totalmente fuera de pantalla (cero interferencia física) */}
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setFilterMode('date');
                }
              }}
              style={{ 
                position: 'fixed', 
                top: '-9999px', 
                left: '-9999px', 
                opacity: 0, 
                pointerEvents: 'none', 
                width: '1px', 
                height: '1px' 
              }}
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* 3. Botón Día Siguiente (A la derecha del todo, totalmente aislado) */}
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              style={{ 
                width: 38, 
                height: 38, 
                border: '1px solid #09090b', 
                backgroundColor: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                flexShrink: 0,
                borderRadius: 0
              }}
              title="Día siguiente"
              aria-label="Día siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Daily Summary Ribbon - 4 compact responsive columns */}
        {filterMode === 'date' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginBottom: '0.85rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.4rem 0.25rem', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '0.55rem', color: '#71717a' }}>TOTAL</div>
              <div className="font-headline" style={{ fontSize: '1.25rem', lineHeight: 1, color: '#09090b', marginTop: '0.15rem' }}>{stats.total}</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.4rem 0.25rem', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '0.55rem', color: '#71717a' }}>PEND.</div>
              <div className="font-headline" style={{ fontSize: '1.25rem', lineHeight: 1, color: '#d97706', marginTop: '0.15rem' }}>{stats.confirmed}</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.4rem 0.25rem', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '0.55rem', color: '#71717a' }}>LISTAS</div>
              <div className="font-headline" style={{ fontSize: '1.25rem', lineHeight: 1, color: '#16a34a', marginTop: '0.15rem' }}>{stats.completed}</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '0.4rem 0.25rem', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '0.55rem', color: '#71717a' }}>CAJA</div>
              <div className="font-headline" style={{ fontSize: '1.05rem', lineHeight: 1, color: '#09090b', marginTop: '0.25rem' }}>{stats.totalIncome}€</div>
            </div>
          </div>
        )}

        {/* Appointments List / Timeline */}
        {isLoading ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #09090b', padding: '2.5rem 1rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.65rem', color: '#09090b' }} />
            <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>CARGANDO CITAS DEL SERVIDOR...</div>
          </div>
        ) : visibleAppointments.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #09090b', padding: '2.5rem 1rem', textAlign: 'center' }}>
            <Calendar size={32} style={{ margin: '0 auto 0.5rem', color: '#a1a1aa' }} />
            <h3 className="font-headline" style={{ fontSize: '1.2rem', color: '#09090b', marginBottom: '0.25rem' }}>
              NO HAY CITAS REGISTRADAS
            </h3>
            <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', maxWidth: '350px', margin: '0 auto 1.25rem' }}>
              {filterMode === 'date' 
                ? `No hay ninguna cita programada para el ${formattedSelectedDate}.`
                : 'No hay ninguna cita próxima pendiente en la agenda.'}
            </p>
            {selectedDate !== todayIso && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                className="btn-solid-black"
                style={{ padding: '0.65rem 1rem', fontSize: '0.75rem' }}
              >
                VOLVER A HOY
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                    padding: '0.85rem clamp(0.75rem, 2vw, 1rem)',
                    opacity: isCancelled ? 0.6 : isCompleted ? 0.85 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Row 1: Time, Service Title, Price & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div 
                        className="font-mono"
                        style={{ 
                          backgroundColor: isCompleted ? '#f4f4f5' : isCancelled ? '#fef2f2' : '#09090b', 
                          color: isCompleted ? '#71717a' : isCancelled ? '#dc2626' : '#ffffff',
                          padding: '0.35rem 0.55rem',
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          border: '1px solid #09090b',
                          flexShrink: 0
                        }}
                      >
                        {apt.appointment_time}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <h4 className="font-headline" style={{ fontSize: '1.05rem', color: '#09090b', margin: 0, textDecoration: isCancelled ? 'line-through' : 'none', lineHeight: 1.1 }}>
                            {apt.service_name}
                          </h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#f4f4f5', padding: '0.1rem 0.35rem', border: '1px solid #09090b' }}>
                            {apt.service_price}
                          </span>
                        </div>
                        {filterMode === 'upcoming_all' && (
                          <div className="font-mono" style={{ fontSize: '0.625rem', color: '#71717a', marginTop: '0.15rem' }}>
                            📅 {apt.appointment_date}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{ flexShrink: 0 }}>
                      {isCompleted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.45rem', fontSize: '0.625rem', fontWeight: 800, fontFamily: 'monospace' }}>
                          <CheckCircle2 size={11} />
                          <span>LISTA</span>
                        </span>
                      ) : isCancelled ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.2rem 0.45rem', fontSize: '0.625rem', fontWeight: 800, fontFamily: 'monospace' }}>
                          <XCircle size={11} />
                          <span>CANCELADA</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.2rem 0.45rem', fontSize: '0.625rem', fontWeight: 800, fontFamily: 'monospace' }}>
                          <Clock size={11} />
                          <span>CONFIRMADA</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Client Info & Phone */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', padding: '0.4rem 0', borderTop: '1px solid #f4f4f5', borderBottom: '1px solid #f4f4f5', marginBottom: '0.65rem' }}>
                    <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#09090b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} style={{ color: '#71717a' }} />
                      <span>{apt.client_name}</span>
                    </div>

                    <a 
                      href={`tel:${apt.client_phone}`}
                      className="font-mono"
                      style={{ fontSize: '0.8125rem', color: '#09090b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                    >
                      <Phone size={13} style={{ color: '#16a34a' }} />
                      <span>{apt.client_phone}</span>
                    </a>
                  </div>

                  {/* Optional Notes */}
                  {apt.notes && (
                    <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#3f3f46', marginBottom: '0.65rem', backgroundColor: '#fafafa', padding: '0.35rem 0.5rem', borderLeft: '2px solid #09090b' }}>
                      Nota: {apt.notes}
                    </div>
                  )}

                  {/* Row 3: Action Buttons (Touch Ergonomic) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.35rem' }}>
                    {/* WhatsApp */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        border: '1px solid #15803d'
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>WHATSAPP</span>
                    </a>

                    {/* Llamar */}
                    <a
                      href={`tel:${apt.client_phone}`}
                      className="font-mono"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        backgroundColor: '#ffffff',
                        color: '#09090b',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid #09090b'
                      }}
                    >
                      <Phone size={13} />
                      <span>LLAMAR</span>
                    </a>

                    {/* Realizada */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        className="font-mono"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#ffffff',
                          color: '#15803d',
                          padding: '0.55rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid #15803d'
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>LISTA</span>
                      </button>
                    )}

                    {/* Cancelar */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas cancelar la cita de ${apt.client_name}?`)) {
                            handleUpdateStatus(apt.id, 'cancelled');
                          }
                        }}
                        className="font-mono"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#ffffff',
                          color: '#dc2626',
                          padding: '0.55rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid #f87171'
                        }}
                      >
                        <XCircle size={13} />
                        <span>CANCELAR</span>
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
