import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, Phone, Check, AlertCircle, ArrowRight, ArrowLeft, Download, MessageSquare, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createAppointment, fetchBookedSlots, fetchMonthBookedSlots, isSupabaseConfigured } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';
import { validateSpanishMobile } from '../lib/phoneValidator';

export default function BookingModal({ isOpen, onClose, initialService, services }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const [bookedSlots, setBookedSlots] = useState([]);
  const [monthBookedCounts, setMonthBookedCounts] = useState({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Phone Validation Status
  const phoneCheck = useMemo(() => {
    return clientPhone.trim() ? validateSpanishMobile(clientPhone) : null;
  }, [clientPhone]);

  // Calendar View Month State
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  const todayIso = React.useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const monthNamesSpanish = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const dayNamesSpanish = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Oficial Time Slots (12 turnos diarios de atención)
  const allTimeSlots = useMemo(() => [
    { time: '09:30', period: 'Mañana' },
    { time: '10:15', period: 'Mañana' },
    { time: '11:00', period: 'Mañana' },
    { time: '11:45', period: 'Mañana' },
    { time: '12:30', period: 'Mañana' },
    { time: '13:15', period: 'Mañana' },
    { time: '16:30', period: 'Tarde' },
    { time: '17:15', period: 'Tarde' },
    { time: '18:00', period: 'Tarde' },
    { time: '18:45', period: 'Tarde' },
    { time: '19:30', period: 'Tarde' },
    { time: '20:15', period: 'Tarde' },
  ], []);

  // Hora actual en vivo (para ocultar de forma estricta turnos pasados si es hoy)
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Turnos visibles: Si la fecha elegida es HOY, NO salen las horas que ya hayan pasado
  const visibleTimeSlots = useMemo(() => {
    if (selectedDate !== todayIso) {
      return allTimeSlots;
    }
    return allTimeSlots.filter((slot) => slot.time > currentTimeStr);
  }, [allTimeSlots, selectedDate, todayIso, currentTimeStr]);

  // Si se había marcado una hora de hoy que ya venció, desmarcarla automáticamente
  useEffect(() => {
    if (selectedDate === todayIso && selectedTime && selectedTime <= currentTimeStr) {
      setSelectedTime('');
    }
  }, [selectedDate, todayIso, selectedTime, currentTimeStr]);

  // Función para refrescar el cómputo de citas del mes visible
  const refreshMonthBookings = React.useCallback(async (year, month) => {
    setIsLoadingMonth(true);
    try {
      const counts = await fetchMonthBookedSlots(year, month);
      setMonthBookedCounts(counts || {});
    } catch {
      setMonthBookedCounts({});
    } finally {
      setIsLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshMonthBookings(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1);
    }
  }, [isOpen, calendarViewDate, refreshMonthBookings]);

  // Bloqueo de scroll en el fondo mientras el modal está abierto para evitar sacudidas y saltos de zoom en móviles
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const modalContentRef = React.useRef(null);

  // Cada vez que cambia de paso (especialmente al llegar al ticket final paso 4), resetea el scroll arriba para que sea 100% visible
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [step]);

  // Full Month Days Matrix con detección de días 100% llenos
  const calendarDays = React.useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    // First day index (Monday = 0 ... Sunday = 6)
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty padding
    for (let i = 0; i < startOffset; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isSunday = dayOfWeek === 0;
      const isPast = iso < todayIso;
      const bookedCount = monthBookedCounts[iso] || 0;
      const isToday = iso === todayIso;
      // Si es hoy, comprobar si ya pasaron todos los turnos del día
      const areAllSlotsPastForToday = isToday && allTimeSlots.every((slot) => slot.time <= currentTimeStr);
      const isFullyBooked = bookedCount >= allTimeSlots.length || areAllSlotsPastForToday;
      const isDisabled = isSunday || isPast || isFullyBooked;
      
      days.push({
        type: 'day',
        dayNumber: d,
        iso,
        isDisabled,
        isFullyBooked,
        bookedCount,
        isToday,
        isSunday,
        key: iso
      });
    }
    
    return days;
  }, [calendarViewDate, todayIso, monthBookedCounts, allTimeSlots, currentTimeStr]);

  const handlePrevMonth = () => {
    setCalendarViewDate((prev) => {
      const current = new Date();
      const newD = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      // Don't allow navigating before current month
      if (newD.getFullYear() < current.getFullYear() || (newD.getFullYear() === current.getFullYear() && newD.getMonth() < current.getMonth())) {
        return prev;
      }
      return newD;
    });
  };

  const handleNextMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        setSelectedService(initialService);
        setStep(2);
      } else {
        setSelectedService(services[0] || null);
        setStep(1);
      }
      if (!selectedDate) {
        const now = new Date();
        if (now.getDay() === 0) {
          now.setDate(now.getDate() + 1);
        }
        const defaultIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setSelectedDate(defaultIso);
      }
      setErrorMsg(null);
      setConfirmedBooking(null);
    }
  }, [isOpen, initialService, services]);

  useEffect(() => {
    if (selectedDate) {
      let isMounted = true;
      setIsLoadingSlots(true);
      fetchBookedSlots(selectedDate).then((slots) => {
        if (isMounted) {
          const booked = slots || [];
          setBookedSlots(booked);
          setIsLoadingSlots(false);
          setSelectedTime((prevTime) => (booked.includes(prevTime) ? '' : prevTime));
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedService) {
      setErrorMsg('Por favor selecciona un servicio.');
      setStep(1);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMsg('Por favor selecciona la fecha y hora de tu cita.');
      setStep(2);
      return;
    }

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }

    const phoneCheck = validateSpanishMobile(clientPhone);
    if (!phoneCheck.isValid) {
      setErrorMsg(phoneCheck.message || 'Por favor ingresa un número de teléfono móvil real para confirmar tu cita.');
      return;
    }

    if (!acceptPrivacy) {
      setErrorMsg('Debes aceptar la Política de Privacidad para poder tramitar tu cita.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      service_id: selectedService.id || null,
      service_name: selectedService.name,
      service_price: selectedService.price || selectedService.price_eur || '0,00 €',
      client_name: clientName.trim(),
      client_phone: phoneCheck.international || phoneCheck.formatted || clientPhone.trim(),
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      notes: clientNotes.trim()
    };

    const { data, error } = await createAppointment(payload);

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Error al guardar la cita. Verifica la conexión a la base de datos.');
      // Si el turno fue ocupado por otra persona, refrescar inmediatamente
      if (selectedDate) {
        fetchBookedSlots(selectedDate).then((slots) => {
          setBookedSlots(slots || []);
          if (slots && slots.includes(selectedTime)) {
            setSelectedTime('');
            setStep(2); // Devolver al cliente a selección de fecha/hora
          }
        });
        refreshMonthBookings(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1);
      }
    } else {
      setConfirmedBooking(data || payload);
      setStep(4);
      refreshMonthBookings(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1);

      // Notificación automática en segundo plano
      try {
        await sendNotification({
          type: 'appointment',
          title: 'NUEVA CITA AGENDADA',
          customerName: clientName.trim(),
          customerPhone: clientPhone.trim(),
          details: `${selectedService.name} el ${selectedDate} a las ${selectedTime}`,
          amount: selectedService.price || (selectedService.price_eur ? `${selectedService.price_eur} €` : '0,00 €')
        });
      } catch {
        // ignore
      }

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#000000', '#27272a', '#71717a', '#ffffff']
        });
      } catch {
        // fallback
      }
    }
  };

  const handleAddToCalendar = (preferredType = 'auto') => {
    if (!confirmedBooking) return;

    const dateClean = confirmedBooking.appointment_date.replace(/-/g, '');
    const [hours, mins] = (confirmedBooking.appointment_time || '10:00').split(':');
    const startHour = parseInt(hours, 10);
    const startMin = parseInt(mins, 10);

    // Duración de 45 minutos por defecto
    const endTotalMins = startHour * 60 + startMin + 45;
    const endHour = String(Math.floor(endTotalMins / 60)).padStart(2, '0');
    const endMin = String(endTotalMins % 60).padStart(2, '0');

    const startTimeClean = `${hours}${mins}00`;
    const endTimeClean = `${endHour}${endMin}00`;

    const title = `Cita: ${confirmedBooking.service_name} · Joao Peluquero's`;
    const location = "Av. Alcalde Federico Molina Orta, 4, 21007, Huelva";
    const details = `Cita de barbería con João para ${confirmedBooking.service_name}.\nTeléfono: ${confirmedBooking.client_phone}\nUbicación: ${location}`;

    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const openGoogleCalendar = () => {
      const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
      window.open(gCalUrl, '_blank');
    };

    const downloadOrOpenIcs = () => {
      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Joao Peluqueros//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
        `LOCATION:${location.replace(/,/g, '\\,')}`,
        `DTSTART:${dateClean}T${startTimeClean}`,
        `DTEND:${dateClean}T${endTimeClean}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `cita-joao-${confirmedBooking.appointment_date}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (preferredType === 'google') {
      openGoogleCalendar();
    } else if (preferredType === 'apple' || preferredType === 'ics') {
      downloadOrOpenIcs();
    } else {
      // Auto-detección inteligente: Android abre Google Calendar app, iPhone abre Apple Calendar .ics
      if (isAndroid) {
        openGoogleCalendar();
      } else {
        downloadOrOpenIcs();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div 
          style={{ 
            backgroundColor: '#09090b', 
            color: '#ffffff', 
            padding: '1.15rem clamp(1rem, 3vw, 1.75rem)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div>
            <div className="font-headline" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              SISTEMA DE CITAS · JOAO
            </div>
            <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
              CONFIRMACIÓN INMEDIATA · HUELVA
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal de reserva"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Step Progression Ribbon */}
        {step < 4 && (
          <div 
            className="font-mono" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              borderBottom: '1px solid #09090b', 
              fontSize: 'clamp(0.625rem, 1.8vw, 0.6875rem)',
              textAlign: 'center',
              backgroundColor: '#fafafa'
            }}
          >
            <div 
              style={{ 
                padding: '0.65rem 0.25rem', 
                backgroundColor: step === 1 ? '#09090b' : 'transparent',
                color: step === 1 ? '#ffffff' : '#71717a',
                fontWeight: step === 1 ? 700 : 500,
                borderRight: '1px solid #e4e4e7'
              }}
            >
              [01] SERVICIO
            </div>
            <div 
              style={{ 
                padding: '0.65rem 0.25rem', 
                backgroundColor: step === 2 ? '#09090b' : 'transparent',
                color: step === 2 ? '#ffffff' : '#71717a',
                fontWeight: step === 2 ? 700 : 500,
                borderRight: '1px solid #e4e4e7'
              }}
            >
              [02] HORARIO
            </div>
            <div 
              style={{ 
                padding: '0.65rem 0.25rem', 
                backgroundColor: step === 3 ? '#09090b' : 'transparent',
                color: step === 3 ? '#ffffff' : '#71717a',
                fontWeight: step === 3 ? 700 : 500
              }}
            >
              [03] DATOS
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMsg && (
          <div 
            style={{ 
              backgroundColor: '#fef2f2', 
              borderBottom: '1px solid #ef4444', 
              color: '#991b1b', 
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.8125rem'
            }}
            className="font-mono"
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="booking-modal-body" style={{ padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 className="font-headline" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: '#09090b', letterSpacing: '-0.02em' }}>
                  ELIGE EL SERVICIO
                </h3>
                <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                  Selecciona el tipo de trabajo que deseas realizarte.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {services.map((srv) => {
                  const isSelected = selectedService?.id === srv.id || selectedService?.name === srv.name;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      style={{
                        border: isSelected ? '2px solid #09090b' : '1px solid #e4e4e7',
                        padding: '1rem',
                        backgroundColor: isSelected ? '#fafafa' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="font-headline" style={{ fontSize: '1.1rem', color: '#09090b' }}>
                            {srv.name}
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                            ({srv.duration || `${srv.duration_min}min`})
                          </span>
                        </div>
                        {srv.description && (
                          <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.2rem', textWrap: 'pretty' }}>
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span className="font-headline" style={{ fontSize: '1.25rem', color: '#09090b', fontWeight: 800 }}>
                          {srv.price || (srv.price_eur ? `${srv.price_eur.toFixed(2).replace('.', ',')} €` : '')}
                        </span>
                        <div 
                          style={{ 
                            width: 22, 
                            height: 22, 
                            border: '1px solid #09090b', 
                            backgroundColor: isSelected ? '#09090b' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="btn-solid-black"
                  style={{ width: '100%' }}
                >
                  CONTINUAR A FECHA & HORA
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & TIME */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 className="font-headline" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: '#09090b', letterSpacing: '-0.02em' }}>
                    FECHA Y HORARIO
                  </h3>
                  <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem' }}>
                    {selectedService?.name} ({selectedService?.price})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-mono"
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', color: '#09090b' }}
                >
                  CAMBIAR
                </button>
              </div>

              {/* Full-Month Interactive Calendar */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: 700, marginBottom: '0.65rem' }}>
                  1. SELECCIONA EL DÍA (CALENDARIO COMPLETO):
                </div>

                <div className="calendar-full-month">
                  {/* Month Navigation */}
                  <div className="calendar-header">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      style={{
                        background: 'transparent',
                        border: '1px solid #09090b',
                        padding: '0.35rem 0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft size={16} />
                      <span className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 700 }}>ANT</span>
                    </button>

                    <div className="font-headline" style={{ fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#09090b' }}>
                      {monthNamesSpanish[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      style={{
                        background: 'transparent',
                        border: '1px solid #09090b',
                        padding: '0.35rem 0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      aria-label="Mes siguiente"
                    >
                      <span className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 700 }}>SIG</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Weekdays Row: L M X J V S D */}
                  <div className="calendar-weekdays-grid font-mono">
                    {dayNamesSpanish.map((d, i) => (
                      <div key={d} style={{ fontSize: '0.6875rem', fontWeight: 700, color: i === 6 ? '#ef4444' : '#71717a' }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days Matrix */}
                  <div className="calendar-days-grid">
                    {calendarDays.map((item) => {
                      if (item.type === 'empty') {
                        return <div key={item.key} style={{ minHeight: '38px' }}></div>;
                      }

                      const isSelected = selectedDate === item.iso;

                      return (
                        <button
                          type="button"
                          key={item.key}
                          disabled={item.isDisabled}
                          onClick={() => !item.isDisabled && setSelectedDate(item.iso)}
                          className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${item.isToday ? 'is-today' : ''} ${item.isFullyBooked ? 'is-full' : ''}`}
                          title={
                            item.isSunday
                              ? 'Domingo cerrado'
                              : item.isPast
                              ? 'Fecha pasada'
                              : item.isFullyBooked
                              ? `Día completo (${item.bookedCount}/${allTimeSlots.length} citas ocupadas)`
                              : `${item.iso} (${item.bookedCount}/${allTimeSlots.length} citas)`
                          }
                        >
                          <span style={{ textDecoration: item.isFullyBooked ? 'line-through' : 'none' }}>
                            {item.dayNumber}
                          </span>
                          {item.isFullyBooked ? (
                            <span style={{ fontSize: '0.45rem', color: '#ef4444', fontWeight: 800, lineHeight: 1 }}>
                              LLENO
                            </span>
                          ) : item.isToday && !isSelected ? (
                            <span style={{ fontSize: '0.5rem', color: '#09090b', lineHeight: 1 }}>
                              HOY
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Feedback */}
                {selectedDate && (
                  <div 
                    style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.5rem 0.75rem', 
                      backgroundColor: '#f4f4f5', 
                      borderLeft: '3px solid #09090b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    className="font-mono"
                  >
                    <CalendarIcon size={14} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b' }}>
                      FECHA SELECCIONADA: {selectedDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Time Slots Grid */}
              <div>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>2. TURNO DISPONIBLE:</span>
                  {selectedDate === todayIso && (
                    <span style={{ fontSize: '0.65rem', color: '#09090b', fontWeight: 600 }}>
                      HORA ACTUAL: {currentTimeStr}H
                    </span>
                  )}
                  {isLoadingSlots && <span style={{ color: '#09090b' }}>ACTUALIZANDO...</span>}
                </div>

                {visibleTimeSlots.length === 0 ? (
                  <div 
                    style={{ 
                      padding: '1.25rem 1rem', 
                      backgroundColor: '#fafafa', 
                      border: '1px dashed #09090b', 
                      textAlign: 'center'
                    }}
                    className="font-mono"
                  >
                    <Clock size={22} style={{ margin: '0 auto 0.4rem', color: '#09090b' }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#09090b', marginBottom: '0.25rem' }}>
                      NO QUEDAN MÁS TURNOS DISPONIBLES PARA HOY
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      Todos los turnos de hoy anteriores a las {currentTimeStr}h ya han finalizado. Por favor selecciona mañana u otra fecha en el calendario.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.4rem' }}>
                    {visibleTimeSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot.time);
                      const isSelected = selectedTime === slot.time;

                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot.time)}
                          style={{
                            border: isSelected ? '2px solid #09090b' : '1px solid #e4e4e7',
                            backgroundColor: isSelected ? '#09090b' : isBooked ? '#f4f4f5' : '#ffffff',
                            color: isSelected ? '#ffffff' : isBooked ? '#a1a1aa' : '#09090b',
                            padding: '0.65rem 0.35rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: isBooked ? 'not-allowed' : 'pointer',
                            textDecoration: isBooked ? 'line-through' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}
                        >
                          <span>{slot.time}</span>
                          <span style={{ fontSize: '0.5625rem', color: isSelected ? '#d4d4d8' : isBooked ? '#a1a1aa' : '#71717a' }}>
                            {isBooked ? 'OCUPADO' : slot.period}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-outline-brutal"
                  style={{ flex: 1, padding: '0.9rem' }}
                >
                  <ArrowLeft size={16} />
                  ATRÁS
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="btn-solid-black"
                  style={{ flex: 2, padding: '0.9rem' }}
                >
                  CONTINUAR
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT DETAILS & CONFIRM */}
          {step === 3 && (
            <form onSubmit={handleSubmitBooking}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 className="font-headline" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: '#09090b', letterSpacing: '-0.02em' }}>
                  DATOS DE CONTACTO
                </h3>
                <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem' }}>
                  Solo tu nombre y teléfono para confirmar tu turno.
                </p>
              </div>

              {/* Reservation summary: Responsive grid */}
              <div 
                style={{ 
                  border: '1px solid #09090b', 
                  backgroundColor: '#fafafa', 
                  padding: '0.85rem 1rem', 
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                  gap: '0.75rem'
                }}
                className="font-mono"
              >
                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a' }}>SERVICIO</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>
                    {selectedService?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{selectedService?.price}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a' }}>HORA Y FECHA</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>
                    {selectedDate} · {selectedTime}H
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Huelva · Av. Fco Molina 4</div>
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label 
                    htmlFor="client_name"
                    className="font-mono" 
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#09090b', marginBottom: '0.3rem' }}
                  >
                    NOMBRE COMPLETO *
                  </label>
                  <input
                    id="client_name"
                    type="text"
                    required
                    placeholder="Ej. Carlos Santos"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 0.9rem',
                      border: '1px solid #09090b',
                      fontSize: '1rem',
                      borderRadius: 0,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label 
                      htmlFor="client_phone"
                      className="font-mono" 
                      style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b' }}
                    >
                      TELÉFONO MÓVIL *
                    </label>
                    <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                      Línea móvil (6XX o 7XX)
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="client_phone"
                      type="tel"
                      required
                      placeholder="Ej: 612 84 92 15"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.2rem 0.8rem 0.9rem',
                        border: `1px solid ${
                          clientPhone.trim() 
                            ? (phoneCheck?.isValid ? '#16a34a' : '#dc2626') 
                            : '#09090b'
                        }`,
                        fontSize: '1rem',
                        borderRadius: 0,
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: clientPhone.trim() && phoneCheck?.isValid ? '#f0fdf4' : '#ffffff'
                      }}
                    />
                    {clientPhone.trim() && (
                      <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        {phoneCheck?.isValid ? (
                          <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                        ) : (
                          <AlertCircle size={18} style={{ color: '#dc2626' }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Real-time validation message */}
                  {clientPhone.trim() && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="font-mono">
                      {phoneCheck?.isValid ? (
                        <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          ✓ Móvil verificado ({phoneCheck.formatted})
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          ✕ {phoneCheck?.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor="client_notes"
                    className="font-mono" 
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#71717a', marginBottom: '0.3rem' }}
                  >
                    NOTAS O INDICACIONES (OPCIONAL)
                  </label>
                  <input
                    id="client_notes"
                    type="text"
                    placeholder="Ej. Degradado bajo con navaja"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 0.9rem',
                      border: '1px solid #e4e4e7',
                      fontSize: '0.875rem',
                      borderRadius: 0,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Checkbox Obligatorio RGPD */}
                <div style={{ marginTop: '0.25rem', padding: '0.85rem 1rem', backgroundColor: '#fafafa', border: '1px solid #e4e4e7' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }} className="font-mono">
                    <input
                      type="checkbox"
                      required
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      style={{ width: 17, height: 17, marginTop: '0.15rem', accentColor: '#09090b', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#27272a', lineHeight: 1.4 }}>
                      He leído y acepto la{' '}
                      <a 
                        href="/politica-privacidad" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: '#09090b', fontWeight: 700, textDecoration: 'underline' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Política de Privacidad
                      </a>{' '}
                      para la gestión y confirmación de mi cita de barbería. *
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="btn-outline-brutal"
                  style={{ flex: 1, padding: '0.9rem' }}
                >
                  <ArrowLeft size={16} />
                  ATRÁS
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !acceptPrivacy}
                  className="btn-solid-black"
                  style={{ 
                    flex: 2, 
                    padding: '0.9rem',
                    opacity: acceptPrivacy ? 1 : 0.6,
                    cursor: acceptPrivacy ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isSubmitting ? 'GUARDANDO CITA...' : 'CONFIRMAR RESERVA'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS BRUTALIST TICKET */}
          {step === 4 && confirmedBooking && (
            <div>
              <div 
                className="booking-ticket-box"
                style={{ 
                  border: '2px solid #09090b', 
                  backgroundColor: '#ffffff', 
                  padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #09090b', paddingBottom: '1rem', marginBottom: '1.25rem', gap: '0.5rem' }}>
                  <div>
                    <div className="font-headline" style={{ fontSize: 'clamp(1.35rem, 3vw, 1.65rem)', lineHeight: 1 }}>
                      TICKET DE CITA
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', marginTop: '0.2rem' }}>
                      JOAO PELUQUERO'S · HUELVA
                    </div>
                  </div>

                  <div className="tech-badge" style={{ backgroundColor: '#09090b', color: '#ffffff', flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                    <span>CONFIRMADA</span>
                  </div>
                </div>

                {/* Ticket Details Grid: Stackable on small devices */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }} className="font-mono">
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>CLIENTE</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#09090b' }}>
                      {confirmedBooking.client_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{confirmedBooking.client_phone}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>SERVICIO</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#09090b' }}>
                      {confirmedBooking.service_name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#09090b' }}>
                      {confirmedBooking.service_price}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>FECHA</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#09090b' }}>
                      {confirmedBooking.appointment_date}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>HORA</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#09090b' }}>
                      {confirmedBooking.appointment_time}H
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '0.75rem', marginBottom: '1.25rem' }} className="font-mono">
                  <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>UBICACIÓN</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#09090b' }}>
                    Av. Alcalde Federico Molina Orta, 4, 21007, Huelva
                  </div>
                </div>

                {/* Barcode */}
                <div style={{ borderTop: '2px dashed #09090b', paddingTop: '1rem', textAlign: 'center' }}>
                  <div style={{ height: '26px', display: 'flex', justifyContent: 'center', gap: '2px', alignItems: 'center' }}>
                    {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3].map((w, idx) => (
                      <span key={idx} style={{ display: 'inline-block', width: `${w}px`, height: '100%', backgroundColor: '#09090b' }} />
                    ))}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.625rem', letterSpacing: '0.15em', marginTop: '0.3rem' }}>
                    ID: {confirmedBooking.id || 'JP-ONLINE'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #bbf7d0',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.65rem'
                  }}
                  className="font-mono"
                >
                  <CheckCircle2 size={20} style={{ flexShrink: 0, color: '#16a34a' }} />
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    <div style={{ color: '#166534', fontWeight: 800 }}>CITA CONFIRMADA AUTOMÁTICAMENTE</div>
                    <div style={{ color: '#15803d', fontSize: '0.6875rem' }}>
                      Aviso enviado directamente al peluquero. Te esperamos en el salón.
                    </div>
                  </div>
                </div>

                {/* Primary Button: Añadir a mi Calendario (Universal para Android e iPhone) */}
                <button
                  type="button"
                  onClick={() => handleAddToCalendar('auto')}
                  className="btn-solid-black"
                  style={{ width: '100%', padding: '0.95rem', fontSize: '0.875rem' }}
                >
                  <CalendarIcon size={16} />
                  AÑADIR A MI CALENDARIO (MÓVIL)
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleAddToCalendar('google')}
                    className="btn-outline-brutal"
                    style={{ flex: 1, minWidth: '150px', padding: '0.7rem', fontSize: '0.75rem' }}
                  >
                    GOOGLE CALENDAR
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-outline-brutal"
                    style={{ flex: 1, minWidth: '100px', padding: '0.7rem', fontSize: '0.75rem' }}
                  >
                    FINALIZAR / CERRAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
