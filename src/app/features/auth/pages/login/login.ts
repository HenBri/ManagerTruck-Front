import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Session } from '../../../../core/auth/session';
import { apiError } from '../../../../core/http/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly visible = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  submit() {
    if (this.pending()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.pending.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.session
      .login(email.trim(), password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          void this.router.navigateByUrl('/inicio');
        },
        error: (error) => this.error.set(apiError(error)),
      });
  }
}
