import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { apiError } from '../../../../core/http/api-error';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';
import { AccountApi } from '../../data-access/account-api';
import { PendingChanges } from '../../../../core/auth/pending-changes';
import { FormModal } from '../../../../shared/ui/molecules/form-modal/form-modal.component';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, PageHeading, FormModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-page-heading
      title="Mi perfil"
      description="Tu cuenta es personal. Tus permisos se administran en cada empresa."
      eyebrow="MI CUENTA / PERFIL"
    />
    <div class="stack">
      @if (error() && !editor()) {
        <div role="alert" class="error">{{ error() }}</div>
      }
      @if (message()) {
        <div role="status" class="success">{{ message() }}</div>
      }
      <section class="panel">
        <h2>Información personal</h2>
        <p class="muted">{{ session.user()?.email }}</p>
        <p>{{ session.user()?.name }} {{ session.user()?.lastname }}</p>
        <button class="button primary" (click)="openEditor('profile')">Editar perfil</button>
        @if (editor() === 'profile') {
          <app-form-modal title="Editar perfil" [busy]="busy()" (closeRequested)="closeEditor()">
            @if (error()) {
              <div class="error" role="alert">{{ error() }}</div>
            }
            <form class="stack" [formGroup]="form" (ngSubmit)="save()">
              <div class="form-grid">
                @for (field of fields; track field.key) {
                  <label class="field"
                    >{{ field.label
                    }}<input
                      [formControlName]="field.key"
                      [maxlength]="field.max"
                      [autocomplete]="field.autocomplete"
                    />
                    @if (form.get(field.key)?.touched && form.get(field.key)?.invalid) {
                      <small>Introduce un valor válido.</small>
                    }
                  </label>
                }
              </div>
              <div>
                <button class="button primary" [disabled]="busy()" type="submit">
                  {{ busy() ? 'Guardando…' : 'Guardar perfil' }}
                </button>
              </div>
            </form>
          </app-form-modal>
        }
      </section>
      <section class="panel">
        <h2>Cambiar contraseña</h2>
        <p class="muted">Después del cambio deberás iniciar sesión con tu nueva contraseña.</p>
        <button class="button" (click)="openEditor('password')">Cambiar contraseña</button>
        @if (editor() === 'password') {
          <app-form-modal
            title="Cambiar contraseña"
            [busy]="busy()"
            (closeRequested)="closeEditor()"
          >
            @if (error()) {
              <div class="error" role="alert">{{ error() }}</div>
            }
            <form class="stack" [formGroup]="password" (ngSubmit)="changePassword()">
              <div class="form-grid">
                <label class="field"
                  >Contraseña actual<input
                    type="password"
                    formControlName="currentPassword"
                    autocomplete="current-password" /></label
                ><label class="field"
                  >Nueva contraseña<input
                    type="password"
                    formControlName="newPassword"
                    autocomplete="new-password"
                  /><small>Entre 8 y 72 caracteres.</small></label
                ><label class="field"
                  >Confirmar nueva contraseña<input
                    type="password"
                    formControlName="confirmation"
                    autocomplete="new-password"
                /></label>
              </div>
              <div>
                <button type="submit" class="button" [disabled]="busy()">
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </app-form-modal>
        }
      </section>
      <section class="panel">
        <h2>Mis empresas activas</h2>
        @for (membership of session.memberships(); track membership.companyId) {
          <p>
            Empresa #{{ membership.companyId }}
            <span class="muted"
              >· {{ membership.roleNames.join(', ') || 'Sin roles asignados' }}</span
            >
          </p>
        } @empty {
          <p class="muted">
            No tienes membresías activas. Solicita acceso al administrador de tu empresa.
          </p>
        }
      </section>
    </div>`,
  styles: `
    :host {
      display: block;
      max-width: 1000px;
    }
  `,
})
export class Profile {
  readonly session = inject(Session);
  private readonly api = inject(AccountApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editor = signal<'profile' | 'password' | null>(null);
  openEditor(editor: 'profile' | 'password') {
    const user = this.session.user();
    this.form.reset({
      name: user?.name ?? '',
      lastname: user?.lastname ?? '',
      ci: user?.ci ?? '',
      phone: user?.phone ?? '',
    });
    this.password.reset();
    this.error.set('');
    this.message.set('');
    this.editor.set(editor);
  }
  closeEditor() {
    if (
      this.busy() ||
      ((this.form.dirty || this.password.dirty) &&
        !window.confirm('¿Descartar los cambios sin guardar?'))
    )
      return;
    this.editor.set(null);
    this.form.reset();
    this.password.reset();
    this.error.set('');
  }
  readonly fields = [
    { key: 'name', label: 'Nombres *', max: 100, autocomplete: 'given-name' },
    { key: 'lastname', label: 'Apellidos *', max: 150, autocomplete: 'family-name' },
    { key: 'ci', label: 'Documento', max: 30, autocomplete: 'off' },
    { key: 'phone', label: 'Teléfono', max: 25, autocomplete: 'tel' },
  ];
  readonly form = this.fb.nonNullable.group({
    name: [
      this.session.user()?.name ?? '',
      [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)],
    ],
    lastname: [
      this.session.user()?.lastname ?? '',
      [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)],
    ],
    ci: [this.session.user()?.ci ?? '', Validators.maxLength(30)],
    phone: [this.session.user()?.phone ?? '', Validators.maxLength(25)],
  });
  readonly password = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmation: ['', Validators.required],
  });
  constructor() {
    this.destroyRef.onDestroy(
      inject(PendingChanges).register(() => this.form.dirty || this.password.dirty || this.busy()),
    );
  }
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.api
      .update(this.session.user()!.userId, this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.session.user.set(user);
          this.form.markAsPristine();
          this.editor.set(null);
          this.message.set('Perfil actualizado.');
        },
        error: (e) => this.error.set(apiError(e)),
      });
  }
  changePassword() {
    if (this.busy()) return;
    const { currentPassword, newPassword, confirmation } = this.password.getRawValue();
    if (this.password.invalid || newPassword !== confirmation) {
      this.error.set(
        'Completa la contraseña actual y una nueva de 8 a 72 caracteres. La confirmación debe coincidir.',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.api
      .password(this.session.user()!.userId, { currentPassword, newPassword })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.password.reset();
          this.session.logout();
        },
        error: (e) => this.error.set(apiError(e)),
      });
  }
}
