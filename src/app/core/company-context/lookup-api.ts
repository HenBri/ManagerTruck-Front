import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface LookupConfig {
  endpoint: string;
  collection: string;
  id: string;
  labels: string[];
  state?: string;
  requiredState?: string | boolean;
  excludedStates?: string[];
  validUntil?: string;
  supportsDetail?: boolean;
  kind?: { key: string; value: string };
  query?: string;
}
export type LookupRow = Record<string, unknown>;
export type LookupPage = { totalPages: number; totalElements: number } & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class LookupApi {
  resource(url: () => string | undefined) {
    return httpResource<LookupPage>(url);
  }
}
