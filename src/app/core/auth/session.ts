import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of, tap, throwError } from 'rxjs';
import { PendingChanges } from './pending-changes';

export interface User {
  userId: number;
  email: string;
  name: string;
  lastname: string;
  ci: string | null;
  phone: string | null;
  status: string;
}
export interface Membership {
  companyId: number;
  membershipStatus: string;
  roleNames: string[];
}

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly pending = inject(PendingChanges);
  private authorization = '';
  readonly user = signal<User | null>(null);
  readonly memberships = signal<Membership[]>([]);
  readonly superAdmin = signal(false);
  private readonly extraCompanies = signal<{ companyId: number; name: string }[]>([]);
  readonly companies = computed(() => {
    const result = this.memberships().map((m) => ({
      companyId: m.companyId,
      name: `Empresa #${m.companyId}`,
    }));
    for (const company of this.extraCompanies()) {
      const index = result.findIndex((item) => item.companyId === company.companyId);
      if (index < 0) result.push(company);
      else result[index] = company;
    }
    return result;
  });
  readonly companyId = signal<number | null>(null);
  readonly roles = computed(() =>
    this.superAdmin()
      ? ['SUPER_ADMIN']
      : (this.memberships().find((m) => m.companyId === this.companyId())?.roleNames ?? []),
  );
  readonly canWrite = computed(() => this.superAdmin() || this.roles().includes('SECRETARY'));
  readonly canReadTrucks = computed(() => this.canWrite() || this.roles().includes('PARTNER'));

  login(email: string, password: string) {
    const bytes = new TextEncoder().encode(`${email}:${password}`);
    const authorization = `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`;
    const headers = new HttpHeaders({ Authorization: authorization });
    return forkJoin({
      user: this.http.get<User>('/api/users/me', { headers }),
      membershipData: this.http.get<{ memberships: Membership[] }>('/api/users/me/memberships', {
        headers,
      }),
      platform: this.http
        .get<{ platformRoles: { userId: number; roleName: string }[] }>(
          '/api/platform/user-roles',
          { headers },
        )
        .pipe(
          catchError((error) =>
            error.status === 403 ? of({ platformRoles: [] }) : throwError(() => error),
          ),
        ),
    }).pipe(
      tap(({ user, membershipData, platform }) => {
        this.authorization = authorization;
        this.user.set(user);
        this.superAdmin.set(
          platform.platformRoles.some(
            (role) => role.userId === user.userId && role.roleName === 'SUPER_ADMIN',
          ),
        );
        this.memberships.set(
          membershipData.memberships.filter((m) => m.membershipStatus === 'ACTIVE'),
        );
        this.companyId.set(this.memberships()[0]?.companyId ?? null);
      }),
    );
  }

  header() {
    return this.authorization;
  }

  selectCompany(id: number) {
    if (id === this.companyId()) return;
    if (this.companies().some((m) => m.companyId === id) && this.pending.confirm())
      this.companyId.set(id);
  }
  openAdminCompany(company: { companyId: number; name: string }) {
    if (!this.superAdmin() || !this.pending.confirm()) return;
    this.extraCompanies.update((items) => [
      ...items.filter((item) => item.companyId !== company.companyId),
      company,
    ]);
    this.companyId.set(company.companyId);
  }
  nameCompany(company: { companyId: number; name: string }) {
    if (this.companyId() !== company.companyId) return;
    this.extraCompanies.update((items) => [
      ...items.filter((item) => item.companyId !== company.companyId),
      company,
    ]);
  }

  logout() {
    this.pending.clear();
    this.authorization = '';
    this.user.set(null);
    this.superAdmin.set(false);
    this.memberships.set([]);
    this.extraCompanies.set([]);
    this.companyId.set(null);
    void this.router.navigateByUrl('/login');
  }
}
