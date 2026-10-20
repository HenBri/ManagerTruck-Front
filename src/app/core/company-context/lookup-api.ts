import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface LookupConfig {
  endpoint: string;
  collection: string;
  id: string;
  labels: string[];
  state?: string;
  requiredState?: string | boolean;
  supportsDetail?: boolean;
  kind?: { key: string; value: string };
}
export type LookupRow = Record<string, unknown>;
export type LookupPage = { totalPages: number; totalElements: number } & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class LookupApi {
  private readonly http = inject(HttpClient);
  resource(url: () => string | undefined) {
    return httpResource<LookupPage>(url);
  }
  companyResource(id: () => number | null) {
    return httpResource<{ companyId: number; name: string }>(() =>
      id() ? `/api/companies/${id()}` : undefined,
    );
  }
  company(id: number) {
    return this.http.get<{ companyId: number; name: string; status: string }>(
      `/api/companies/${id}`,
    );
  }
}
