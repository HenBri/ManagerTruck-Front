import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

export interface Truck extends TruckWrite {
  truckId: number;
  ownerPartnerId: number;
  truckBoard: string;
  truckBrand: string | null;
  truckModel: string | null;
  truckChassis: string | null;
  truckColor: string | null;
  truckYear: number | null;
  truckCapacity: number | null;
  state: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  dateCreate: string;
}
export interface TruckWrite {
  truckEmptyWeightKg: number | null;
  trailerEmptyWeightKg: number | null;
  maxGrossWeightKg: number | null;
  truckType: string | null;
  chassisPlate: string | null;
  insuranceExpiration: string | null;
  technicalInspectionExpiration: string | null;
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
  list(page: Signal<number>, allowed: Signal<boolean>) {
    return httpResource<TruckPage>(() =>
      allowed() ? `/api/trucks?page=${page()}&size=10&sort=truckId,desc` : undefined,
    );
  }
  detail(id: number) {
    return this.http.get<Truck>(`/api/trucks/${id}`);
  }
  create(body: TruckWrite & { ownerPartnerId: number }) {
    return this.http.post<Truck>(`/api/trucks`, body);
  }
  update(id: number, body: TruckWrite) {
    return this.http.put<Truck>(`/api/trucks/${id}`, body);
  }
  status(id: number, state: Truck['state']) {
    return this.http.put<Truck>(`/api/trucks/${id}/status`, { state });
  }
}
