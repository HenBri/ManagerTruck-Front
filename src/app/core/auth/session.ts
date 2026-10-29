import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { PendingChanges } from './pending-changes';

export interface User {
  userId: number;
  personId: number;
  email: string;
  firstName: string;
  lastName: string;
  maternalLastName: string | null;
  documentNumber: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  dateCreate?: string;
}

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly pending = inject(PendingChanges);
  private authorization = '';
  readonly user = signal<User | null>(null);
  // The local API does not expose user authorities. These are verified read
  // capabilities, never roles inferred from the public /roles catalogue.
  readonly readable = signal<string[]>([]);
  readonly isAdmin = computed(() => this.readable().includes('users'));
  readonly canWrite = computed(() => this.readable().includes('clients'));
  readonly canReadTrucks = computed(() => this.canRead('trucks'));
  readonly driverId = signal<number | null>(null);
  // Compatibility boundary for the existing, disconnected multi-company
  // assistant/platform prototypes. Truckv3 exposes no company API.
  readonly companyId = signal<number | null>(null).asReadonly();
  readonly superAdmin = signal(false).asReadonly();
  readonly companies = signal<{ companyId: number; name: string }[]>([]).asReadonly();
  openAdminCompany(_company: { companyId: number; name: string }): void {
    throw new Error('La API Truckv3 no admite espacios por empresa.');
  }
  readonly roles = computed(() => {
    if (this.isAdmin()) return ['ADMIN'];
    if (this.canWrite()) return ['SECRETARY'];
    return [
      ...(this.canReadTrucks() ? ['PARTNER'] : []),
      ...(this.driverId() !== null ? ['DRIVER'] : []),
    ];
  });

  canRead(endpoint: string): boolean {
    if (!this.user()) return false;
    if (endpoint === 'roles') return true;
    return this.readable().includes(endpoint);
  }

  login(email: string, password: string) {
    const bytes = new TextEncoder().encode(`${email}:${password}`);
    const authorization = `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`;
    const headers = new HttpHeaders({ Authorization: authorization });
    // La autenticación ya quedó validada por /users/me. Una falla al consultar
    // capacidades no debe impedir que el usuario entre a la aplicación.
    const probe = <T>(endpoint: string) =>
      this.http
        .get<T>(`/api/${endpoint}?page=0&size=1`, { headers })
        .pipe(catchError(() => of(null)));
    return this.http.get<User>('/api/users/me', { headers }).pipe(
      tap((user) => {
        this.authorization = authorization;
        this.user.set(user);
      }),
      switchMap((user) =>
        forkJoin({
          users: probe<object>('users'),
          clients: probe<object>('clients'),
          trucks: probe<object>('trucks'),
          journeys: probe<object>('journeys'),
          drivers: probe<{ drivers: { driverId: number }[] }>('drivers'),
        }).pipe(map((access) => ({ user, access }))),
      ),
      tap(({ user, access }) => {
        const readable: string[] = [];
        if (access.users) readable.push('users');
        if (access.clients)
          readable.push('clients', 'contracts', 'charges', 'containers', 'auxiliary-providers');
        if (access.trucks) readable.push('trucks', 'freights');
        if (access.journeys) readable.push('journeys', 'assignments', 'partners');
        if (access.drivers) readable.push('drivers');
        this.readable.set(readable);
        this.driverId.set(
          !access.clients && access.drivers?.drivers.some((d) => d.driverId === user.personId)
            ? user.personId
            : null,
        );
      }),
    );
  }

  header() {
    return this.authorization;
  }

  logout() {
    this.pending.clear();
    this.authorization = '';
    this.user.set(null);
    this.readable.set([]);
    this.driverId.set(null);
    void this.router.navigateByUrl('/login');
  }
}
