import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { apiError } from '../../../../core/http/api-error';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';
import { StatusBadge } from '../../../../shared/ui/atoms/status-badge/status-badge';
import {
  PlatformAdminApi,
  PlatformCompany,
  PlatformRole,
  PlatformUser,
} from '../../data-access/platform-admin-api';
import { ConfirmationModal } from '../../../../shared/ui/molecules/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-platform-admin',
  imports: [ReactiveFormsModule, PageHeading, StatusBadge, RouterLink, ConfirmationModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-heading
      title="Administración de plataforma"
      eyebrow="SUPER ADMIN"
      description="Gestiona empresas, cuentas globales y roles de la plataforma. Las membresías y operaciones se administran dentro de cada empresa."
    />
    @if (!session.superAdmin()) {
      <div class="error" role="alert">
        Esta sección está disponible únicamente para SUPER_ADMIN.
      </div>
    } @else {
      <div class="stack">
        @if (error()) {
          <div class="error" role="alert">{{ error() }}</div>
        }
        @if (message()) {
          <div class="success" role="status">{{ message() }}</div>
        }

        <section class="panel stack">
          <div class="section-title">
            <h2>Empresas</h2>
            <button class="button primary" (click)="newCompany()">Crear empresa</button>
          </div>
          @if (companyFormOpen()) {
            <form class="form-grid" [formGroup]="companyForm" (ngSubmit)="saveCompany()">
              <label class="field">Nombre<input formControlName="name" maxlength="150" /></label>
              <label class="field">NIT<input formControlName="nit" maxlength="30" /></label>
              <label class="field"
                >Dirección<input formControlName="address" maxlength="255"
              /></label>
              <label class="field">Teléfono<input formControlName="phone" maxlength="25" /></label>
              <div class="actions">
                <button class="button primary" type="submit" [disabled]="busy()">
                  {{ editingCompany() ? 'Guardar empresa' : 'Crear empresa' }}</button
                ><button class="button" type="button" (click)="companyFormOpen.set(false)">
                  Cancelar
                </button>
              </div>
            </form>
          }
          @if (companies.isLoading()) {
            <p role="status">Cargando empresas…</p>
          } @else if (companies.error()) {
            <div class="error" role="alert">
              {{ errorText(companies.error()) }}
              <button class="button" (click)="companies.reload()">Reintentar</button>
            </div>
          } @else if (companies.hasValue()) {
            <div class="table-wrap" tabindex="0" role="region" aria-label="Empresas de plataforma">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>NIT</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (company of companies.value().companies; track company.companyId) {
                    <tr>
                      <td>{{ company.name }} · #{{ company.companyId }}</td>
                      <td>{{ company.nit || '—' }}</td>
                      <td><app-status-badge [value]="company.status" /></td>
                      <td>
                        <div class="actions">
                          <button class="button" (click)="editCompany(company)">Editar</button
                          ><button
                            class="button"
                            (click)="openCompany(company)"
                            [disabled]="company.status !== 'ACTIVE'"
                          >
                            Operar</button
                          ><button class="button" (click)="toggleCompany(company)">
                            {{ company.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}</button
                          ><button
                            class="button"
                            disabled
                            title="Eliminación no disponible todavía"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">No hay empresas registradas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span
                >{{ companies.value().totalElements }} empresas · Página {{ companyPage() + 1 }} de
                {{ companies.value().totalPages || 1 }}</span
              >
              <div class="actions">
                <button
                  class="button"
                  (click)="companyPage.set(companyPage() - 1)"
                  [disabled]="companyPage() === 0"
                >
                  Anterior</button
                ><button
                  class="button"
                  (click)="companyPage.set(companyPage() + 1)"
                  [disabled]="companyPage() + 1 >= companies.value().totalPages"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
          @if (session.companyId()) {
            <div class="actions">
              <a class="button" routerLink="/administracion"
                >Membresías y roles de {{ activeCompanyName() }}</a
              ><a class="button" routerLink="/gestion/asignaciones"
                >Asignaciones camión-conductor</a
              >
            </div>
          }
        </section>

        <section class="panel stack">
          <div class="section-title">
            <h2>Cuentas globales</h2>
            <button class="button primary" (click)="userFormOpen.set(!userFormOpen())">
              Crear cuenta
            </button>
          </div>
          @if (userFormOpen()) {
            <p class="muted">
              La contraseña inicial se guarda como hash. Crear una cuenta no la incorpora a una
              empresa ni le asigna roles.
            </p>
            <form class="form-grid" [formGroup]="userForm" (ngSubmit)="createUser()">
              <label class="field"
                >Nombre<input formControlName="name" autocomplete="given-name"
              /></label>
              <label class="field"
                >Apellido<input formControlName="lastname" autocomplete="family-name"
              /></label>
              <label class="field"
                >Correo<input type="email" formControlName="email" autocomplete="email"
              /></label>
              <label class="field"
                >Contraseña inicial<input
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                />
                @if (userForm.controls.password.touched && userForm.controls.password.invalid) {
                  <small>Debe tener al menos 8 caracteres.</small>
                }
              </label>
              <label class="field">Documento (opcional)<input formControlName="ci" /></label>
              <label class="field">Teléfono (opcional)<input formControlName="phone" /></label>
              <div class="actions">
                <button class="button primary" type="submit" [disabled]="busy()">
                  Crear cuenta</button
                ><button class="button" type="button" (click)="userFormOpen.set(false)">
                  Cerrar
                </button>
              </div>
            </form>
          }
          @if (users.isLoading()) {
            <p role="status">Cargando cuentas…</p>
          } @else if (users.error()) {
            <div class="error" role="alert">
              {{ errorText(users.error()) }}
              <button class="button" (click)="users.reload()">Reintentar</button>
            </div>
          } @else if (users.hasValue()) {
            <div class="table-wrap" tabindex="0" role="region" aria-label="Cuentas globales">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users.value().users; track user.userId) {
                    <tr>
                      <td>{{ user.name }} {{ user.lastname }}</td>
                      <td>{{ user.email }}</td>
                      <td><app-status-badge [value]="user.status" /></td>
                      <td>
                        <div class="actions">
                          <button
                            class="button"
                            disabled
                            title="La edición de cuentas aún no está disponible"
                          >
                            Editar
                          </button>
                          <button class="button" (click)="toggleUser(user)">
                            {{ user.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}
                          </button>
                          <button class="button" disabled title="Eliminación no disponible todavía">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">No hay cuentas registradas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span
                >{{ users.value().totalElements }} cuentas · Página {{ userPage() + 1 }} de
                {{ users.value().totalPages || 1 }}</span
              >
              <div class="actions">
                <button
                  class="button"
                  (click)="userPage.set(userPage() - 1)"
                  [disabled]="userPage() === 0"
                >
                  Anterior</button
                ><button
                  class="button"
                  (click)="userPage.set(userPage() + 1)"
                  [disabled]="userPage() + 1 >= users.value().totalPages"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        </section>

        <section class="panel stack">
          <h2>Roles y auditoría de plataforma</h2>
          <p class="muted">
            La asignación de SUPER_ADMIN sigue siendo un aprovisionamiento manual auditado. Los
            roles de empresa se asignan desde Administración dentro de cada tenant.
          </p>
          @if (roles.isLoading() || grants.isLoading()) {
            <p role="status">Cargando roles…</p>
          }
          @if (roles.error() || grants.error()) {
            <div class="error" role="alert">{{ errorText(roles.error() || grants.error()) }}</div>
          }
          @if (roles.hasValue()) {
            <h3>Catálogo</h3>
            <div class="table-wrap" tabindex="0">
              <table>
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Ámbito</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (role of roles.value().roles; track role.roleId) {
                    <tr>
                      <td>{{ role.name }}</td>
                      <td>{{ role.scope }}</td>
                      <td>{{ role.description || '—' }}</td>
                      <td>
                        <div class="actions">
                          <button class="button" (click)="editRole(role)">Editar</button>
                          <button class="button" disabled title="Eliminación no disponible todavía">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (selectedRole(); as role) {
            <form class="form-grid" [formGroup]="roleForm" (ngSubmit)="saveRole(role)">
              <h3>Descripción de {{ role.name }}</h3>
              <label class="field"
                >Descripción<input formControlName="description" maxlength="255"
              /></label>
              <div class="actions">
                <button class="button primary" type="submit" [disabled]="busy()">
                  Guardar descripción</button
                ><button class="button" type="button" (click)="selectedRole.set(null)">
                  Cancelar
                </button>
              </div>
            </form>
          }
          @if (grants.hasValue()) {
            <h3>Administradores de plataforma</h3>
            <div class="table-wrap" tabindex="0">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (
                    grant of grants.value().platformRoles;
                    track grant.userId + grant.roleName
                  ) {
                    <tr>
                      <td>#{{ grant.userId }}</td>
                      <td>{{ grant.email || '—' }}</td>
                      <td>{{ grant.roleName }}</td>
                      <td>
                        <button
                          class="button"
                          disabled
                          title="No existe una edición para esta asignación"
                        >
                          Editar
                        </button>
                        <button class="button" disabled title="Eliminación no disponible todavía">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">No hay asignaciones que mostrar.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
      @if (pendingCompanyStatus(); as company) {
        <app-confirmation-modal
          title="Confirmar cambio de estado"
          [message]="
            '¿Confirmas ' +
            (company.status === 'ACTIVE' ? 'desactivar' : 'activar') +
            ' la empresa ' +
            company.name +
            '?'
          "
          [busy]="busy()"
          (cancelled)="pendingCompanyStatus.set(null)"
          (confirmed)="confirmCompanyStatus()"
        />
      }
      @if (pendingUserStatus(); as user) {
        <app-confirmation-modal
          title="Confirmar cambio de estado"
          [message]="
            '¿Confirmas ' +
            (user.status === 'ACTIVE' ? 'desactivar' : 'activar') +
            ' la cuenta ' +
            user.email +
            '?'
          "
          [busy]="busy()"
          (cancelled)="pendingUserStatus.set(null)"
          (confirmed)="confirmUserStatus()"
        />
      }
    }
  `,
})
export class PlatformAdmin {
  readonly session = inject(Session);
  private readonly api = inject(PlatformAdminApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly companyPage = signal(0);
  readonly userPage = signal(0);
  readonly companies = this.api.companies(this.companyPage);
  readonly users = this.api.users(this.userPage);
  readonly roles = this.api.roles();
  readonly grants = this.api.grants();
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly companyFormOpen = signal(false);
  readonly userFormOpen = signal(false);
  readonly editingCompany = signal<number | null>(null);
  readonly errorText = apiError;
  readonly companyForm = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    nit: [''],
    address: [''],
    phone: [''],
  });
  readonly userForm = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    ci: [''],
    phone: [''],
  });
  readonly roleForm = inject(FormBuilder).nonNullable.group({ description: [''] });
  readonly selectedRole = signal<PlatformRole | null>(null);
  readonly pendingCompanyStatus = signal<PlatformCompany | null>(null);
  readonly pendingUserStatus = signal<PlatformUser | null>(null);

  newCompany() {
    this.editingCompany.set(null);
    this.companyForm.reset();
    this.companyFormOpen.set(true);
  }
  editCompany(company: PlatformCompany) {
    this.editingCompany.set(company.companyId);
    this.companyForm.patchValue({
      name: company.name,
      nit: company.nit ?? '',
      address: company.address ?? '',
      phone: company.phone ?? '',
    });
    this.companyFormOpen.set(true);
  }
  saveCompany() {
    this.companyForm.markAllAsTouched();
    if (this.companyForm.invalid || this.busy()) return;
    const data = this.companyForm.getRawValue();
    const id = this.editingCompany();
    this.run(
      id ? this.api.updateCompany(id, data) : this.api.createCompany(data),
      id ? 'Empresa actualizada.' : 'Empresa creada.',
      () => {
        this.companyFormOpen.set(false);
        this.companies.reload();
      },
    );
  }
  toggleCompany(company: PlatformCompany) {
    this.pendingCompanyStatus.set(company);
  }
  confirmCompanyStatus() {
    const company = this.pendingCompanyStatus();
    if (!company || this.busy()) return;
    const next = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.pendingCompanyStatus.set(null);
    this.run(
      this.api.companyStatus(company.companyId, next),
      'Estado de empresa actualizado.',
      () => this.companies.reload(),
    );
  }
  openCompany(company: PlatformCompany) {
    this.session.openAdminCompany(company);
  }
  activeCompanyName() {
    return (
      this.session.companies().find((company) => company.companyId === this.session.companyId())
        ?.name ?? `empresa #${this.session.companyId()}`
    );
  }
  createUser() {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid || this.busy()) return;
    this.run(
      this.api.createUser(this.userForm.getRawValue()),
      'Cuenta creada. Incorpórala a una empresa para asignarle membresía y roles.',
      () => {
        this.userForm.reset();
        this.userFormOpen.set(false);
        this.users.reload();
      },
    );
  }
  toggleUser(user: PlatformUser) {
    this.pendingUserStatus.set(user);
  }
  confirmUserStatus() {
    const user = this.pendingUserStatus();
    if (!user || this.busy()) return;
    const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.pendingUserStatus.set(null);
    this.run(this.api.userStatus(user.userId, next), 'Estado de cuenta actualizado.', () =>
      this.users.reload(),
    );
  }
  editRole(role: PlatformRole) {
    this.selectedRole.set(role);
    this.roleForm.setValue({ description: role.description ?? '' });
  }
  saveRole(role: PlatformRole) {
    this.run(
      this.api.updateRole(role.roleId, { name: role.name, ...this.roleForm.getRawValue() }),
      'Descripción del rol actualizada.',
      () => {
        this.selectedRole.set(null);
        this.roles.reload();
      },
    );
  }
  private run(operation: Observable<unknown>, success: string, refresh: () => void) {
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    operation
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.message.set(success);
          refresh();
        },
        error: (error) => this.error.set(apiError(error)),
      });
  }
}
