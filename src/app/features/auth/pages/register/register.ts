import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { apiError } from '../../../../core/http/api-error';
import { User } from '../../../../core/auth/session';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="panel stack">
    <h1>Crear cuenta</h1>
    <p>Los campos con * son obligatorios.</p>
    @if (error()) {
      <div class="error" role="alert">{{ error() }}</div>
    }
    @if (created()) {
      <p class="success" role="status">Cuenta creada. Ya puedes iniciar sesión.</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
        <div class="form-grid">
          @for (field of fields; track field.key) {
            <label class="field"
              >{{ field.label }}
              <input
                [type]="field.type"
                [formControlName]="field.key"
                [maxlength]="field.max"
                [autocomplete]="field.type === 'password' ? 'new-password' : 'off'"
              />
              @if (form.get(field.key)?.touched && form.get(field.key)?.invalid) {
                <small>Introduce un valor válido.</small>
              }
            </label>
          }
        </div>
        <button class="button primary" [disabled]="busy()" type="submit">
          {{ busy() ? 'Registrando…' : 'Crear cuenta' }}
        </button>
      </form>
    }
    <a routerLink="/login">Ir al inicio de sesión</a>
  </main>`,
  styles: `
    :host {
      display: block;
      max-width: 800px;
      margin: 3rem auto;
      padding: 1rem;
    }
  `,
})
export class Register {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly created = signal(false);
  readonly fields = [
    { key: 'firstName', label: 'Nombres *', type: 'text', max: 100 },
    { key: 'lastName', label: 'Apellido paterno *', type: 'text', max: 100 },
    { key: 'maternalLastName', label: 'Apellido materno', type: 'text', max: 100 },
    { key: 'documentNumber', label: 'Documento', type: 'text', max: 30 },
    { key: 'phone', label: 'Teléfono', type: 'tel', max: 25 },
    { key: 'email', label: 'Correo *', type: 'email', max: 255 },
    { key: 'password', label: 'Contraseña (8–72 caracteres) *', type: 'password', max: 72 },
  ];
  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    maternalLastName: ['', Validators.maxLength(100)],
    documentNumber: ['', Validators.maxLength(30)],
    phone: ['', Validators.maxLength(25)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });
  submit() {
    this.form.markAllAsTouched();
    if (this.busy() || this.form.invalid) return;
    const body = this.form.getRawValue();
    body.email = body.email.trim();
    body.firstName = body.firstName.trim();
    body.lastName = body.lastName.trim();
    this.busy.set(true);
    this.error.set('');
    this.http
      .post<User>('/api/users', body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.created.set(true);
        },
        error: (error) => this.error.set(apiError(error)),
      });
  }
}
