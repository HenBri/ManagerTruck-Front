import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Session } from './session';

export const authGuard: CanActivateFn = () =>
  inject(Session).user() ? true : inject(Router).createUrlTree(['/login']);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(Session);
  const isApi = request.url.startsWith('/api/');
  const credential = session.header();
  const outgoing =
    isApi && credential && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: credential } })
      : request;
  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApi && error.status === 401 && credential && session.header() === credential)
        session.logout();
      return throwError(() => error);
    }),
  );
};
