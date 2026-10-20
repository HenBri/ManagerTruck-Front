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
    api.status(4, 7, 'MAINTENANCE').subscribe();
    const request = http.expectOne('/api/companies/4/trucks/7/status');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'MAINTENANCE' });
    request.flush({});
  });
  it('keeps tenant in the URL and ownership out of updates', () => {
    const body: TruckWrite = {
      truckBoard: 'ABC-123',
      truckBrand: null,
      truckModel: null,
      truckChassis: null,
      truckColor: null,
      truckYear: 2024,
      truckCapacity: 12.5,
    };
    api.update(4, 7, body).subscribe();
    const request = http.expectOne('/api/companies/4/trucks/7');
    expect(request.request.body.companyId).toBeUndefined();
    expect(request.request.body.ownerPartnerId).toBeUndefined();
    request.flush({});
  });
});
