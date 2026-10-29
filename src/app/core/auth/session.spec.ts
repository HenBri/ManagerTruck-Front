import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from './session';
import { authInterceptor } from './auth';

describe('Truckv3 session', () => {
  let session: Session;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    session = TestBed.inject(Session);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  for (const role of ['ADMIN', 'SECRETARY', 'PARTNER', 'DRIVER', 'NONE']) {
    it(`derives only verified capabilities for ${role}`, () => {
      session.login('test@example.com', 'example-password').subscribe();
      const me = http.expectOne('/api/users/me');
      expect(me.request.headers.get('Authorization')).toBe(
        `Basic ${btoa('test@example.com:example-password')}`,
      );
      me.flush({
        userId: 1,
        personId: 9,
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'test@example.com',
      });
      for (const endpoint of ['users', 'clients', 'trucks', 'journeys', 'drivers']) {
        const request = http.expectOne(`/api/${endpoint}?page=0&size=1`);
        const allowed =
          role === 'ADMIN' ||
          (role === 'SECRETARY' && endpoint !== 'users') ||
          (role === 'PARTNER' && ['trucks', 'journeys', 'drivers'].includes(endpoint)) ||
          (role === 'DRIVER' && ['journeys', 'drivers'].includes(endpoint));
        if (allowed)
          request.flush(
            endpoint === 'drivers' ? { drivers: role === 'DRIVER' ? [{ driverId: 9 }] : [] } : {},
          );
        else request.flush({ message: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });
      }
      expect(session.canWrite()).toBe(['ADMIN', 'SECRETARY'].includes(role));
      expect(session.isAdmin()).toBe(role === 'ADMIN');
      expect(session.roles()).toEqual(role === 'NONE' ? [] : [role]);
      expect(session.canRead('freights')).toBe(['ADMIN', 'SECRETARY', 'PARTNER'].includes(role));
      session.logout();
      expect(session.user()).toBeNull();
      expect(session.header()).toBe('');
      expect(session.readable()).toEqual([]);
    });
  }
  it('does not probe permissions or establish a session after bad credentials', () => {
    session.login('test@example.com', 'wrong').subscribe({ error: () => undefined });
    http.expectOne('/api/users/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.user()).toBeNull();
    expect(session.header()).toBe('');
  });
  it('keeps the session when a permission request fails', () => {
    session.login('test@example.com', 'password').subscribe();
    http.expectOne('/api/users/me').flush({ userId: 1, personId: 1 });
    const requests = http.match((request) => request.url.includes('?page='));
    requests[0].flush({}, { status: 500, statusText: 'Server error' });
    requests.slice(1).forEach((request) => request.flush({}));
    expect(session.user()).not.toBeNull();
  });
});
