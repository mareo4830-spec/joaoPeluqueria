/**
 * Validador profesional de números de teléfono móvil para Joao Peluquero's
 * Filtra números ficticios, secuencias falsas y valida rangos oficiales de telefonía móvil (España e Internacional).
 */

export function validateSpanishMobile(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      message: 'Por favor, introduce tu número de teléfono móvil.'
    };
  }

  // 1. Limpiar espacios, guiones, paréntesis y puntos
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  // 2. Normalizar prefijo de España (+34 o 0034)
  if (cleaned.startsWith('+34')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0034')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('+')) {
    // Es un número internacional
    if (cleaned.length < 9 || cleaned.length > 16) {
      return {
        isValid: false,
        message: 'El número internacional debe tener entre 9 y 15 dígitos válidos.'
      };
    }
    // Comprobar que no sean dígitos repetidos
    const digitsOnly = cleaned.replace('+', '');
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return {
        isValid: false,
        message: 'Por favor, introduce un número de teléfono real.'
      };
    }
    return {
      isValid: true,
      formatted: cleaned,
      isInternational: true
    };
  }

  // 3. Validación de formato de móvil en España
  // Debe tener exactamente 9 dígitos numéricos
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'El teléfono solo debe contener números.'
    };
  }

  if (cleaned.length < 9) {
    return {
      isValid: false,
      message: `Faltan dígitos (${cleaned.length}/9). Los móviles en España tienen 9 dígitos.`
    };
  }

  if (cleaned.length > 9) {
    return {
      isValid: false,
      message: `Demasiados dígitos (${cleaned.length}/9). Si es internacional incluye el prefijo (+...).`
    };
  }

  // 4. Debe ser una línea móvil (empieza por 6 o 7 según el Plan Nacional de Numeración)
  const firstDigit = cleaned[0];
  if (firstDigit !== '6' && firstDigit !== '7') {
    if (firstDigit === '8' || firstDigit === '9') {
      return {
        isValid: false,
        message: 'Has introducido un teléfono fijo. Por favor, introduce un móvil (6XX o 7XX) para poder contactarte.'
      };
    }
    return {
      isValid: false,
      message: 'Los teléfonos móviles en España deben comenzar por 6 o 7.'
    };
  }

  // 5. Filtro de números falsos o inventados obvios

  // Todos los dígitos iguales (ej: 666666666, 611111111, 777777777, 600000000)
  if (/^(\d)\1{8}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'El número introducido no parece real (dígitos repetidos).'
    };
  }

  // Los últimos 6 dígitos idénticos (ej: 612111111, 650000000)
  if (/(\d)\1{5}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Introduce un número de teléfono móvil real y activo.'
    };
  }

  // Secuencias ascendentes o descendentes obvias (ej: 612345678, 698765432, 654321098)
  const ascending = '0123456789012345';
  const descending = '9876543210987654';
  if (ascending.includes(cleaned) || descending.includes(cleaned)) {
    return {
      isValid: false,
      message: 'El número no es válido (secuencia numérica inventada).'
    };
  }

  // Patrones repetitivos dobles o triples (ej: 612612612, 600600600, 696969696)
  const chunk3_1 = cleaned.substring(0, 3);
  const chunk3_2 = cleaned.substring(3, 6);
  const chunk3_3 = cleaned.substring(6, 9);
  if (chunk3_1 === chunk3_2 && chunk3_2 === chunk3_3) {
    return {
      isValid: false,
      message: 'Por favor, introduce un teléfono móvil real y verificable.'
    };
  }

  // Lista negra de números ficticios habituales de broma / tests
  const blacklisted = [
    '600000000', '611111111', '622222222', '633333333', '644444444', 
    '655555555', '666666666', '677777777', '688888888', '699999999',
    '612345678', '698765432', '601234567', '654321098', '611223344',
    '600123456', '600654321', '699887766', '700000000', '712345678'
  ];

  if (blacklisted.includes(cleaned)) {
    return {
      isValid: false,
      message: 'Número no admitido. Se requiere un móvil real para confirmar tu cita.'
    };
  }

  // Formato bonito de salida (ej: 612 34 56 78)
  const formatted = `${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;

  return {
    isValid: true,
    cleanNumber: cleaned,
    formatted: formatted,
    international: `+34 ${formatted}`,
    message: null
  };
}
