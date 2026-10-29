import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FleetApi, TruckWrite } from './fleet-api';

describe('FleetApi contract', () => {
  let api: FleetApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(FleetApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends the backend status DTO rather than a response property', () => {
    api.status(7, 'MAINTENANCE').subscribe();
    const request = http.expectOne('/api/trucks/7/status');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ state: 'MAINTENANCE' });
    request.flush({});
  });
  it('uses the global endpoint and keeps ownership out of updates', () => {
    const body: TruckWrite = {
      truckBoard: 'ABC-123',
      truckBrand: null,
      truckModel: null,
      truckChassis: null,
      truckColor: null,
      truckYear: 2024,
      truckCapacity: 12.5,
      truckEmptyWeightKg: 8450,
      trailerEmptyWeightKg: 6200,
      maxGrossWeightKg: 48000,
      truckType: 'TRACTOCAMION',
      chassisPlate: 'REM-4455',
      insuranceExpiration: '2027-12-31',
      technicalInspectionExpiration: null,
    };
    api.update(7, body).subscribe();
    const request = http.expectOne('/api/trucks/7');
    expect(request.request.body.insuranceExpiration).toBe('2027-12-31');
    expect(request.request.body.companyId).toBeUndefined();
    expect(request.request.body.ownerPartnerId).toBeUndefined();
    request.flush({});
  });
});
