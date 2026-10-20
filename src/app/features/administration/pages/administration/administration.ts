import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { PendingChanges } from '../../../../core/auth/pending-changes';
import { apiError } from '../../../../core/http/api-error';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';
import { StatusBadge } from '../../../../shared/ui/atoms/status-badge/status-badge';
import { AdministrationApi, Member } from '../../data-access/administration-api';
import { FormModal } from '../../../../shared/ui/molecules/form-modal/form-modal.component';

@Component({
  selector: 'app-administration',
  imports: [ReactiveFormsModule, PageHeading, StatusBadge, FormModal],
  templateUrl: './administration.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Administration {
  readonly session = inject(Session);
  private readonly api = inject(AdministrationApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly page = signal(0);
  readonly companyPage = signal(0);
  readonly companies = this.api.companies(this.session.superAdmin, this.companyPage);
  readonly members = this.api.members(this.session.companyId, this.session.canWrite, this.page);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly selected = signal<Member | null>(null);
  readonly adding = signal(false);
  readonly roleDirty = signal(false);
  openAdd() {
    this.form.reset();
    this.error.set('');
    this.adding.set(true);
  }
  openRoles(member: Member) {
    this.error.set('');
    this.roleDirty.set(false);
    this.selected.set(member);
  }
  closeForm() {
    if (
      this.busy() ||
      ((this.form.dirty || this.roleDirty()) &&
        !window.confirm('¿Descartar los cambios sin guardar?'))
    )
      return;
    this.adding.set(false);
    this.selected.set(null);
    this.form.reset();
    this.roleDirty.set(false);
    this.error.set('');
  }
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly errorText = apiError;
  constructor() {
    this.destroyRef.onDestroy(
      inject(PendingChanges).register(() => this.form.dirty || this.roleDirty() || this.busy()),
    );
    effect(() => {
      this.session.companyId();
      this.page.set(0);
      this.selected.set(null);
      this.adding.set(false);
      this.roleDirty.set(false);
      this.error.set('');
      this.message.set('');
      this.form.reset();
    });
  }
  add() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || !this.session.canWrite() || !this.session.companyId())
      return;
    this.run(
      this.api.add(this.session.companyId()!, this.form.getRawValue().email.trim()),
      'Miembro incorporado. Ahora puedes asignarle roles.',
    );
  }
  status(member: Member) {
    if (!this.session.canWrite() || this.busy()) return;
    const status = member.membershipStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (
      window.confirm(
        `¿Confirmas ${status === 'ACTIVE' ? 'activar' : 'desactivar'} la membresía de ${member.email}?`,
      )
    )
      this.run(
        this.api.status(this.session.companyId()!, member.userId, status),
        'Membresía actualizada.',
        member.userId === this.session.user()?.userId,
      );
  }
  assign(role: string) {
    const member = this.selected();
    if (
      !member ||
      member.membershipStatus !== 'ACTIVE' ||
      !this.session.canWrite() ||
      this.busy() ||
      !['SECRETARY', 'PARTNER', 'DRIVER'].includes(role)
    )
      return;
    if (window.confirm(`¿Asignar el rol ${role} a ${member.email}?`))
      this.run(
        this.api.roles(this.session.companyId()!, member.userId, [role]),
        'Rol asignado. Los roles existentes se conservan.',
        member.userId === this.session.user()?.userId,
      );
  }
  private run(operation: Observable<unknown>, message: string, refreshSession = false) {
    const company = this.session.companyId();
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
          if (company !== this.session.companyId()) return;
          this.form.reset();
          this.selected.set(null);
          this.adding.set(false);
          this.roleDirty.set(false);
          if (refreshSession) {
            this.session.logout();
            return;
          }
          this.message.set(message);
          this.members.reload();
        },
        error: (error) => {
          if (company === this.session.companyId()) this.error.set(apiError(error));
        },
      });
  }
}
