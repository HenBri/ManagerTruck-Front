import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse))
    return 'No se pudo completar la operación. Inténtalo nuevamente.';
  if (error.status === 0)
    return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
  if (error.status === 401)
    return 'Credenciales incorrectas o sesión finalizada. Vuelve a iniciar sesión.';
  if (error.status === 403) return 'No tienes permiso para realizar esta operación.';
  if (error.status === 404) return 'El registro solicitado no está disponible.';
  if (error.status >= 500) return 'El servidor no pudo completar la operación. Inténtalo más tarde';
  return typeof error.error?.message === 'string'
    ? error.error.message
    : 'Revisa los datos e inténtalo nuevamente.';
}
