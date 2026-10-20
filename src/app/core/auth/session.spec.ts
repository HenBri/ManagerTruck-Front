import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from './session';
import { authInterceptor } from './auth';

describe('Session', () => {
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
  it('only admits active memberships and changes permissions with the tenant', () => {
    session.login('test@example.com', 'example-password').subscribe();
    const me = http.expectOne('/api/users/me');
    expect(me.request.headers.get('Authorization')).toBe(
      `Basic ${btoa('test@example.com:example-password')}`,
    );
    me.flush({ userId: 1, name: 'Ana', lastname: 'Pérez', email: 'test@example.com' });
    http
      .expectOne('/api/platform/user-roles')
      .flush({ message: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });
    http.expectOne('/api/users/me/memberships').flush({
      memberships: [
        { companyId: 1, membershipStatus: 'ACTIVE', roleNames: ['SECRETARY'] },
        { companyId: 2, membershipStatus: 'ACTIVE', roleNames: ['PARTNER'] },
        { companyId: 3, membershipStatus: 'INACTIVE', roleNames: ['SECRETARY'] },
      ],
    });
    expect(session.canWrite()).toBe(true);
    session.selectCompany(2);
    expect(session.canWrite()).toBe(false);
    session.selectCompany(3);
    expect(session.companyId()).toBe(2);
    session.logout();
    expect(session.user()).toBeNull();
    expect(session.header()).toBe('');
    expect(session.memberships()).toEqual([]);
  });
  it('does not establish a session when authentication fails', () => {
    session.login('test@example.com', 'wrong').subscribe({ error: () => undefined });
    const memberships = http.expectOne('/api/users/me/memberships');
    const platform = http.expectOne('/api/platform/user-roles');
    http
      .expectOne('/api/users/me')
      .flush({ message: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });
    expect(memberships.cancelled).toBe(true);
    expect(platform.cancelled).toBe(true);
    expect(session.user()).toBeNull();
    expect(session.header()).toBe('');
  });
});
