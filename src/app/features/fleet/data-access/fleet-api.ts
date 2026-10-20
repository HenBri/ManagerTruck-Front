import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

export interface Truck {
  truckId: number;
  companyId: number;
  ownerPartnerId: number;
  truckBoard: string;
  truckBrand: string | null;
  truckModel: string | null;
  truckChassis: string | null;
  truckColor: string | null;
  truckYear: number | null;
  truckCapacity: number | null;
  truckState: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  truckCreateDate: string;
}
export interface TruckWrite {
  truckBoard: string;
  truckBrand: string | null;
  truckModel: string | null;
  truckChassis: string | null;
  truckColor: string | null;
  truckYear: number | null;
  truckCapacity: number | null;
}
export interface TruckPage {
  trucks: Truck[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class FleetApi {
  private readonly http = inject(HttpClient);
  list(company: Signal<number | null>, page: Signal<number>, allowed: Signal<boolean>) {
    return httpResource<TruckPage>(() =>
      company() && allowed()
        ? `/api/companies/${company()}/trucks?page=${page()}&size=10&sort=truckId,desc`
        : undefined,
    );
  }
  detail(company: number, id: number) {
    return this.http.get<Truck>(`/api/companies/${company}/trucks/${id}`);
  }
  create(company: number, body: TruckWrite & { ownerPartnerId: number }) {
    return this.http.post<Truck>(`/api/companies/${company}/trucks`, body);
  }
  update(company: number, id: number, body: TruckWrite) {
    return this.http.put<Truck>(`/api/companies/${company}/trucks/${id}`, body);
  }
  status(company: number, id: number, status: Truck['truckState']) {
    return this.http.put<Truck>(`/api/companies/${company}/trucks/${id}/status`, { status });
  }
}
