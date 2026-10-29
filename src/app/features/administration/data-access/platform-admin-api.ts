import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface PlatformCompany {
  companyId: number;
  name: string;
  nit: string | null;
  address?: string | null;
  phone?: string | null;
  status: string;
}

export interface PlatformUser {
  userId: number;
  email: string;
  name: string;
  lastname: string;
  status: string;
}

export interface PlatformRole {
  roleId: number;
  name: string;
  scope: string;
  description: string | null;
}

export interface PlatformGrant {
  userId: number;
  email: string;
  roleName: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformAdminApi {
  private readonly http = inject(HttpClient);

  companies(page: () => number) {
    return httpResource<{
      companies: PlatformCompany[];
      totalPages: number;
      totalElements: number;
    }>(() => `/api/companies?page=${page()}&size=10`);
  }

  users(page: () => number) {
    return httpResource<{ users: PlatformUser[]; totalPages: number; totalElements: number }>(
      () => `/api/users?page=${page()}&size=10`,
    );
  }

  roles() {
    return httpResource<{ roles: PlatformRole[] }>(() => '/api/roles');
  }

  grants() {
    return httpResource<{ platformRoles: PlatformGrant[] }>(() => '/api/platform/user-roles');
  }

  createCompany(data: { name: string; nit: string; address: string; phone: string }) {
    return this.http.post<PlatformCompany>('/api/companies', data);
  }

  updateCompany(
    companyId: number,
    data: { name: string; nit: string; address: string; phone: string },
  ) {
    return this.http.put<PlatformCompany>(`/api/companies/${companyId}`, data);
  }

  companyStatus(companyId: number, status: string) {
    return this.http.put<PlatformCompany>(`/api/companies/${companyId}/status`, { status });
  }

  createUser(data: {
    email: string;
    password: string;
    name: string;
    lastname: string;
    ci: string;
    phone: string;
  }) {
    return this.http.post<PlatformUser>('/api/users/admin', data);
  }

  userStatus(userId: number, status: string) {
    return this.http.put<PlatformUser>(`/api/users/${userId}/status`, { status });
  }

  createRole(data: { name: string; scope: string; description: string }) {
    return this.http.post<PlatformRole>('/api/roles', data);
  }

  updateRole(roleId: number, data: { name: string; description: string }) {
    return this.http.put<PlatformRole>(`/api/roles/${roleId}`, data);
  }
}
