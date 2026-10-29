import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { permissionGuard } from './auth';
import { Session } from './session';

describe('Module permission guard', () => {
  function check(endpoint: string, admin = false, canRead = false, isAdmin = false) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Session, useValue: { isAdmin: () => isAdmin, canRead: () => canRead } },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      permissionGuard(
        { data: { endpoint, admin } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }
  it('blocks direct access to commercial routes for a read-only account', () => {
    const result = check('clients');
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/inicio');
  });
  it('does not grant administration merely because a resource is readable', () => {
    expect(check('roles', true, true)).not.toBe(true);
  });
  it('admits a verified administrator', () => {
    expect(check('users', true, true, true)).toBe(true);
  });
});
