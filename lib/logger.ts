/**
 * Utilidad de logging condicional
 * Solo muestra logs en desarrollo, no en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Logs normales (solo en desarrollo)
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Warns (solo en desarrollo)
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // Info (solo en desarrollo)
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // Debug (solo en desarrollo)
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Errors (SIEMPRE se muestran, pero sanitizados)
  error: (message: string, ...args: any[]) => {
    // En producción, solo mostrar mensajes genéricos sin detalles internos
    if (isDevelopment) {
      console.error(message, ...args);
    } else {
      // En producción, log solo el mensaje principal sin datos sensibles
      console.error(message);
    }
  },
};
