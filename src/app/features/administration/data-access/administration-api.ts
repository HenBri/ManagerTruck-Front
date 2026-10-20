import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
export interface Company {
  companyId: number;
  name: string;
  nit: string | null;
  status: string;
}
export interface Member {
  companyId: number;
  userId: number;
  name: string;
  lastname: string;
  email: string;
  membershipStatus: string;
  roleNames: string[];
}
export interface PageResult {
  totalPages: number;
  totalElements: number;
}
@Injectable({ providedIn: 'root' })
export class AdministrationApi {
  private readonly http = inject(HttpClient);
  companies(allowed: () => boolean, page: () => number) {
    return httpResource<PageResult & { companies: Company[] }>(() =>
      allowed() ? `/api/companies?page=${page()}&size=10` : undefined,
    );
  }
  members(company: () => number | null, allowed: () => boolean, page: () => number) {
    return httpResource<PageResult & { memberships: Member[] }>(() =>
      company() && allowed()
        ? `/api/companies/${company()}/memberships?page=${page()}&size=10`
        : undefined,
    );
  }
  add(company: number, userEmail: string) {
    return this.http.post<Member>(`/api/companies/${company}/memberships`, { userEmail });
  }
  status(company: number, user: number, status: string) {
    return this.http.put<Member>(`/api/companies/${company}/memberships/${user}/status`, {
      status,
    });
  }
  roles(company: number, user: number, roleNames: string[]) {
    return this.http.post<{ roleNames: string[] }>(
      `/api/companies/${company}/memberships/${user}/roles`,
      { roleNames },
    );
  }
}
