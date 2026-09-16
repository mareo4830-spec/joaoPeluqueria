import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, ShoppingBag, Phone, User, MessageSquare, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createProductReservation } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';
import { validateSpanishMobile } from '../lib/phoneValidator';

export default function ProductReservationModal({ isOpen, onClose, product }) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  const phoneCheck = useMemo(() => {
    return clientPhone.trim() ? validateSpanishMobile(clientPhone) : null;
  }, [clientPhone]);

  useEffect(() => {
    if (!isOpen || !product) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMsg('Por favor introduce tu nombre completo.');
      return;
    }

    const phoneValidation = validateSpanishMobile(clientPhone);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.message || 'Por favor introduce un número de teléfono móvil real y activo.');
      return;
    }

    if (!acceptPrivacy) {
      setErrorMsg('Debes aceptar la Política de Privacidad para reservar el producto.');
      return;
    }

    setIsSubmitting(true);

    try {
      const priceText = product.price_label || `${(product.price_eur || 0).toFixed(2).replace('.', ',')} €`;
      const payload = {
        product_id: product.id,
        product_name: product.name,
        product_price: priceText,
        client_name: clientName.trim(),
        client_phone: phoneValidation.international || phoneValidation.formatted || clientPhone.trim(),
        notes: clientNotes.trim()
      };

      // 1. Guardar en Base de Datos Supabase / Local
      const res = await createProductReservation(payload);
      const resData = res?.data || { id: 'RES-' + Math.floor(100000 + Math.random() * 900000), ...payload };

      // 2. Enviar notificación profesional en segundo plano
      await sendNotification({
        type: 'product_reservation',
        title: 'NUEVA RESERVA DE PRODUCTO',
        customerName: clientName.trim(),
        customerPhone: clientPhone.trim(),
        details: product.name,
        amount: priceText
      });

      // 3. Efecto de confeti y pase digital premium
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      setConfirmedReservation(resData);
    } catch (err) {
      console.error('[Error al reservar producto]:', err);
      setErrorMsg('Hubo un problema al registrar la reserva. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedReservation(null);
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div 
          style={{ 
            backgroundColor: '#09090b', 
            color: '#ffffff', 
            padding: '1.15rem 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={18} />
            <div>
              <div className="font-headline" style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                RESERVA OFICIAL DE PRODUCTO
              </div>
              <div className="font-mono" style={{ fontSize: '0.65rem', color: '#a1a1aa', marginTop: '0.15rem' }}>
                RECOGIDA EN LOCAL · JOAO PELUQUERO'S HUELVA
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Cerrar modal"
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success / Digital Pass Screen */}
        {confirmedReservation ? (
          <div style={{ padding: '2rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 50, height: 50, backgroundColor: '#09090b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                <Check size={26} strokeWidth={3} />
              </div>

              <h3 className="font-headline" style={{ fontSize: '1.75rem', color: '#09090b', marginBottom: '0.25rem' }}>
                RESERVA CONFIRMADA
              </h3>
              <p className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                Registrada en el sistema. El producto queda reservado a tu nombre.
              </p>
            </div>

            {/* Brutalist Digital Ticket Pass */}
            <div 
              style={{ 
                border: '2px solid #09090b', 
                backgroundColor: '#fafafa', 
                padding: '1.25rem', 
                marginBottom: '1.5rem',
                position: 'relative'
              }}
              className="font-mono"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #09090b', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>CÓDIGO DE RESERVA:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#09090b' }}>#{confirmedReservation.id}</span>
              </div>

              <div style={{ marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.625rem', color: '#71717a' }}>ARTÍCULO:</div>
                <div className="font-headline" style={{ fontSize: '1.15rem', color: '#09090b' }}>
                  {confirmedReservation.product_name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a' }}>CLIENTE:</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#09090b' }}>
                    {confirmedReservation.client_name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a' }}>A PAGAR EN LOCAL:</div>
                  <div className="font-headline" style={{ fontSize: '1.25rem', color: '#09090b', fontWeight: 800 }}>
                    {confirmedReservation.product_price}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #09090b', paddingTop: '0.75rem', fontSize: '0.6875rem', color: '#52525b', lineHeight: 1.4 }}>
                📍 <strong>Punto de recogida:</strong> Av. Alcalde Federico Molina Orta, 4, 21007 Huelva<br />
                ⏰ <strong>Horario:</strong> L-V: 09:30 - 13:30 / 16:30 - 20:30 | Sáb: 09:30 - 14:00
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                  <div style={{ color: '#166534', fontWeight: 800 }}>RESERVA REGISTRADA AUTOMÁTICAMENTE</div>
                  <div style={{ color: '#15803d', fontSize: '0.6875rem' }}>
                    Aviso enviado directamente al local. Pasa a recogerlo en el horario comercial.
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="btn-solid-black"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                ENTENDIDO / FINALIZAR
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            {/* Product Summary Banner */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'center', 
                padding: '0.85rem', 
                backgroundColor: '#fafafa', 
                border: '1px solid #e4e4e7',
                marginBottom: '1.5rem'
              }}
            >
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid #09090b', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-mono" style={{ fontSize: '0.625rem', color: '#71717a', textTransform: 'uppercase' }}>
                  {product.category === 'perfumes' ? 'PERFUMERÍA' : 'PRODUCTO DE PELUQUERÍA'}
                </div>
                <div className="font-headline" style={{ fontSize: '1.1rem', color: '#09090b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div className="font-headline" style={{ fontSize: '1.25rem', color: '#09090b', fontWeight: 800 }}>
                  {product.price_label || `${(product.price_eur || 0).toFixed(2).replace('.', ',')} €`}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div 
                style={{ 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #ef4444', 
                  color: '#991b1b', 
                  padding: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                className="font-mono"
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="font-mono" style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#09090b', marginBottom: '0.35rem' }}>
                TU NOMBRE COMPLETO *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mario Gómez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 2.25rem',
                    border: '1px solid #09090b',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    borderRadius: 0,
                    outline: 'none'
                  }}
                />
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#09090b' }}>
                  TELÉFONO MÓVIL DE CONTACTO *
                </label>
                <span className="font-mono" style={{ fontSize: '0.625rem', color: '#71717a' }}>
                  Móvil real (6XX / 7XX)
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 612 34 56 78"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.25rem 0.75rem 2.25rem',
                    border: `1px solid ${
                      clientPhone.trim() 
                        ? (phoneCheck?.isValid ? '#16a34a' : '#dc2626') 
                        : '#09090b'
                    }`,
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    borderRadius: 0,
                    outline: 'none',
                    backgroundColor: clientPhone.trim() && phoneCheck?.isValid ? '#f0fdf4' : '#ffffff'
                  }}
                />
                <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                {clientPhone.trim() && (
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    {phoneCheck?.isValid ? (
                      <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#dc2626' }} />
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="font-mono" style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#09090b', marginBottom: '0.35rem' }}>
                NOTAS O INDICACIONES (OPCIONAL)
              </label>
              <textarea
                placeholder="Ej: Pasaré a recogerlo mañana por la tarde."
                rows={2}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #09090b',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  borderRadius: 0,
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Checkbox Obligatorio RGPD */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fafafa', border: '1px solid #e4e4e7' }}>
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
                  para tramitar la reserva de este producto. *
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline-brutal"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                CANCELAR
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !acceptPrivacy}
                className="btn-solid-black"
                style={{ 
                  flex: 2, 
                  padding: '0.85rem',
                  opacity: acceptPrivacy ? 1 : 0.6,
                  cursor: acceptPrivacy ? 'pointer' : 'not-allowed'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'REGISTRANDO...' : 'CONFIRMAR RESERVA'}</span>
              </button>
            </div>

            <p className="font-mono" style={{ fontSize: '0.65rem', color: '#71717a', textAlign: 'center', marginTop: '1rem', textWrap: 'balance' }}>
              * La reserva se confirma de inmediato sin pagos por adelantado. Abonarás el importe al recoger tu pedido en tienda.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
