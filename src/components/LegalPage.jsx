import React, { useEffect } from 'react';
import { ArrowLeft, Shield, FileText, Lock, Cookie, Scale, ExternalLink } from 'lucide-react';

export default function LegalPage({ currentSlug = 'aviso-legal', onNavigateLegal, onNavigateHome }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentSlug]);

  const tabs = [
    { slug: 'aviso-legal', label: 'AVISO LEGAL', icon: Scale },
    { slug: 'politica-privacidad', label: 'POLÍTICA DE PRIVACIDAD', icon: Lock },
    { slug: 'politica-cookies', label: 'POLÍTICA DE COOKIES', icon: Cookie },
    { slug: 'terminos-condiciones', label: 'TÉRMINOS Y CONDICIONES', icon: FileText }
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#09090b', paddingBottom: '5rem' }}>
      {/* Top Editorial Bar */}
      <header style={{ borderBottom: '1px solid #09090b', backgroundColor: '#fafafa' }}>
        <div className="editorial-container" style={{ padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            onClick={onNavigateHome}
            className="btn-outline-brutal"
            style={{ padding: '0.55rem 1rem', fontSize: '0.75rem', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} />
            <span>VOLVER A LA WEB</span>
          </button>

          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
            INFRAESTRUCTURA LEGAL · ESPAÑA (RGPD & LSSI-CE)
          </div>
        </div>
      </header>

      {/* Legal Navigation Tabs */}
      <div style={{ borderBottom: '1px solid #e4e4e7', backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 30 }}>
        <div className="editorial-container" style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', padding: '0.5rem 0' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => onNavigateLegal(tab.slug)}
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#52525b',
                  backgroundColor: isActive ? '#09090b' : 'transparent',
                  border: isActive ? '1px solid #09090b' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Legal Content Container */}
      <main className="editorial-container" style={{ maxWidth: '880px', marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
        {/* Document Metadata */}
        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          DOCUMENTO OFICIAL · ÚLTIMA REVISIÓN: 16 DE SEPTIEMBRE DE 2026
        </div>

        {/* 1. AVISO LEGAL */}
        {currentSlug === 'aviso-legal' && (
          <article className="legal-article">
            <h1 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem' }}>
              AVISO LEGAL Y DATOS IDENTIFICATIVOS
            </h1>

            <div className="legal-callout">
              <strong>Nota legal de conformidad con la Ley 34/2002 (LSSI-CE):</strong> Este sitio web y el servicio de cita previa y catálogo son gestionados conforme a la legislación española. Los datos empresariales específicos se detallan a continuación.
            </div>

            <h2>1. Datos Identificativos del Responsable</h2>
            <p>
              En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos informativos:
            </p>
            <ul>
              <li><strong>Titular de la actividad / Razón Social:</strong> <span className="legal-tag">[NOMBRE_EMPRESA: Joao Peluquero's / João Manuel Da Silva]</span></li>
              <li><strong>NIF / CIF:</strong> <span className="legal-tag">[NIF/CIF: B-12345678]</span></li>
              <li><strong>Domicilio Profesional / Fiscal:</strong> <span className="legal-tag">[DIRECCIÓN: Av. Alcalde Federico Molina Orta, 4, 21007, Huelva, España]</span></li>
              <li><strong>Correo electrónico de contacto:</strong> <span className="legal-tag">[EMAIL: contacto@joaopeluqueros.com]</span></li>
              <li><strong>Teléfono de atención al cliente:</strong> <span className="legal-tag">[TELÉFONO: +34 600 00 00 00]</span></li>
              <li><strong>Actividad principal:</strong> Servicios de peluquería de caballeros, barbería técnica y comercialización de productos cosméticos y perfumería.</li>
            </ul>

            <h2>2. Objeto y Ámbito de Aplicación</h2>
            <p>
              El presente Aviso Legal regula el acceso, navegación y uso del sitio web accesible mediante la URL principal, así como las responsabilidades derivadas del uso de sus contenidos (textos, gráficos, fotografías, software y bases de datos).
            </p>
            <p>
              El acceso a este portal atribuye la condición de <strong>USUARIO</strong>, quien acepta plenamente y sin reservas todas las disposiciones incluidas en esta página desde el momento de su acceso.
            </p>

            <h2>3. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos del sitio web, incluyendo de forma enunciativa pero no limitativa, el diseño brutalista, logotipos, marcas comerciales ("Joao Peluquero’s", "Joao Lab"), fotografías de trabajos de corte, textos editoriales y código fuente, están protegidos por las leyes de propiedad intelectual e industrial españolas y comunitarias.
            </p>
            <p>
              Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de cualquier contenido sin la autorización previa y por escrito del titular legítimo.
            </p>

            <h2>4. Exclusión de Responsabilidad</h2>
            <p>
              El titular no se hace responsable de los daños o perjuicios que pudieran derivarse de interferencias, interrupciones técnicas, virus informáticos o desconexiones en el funcionamiento de la red ajenos a su control razonable.
            </p>

            <h2>5. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Para la resolución de cualquier controversia o cuestión litigiosa relativa a este sitio web, regirá la legislación española, siendo competentes los Juzgados y Tribunales de la ciudad de <strong>Huelva</strong>.
            </p>
          </article>
        )}

        {/* 2. POLÍTICA DE PRIVACIDAD */}
        {currentSlug === 'politica-privacidad' && (
          <article className="legal-article">
            <h1 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem' }}>
              POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS
            </h1>

            <div className="legal-callout">
              <strong>Cumplimiento RGPD (UE 2016/679) y LOPD-GDD (Ley Orgánica 3/2018):</strong> En Joao Peluquero’s tratamos tus datos personales con absoluta transparencia, confidencialidad y bajo el principio estricto de minimización.
            </div>

            <h2>1. Responsable del Tratamiento</h2>
            <ul>
              <li><strong>Identidad:</strong> <span className="legal-tag">[NOMBRE_EMPRESA: Joao Peluquero's]</span></li>
              <li><strong>NIF:</strong> <span className="legal-tag">[NIF/CIF: B-12345678]</span></li>
              <li><strong>Dirección:</strong> <span className="legal-tag">[DIRECCIÓN: Av. Alcalde Federico Molina Orta, 4, 21007, Huelva]</span></li>
              <li><strong>Contacto Privacidad:</strong> <span className="legal-tag">[EMAIL: privacidad@joaopeluqueros.com]</span></li>
            </ul>

            <h2>2. Finalidades del Tratamiento de Datos</h2>
            <p>
              Recopilamos únicamente los datos mínimos indispensables para:
            </p>
            <ol>
              <li><strong>Gestión de Citas y Reservas de Barbería:</strong> Registro del turno, confirmación por SMS o mensajería, bloqueo horario en agenda y recordatorios del servicio capilar solicitado.</li>
              <li><strong>Reserva de Productos y Perfumes:</strong> Apartado temporal de stock en el establecimiento de Huelva y aviso de disponibilidad para recogida presencial.</li>
              <li><strong>Atención al Cliente y Verificación:</strong> Validación de números reales de contacto para prevenir reservas fraudulentas y garantizar la comunicación directa con el barbero.</li>
            </ol>

            <h2>3. Legitimación para el Tratamiento</h2>
            <p>
              La base legal que legitima el tratamiento de tus datos es:
            </p>
            <ul>
              <li><strong>Ejecución de un contrato o precontrato (Art. 6.1.b RGPD):</strong> Necesario para gestionar tu cita de peluquería o el pedido de un producto.</li>
              <li><strong>Consentimiento expreso del interesado (Art. 6.1.a RGPD):</strong> Otorgado al marcar de forma afirmativa e inequívoca la casilla obligatoria <em>"He leído y acepto la Política de Privacidad"</em> en nuestros formularios.</li>
            </ul>

            <h2>4. Plazo de Conservación de los Datos</h2>
            <p>
              Los datos de citas se conservarán mientras se mantenga la relación comercial y durante los plazos legales establecidos para el cumplimiento de obligaciones fiscales y contables (máximo 5 años). Los datos de reservas de productos se conservan únicamente hasta su recogida o cancelación.
            </p>

            <h2>5. Destinatarios de los Datos</h2>
            <p>
              Tus datos <strong>NO se cederán a terceros con fines comerciales ni publicitarios</strong>. Únicamente tendrán acceso los proveedores técnicos indispensables para la prestación del servicio (como la plataforma de base de datos cifrada Supabase y servicios de alojamiento en servidores europeos bajo acuerdos de protección de datos DPA).
            </p>

            <h2>6. Derechos del Usuario (Derechos ARCO / RGPD)</h2>
            <p>
              Tienes derecho a ejercitar en cualquier momento y de forma gratuita los siguientes derechos:
            </p>
            <ul>
              <li><strong>Acceso:</strong> Conocer qué datos tuyos estamos tratando.</li>
              <li><strong>Rectificación:</strong> Modificar datos inexactos o incompletos.</li>
              <li><strong>Supresión ("Derecho al olvido"):</strong> Solicitar el borrado de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Oposición y Limitación:</strong> Oponerte al tratamiento o solicitar que se limite a fines específicos.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y legible.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, envía un correo a <span className="legal-tag">[EMAIL: privacidad@joaopeluqueros.com]</span> acompañando copia de tu documento de identidad. Asimismo, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: '#09090b', fontWeight: 600 }}>www.aepd.es</a>) si consideras que tus derechos no han sido debidamente atendidos.
            </p>
          </article>
        )}

        {/* 3. POLÍTICA DE COOKIES */}
        {currentSlug === 'politica-cookies' && (
          <article className="legal-article">
            <h1 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem' }}>
              POLÍTICA DE COOKIES
            </h1>

            <div className="legal-callout">
              <strong>Transparencia en el uso de cookies:</strong> Conforme al artículo 22.2 de la LSSI-CE y a la Guía sobre el uso de cookies de la AEPD, te informamos de forma clara y detallada sobre las cookies que utiliza esta web.
            </div>

            <h2>1. ¿Qué es una Cookie?</h2>
            <p>
              Una cookie es un pequeño archivo de texto que un sitio web descarga en tu ordenador, smartphone o tableta al acceder a determinadas páginas. Permite almacenar y recuperar información técnica y de navegación para facilitar el funcionamiento de la web.
            </p>

            <h2>2. Clasificación de Cookies que Utilizamos</h2>
            <div style={{ border: '1px solid #09090b', marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '0.75rem 1rem', backgroundColor: '#fafafa', borderBottom: '1px solid #09090b', fontWeight: 700 }} className="font-mono">
                <div>TIPO</div>
                <div>FINALIDAD</div>
                <div>PLAZO</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '0.85rem 1rem', borderBottom: '1px solid #e4e4e7', fontSize: '0.8125rem' }}>
                <div><strong>Técnicas (Esenciales)</strong></div>
                <div>Gestión del turno de reserva, almacenamiento de preferencias de consentimiento y seguridad de sesión.</div>
                <div>Sesión / 1 año</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '0.85rem 1rem', borderBottom: '1px solid #e4e4e7', fontSize: '0.8125rem' }}>
                <div><strong>Analíticas (Opcionales)</strong></div>
                <div>Métricas de visitas y servicios más consultados sin recopilar nombres ni direcciones IP privadas.</div>
                <div>Hasta 2 años</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                <div><strong>Preferencias</strong></div>
                <div>Recuerda tus elecciones de estilo o navegación en el catálogo de productos.</div>
                <div>6 meses</div>
              </div>
            </div>

            <h2>3. Cómo Modificar tu Consentimiento o Desactivar Cookies</h2>
            <p>
              Puedes revocar tu consentimiento en cualquier momento utilizando nuestro panel de configuración flotante de cookies o configurando las preferencias de tu navegador:
            </p>
            <ul>
              <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
              <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y Seguridad &gt; Cookies y datos del sitio.</li>
              <li><strong>Safari (Apple):</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
              <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos del sitio.</li>
            </ul>
          </article>
        )}

        {/* 4. TÉRMINOS Y CONDICIONES */}
        {currentSlug === 'terminos-condiciones' && (
          <article className="legal-article">
            <h1 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem' }}>
              TÉRMINOS Y CONDICIONES DE RESERVA Y COMPRA
            </h1>

            <div className="legal-callout">
              <strong>Condiciones Generales de Contratación:</strong> Las presentes estipulaciones rigen el sistema de cita previa y reserva de artículos en el salón oficial de João Peluquero's en Huelva.
            </div>

            <h2>1. Proceso de Cita Previa de Barbería</h2>
            <p>
              La solicitud de cita a través de este portal constituye una reserva de turno en tiempo real. El cliente debe facilitar datos fidedignos y un número de teléfono móvil operativo.
            </p>
            <ul>
              <li><strong>Puntualidad:</strong> Se ruega acudir al salón con 5 minutos de antelación respecto a la hora fijada. Con el fin de no perjudicar a los siguientes turnos, retrasos superiores a 10 minutos podrán implicar la pérdida de la cita o la adaptación del servicio.</li>
              <li><strong>Cancelación y Modificación:</strong> El cliente puede cancelar o aplazar su cita de forma completamente gratuita avisando con un mínimo de <strong>2 horas de antelación</strong> mediante teléfono o mensajería directa.</li>
            </ul>

            <h2>2. Reserva de Perfumes y Productos de Peluquería</h2>
            <p>
              A través de la sección de productos, el usuario puede apartar unidades de stock para su posterior adquisición física en el establecimiento:
            </p>
            <ul>
              <li><strong>Plazo de Recogida:</strong> Las reservas de productos se mantendrán activas durante un periodo máximo de <strong>48 horas laborables</strong> desde la fecha de confirmación. Transcurrido dicho plazo sin que el cliente haya acudido al salón ni notificado aplazamiento, el artículo volverá a estar disponible para el público general.</li>
              <li><strong>Pago:</strong> El abono de los productos se realiza presencialmente en el local mediante tarjeta, efectivo o Bizum en el momento de la entrega.</li>
            </ul>

            <h2>3. Tarifas y Precios</h2>
            <p>
              Todos los importes mostrados en la carta de servicios y en el catálogo de productos están expresados en Euros (€) e incluyen el correspondiente Impuesto sobre el Valor Añadido (IVA) legalmente aplicable en España.
            </p>

            <h2>4. Hojas de Quejas y Reclamaciones</h2>
            <p>
              En cumplimiento del Decreto 72/2008 de la Junta de Andalucía, existen a disposición de los consumidores y usuarios <strong>Hojas Oficiales de Quejas y Reclamaciones</strong> en el establecimiento físico situado en: <span className="legal-tag">[DIRECCIÓN: Av. Alcalde Federico Molina Orta, 4, 21007, Huelva]</span>.
            </p>
          </article>
        )}

        {/* Bottom Navigation */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #09090b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            onClick={onNavigateHome}
            className="btn-solid-black"
            style={{ padding: '0.75rem 1.35rem', fontSize: '0.8125rem' }}
          >
            <ArrowLeft size={16} />
            <span>REGRESAR AL SALÓN</span>
          </button>

          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
            JOAO PELUQUERO'S · HUELVA
          </div>
        </div>
      </main>
    </div>
  );
}
