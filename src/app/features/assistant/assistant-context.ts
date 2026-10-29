import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Session } from '../../core/auth/session';

@Injectable({ providedIn: 'root' })
export class AssistantContext {
  readonly error = signal<{ status: number; companyId: number; at: number } | null>(null);
}

// Only status and company: never retain request bodies, credentials or server traces.
export const assistantContextInterceptor: HttpInterceptorFn = (request, next) => {
  const context = inject(AssistantContext);
  const companyId = inject(Session).companyId();
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        companyId &&
        request.url.startsWith(`/api/companies/${companyId}/`) &&
        !request.url.includes('/assistant/') &&
        [400, 403, 404, 409, 500].includes(error.status)
      )
        context.error.set({ status: error.status, companyId, at: Date.now() });
      return throwError(() => error);
    }),
  );
};
