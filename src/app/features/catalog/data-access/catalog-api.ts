import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
export type RecordData = Record<string, string | number | boolean | null>;
export type CatalogPage = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
} & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  list(url: () => string | undefined) {
    return httpResource<CatalogPage>(url);
  }
  detail(url: string) {
    return this.http.get<RecordData>(url);
  }
  create(url: string, data: RecordData) {
    return this.http.post<RecordData>(url, data);
  }
  update(url: string, data: RecordData) {
    return this.http.put<RecordData>(url, data);
  }
}
