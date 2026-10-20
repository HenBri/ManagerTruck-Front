import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { apiError } from '../../../../core/http/api-error';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';
import { StatusBadge } from '../../../../shared/ui/atoms/status-badge/status-badge';
import { CatalogApi, RecordData } from '../../data-access/catalog-api';
import { catalogs, Field, labels, relations, filterFields } from '../../data-access/catalog-config';
import { EntitySelect } from '../../../../shared/ui/molecules/entity-select/entity-select';
import { EntityLabel } from '../../../../shared/ui/molecules/entity-label/entity-label';
import { PendingChanges } from '../../../../core/auth/pending-changes';
import { journeyStep, journeyTargets } from '../../../journeys/models/journey-policy';
import { FormModal } from '../../../../shared/ui/molecules/form-modal/form-modal.component';

@Component({
  selector: 'app-catalog',
  imports: [ReactiveFormsModule, PageHeading, StatusBadge, EntitySelect, EntityLabel, FormModal],
  templateUrl: './catalog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  readonly session = inject(Session);
  private readonly api = inject(CatalogApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly module = toSignal(
    inject(ActivatedRoute).data.pipe(map((data) => data['module'] as string)),
    { initialValue: '' },
  );
  readonly config = computed(() => catalogs[this.module()]);
  readonly recordKey = (row: RecordData) => row[this.config().id];
  readonly allowed = computed(
    () =>
      !!this.session.companyId() &&
      (this.config()?.commercial
        ? this.session.canWrite()
        : this.session
            .roles()
            .some((r) => ['SUPER_ADMIN', 'SECRETARY', 'PARTNER', 'DRIVER'].includes(r))),
  );
  readonly canChangeStatus = computed(
    () =>
      this.session.canWrite() ||
      (this.module() === 'viajes' && this.session.roles().includes('DRIVER')),
  );
  readonly availableStatuses = computed(() => {
    if (this.module() !== 'viajes') return this.config()?.statuses ?? [];
    return journeyTargets(
      this.selected()?.['journeyState'],
      this.session.canWrite(),
      this.selected()?.['executionType'],
    );
  });
  readonly page = signal(0);
  readonly filters = computed(() => filterFields[this.module()] ?? []);
  readonly filterForm = new FormGroup<Record<string, FormControl>>({});
  readonly query = signal('');
  readonly descending = signal(true);
  readonly base = computed(
    () => `/api/companies/${this.session.companyId()}/${this.config()?.endpoint}`,
  );
  readonly result = this.api.list(() =>
    this.allowed() && this.config()
      ? `${this.base()}?page=${this.page()}&size=10&sort=${this.config().id},${this.descending() ? 'desc' : 'asc'}${this.query()}`
      : undefined,
  );
  readonly records = computed(() =>
    this.result.hasValue() ? (this.result.value()[this.config().collection] as RecordData[]) : [],
  );
  readonly selected = signal<RecordData | null>(null);
  readonly editing = signal(false);
  readonly action = signal<'status' | 'end' | null>(null);
  readonly actionDirty = signal(false);
  openAction(action: 'status' | 'end') {
    this.error.set('');
    this.actionDirty.set(false);
    this.action.set(action);
  }
  closeAction() {
    if (
      this.busy() ||
      (this.actionDirty() && !window.confirm('¿Descartar los cambios sin guardar?'))
    )
      return;
    this.action.set(null);
    this.actionDirty.set(false);
    this.error.set('');
  }
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly mode = signal('PARTNER');
  readonly step = signal(0);
  readonly form = signal(new FormGroup<Record<string, FormControl>>({}));
  readonly fields = computed(() =>
    (this.config()?.fields ?? []).filter(
      (f) => (!this.selected() || !f.createOnly) && (!f.only || f.only === this.mode()),
    ),
  );
  readonly errorText = apiError;
  readonly wizard = computed(() => this.module() === 'viajes' && !this.selected());
  readonly displayedFields = computed(() =>
    this.wizard()
      ? this.fields().filter((field) => journeyStep(field.key) === this.step())
      : this.fields(),
  );
  nextStep() {
    const controls = this.displayedFields().map((field) => this.form().controls[field.key]);
    controls.forEach((control) => control.markAsTouched());
    if (controls.every((control) => control.valid)) this.step.update((value) => value + 1);
  }
  readonly label = (value: unknown) => labels[String(value)] ?? String(value ?? '—');
  readonly relations = relations;
  readonly relationLabel = (field: Field) =>
    field.label
      .replace(/^ID (del |de la |de |del|de)/, '')
      .replace(/^ID /, '')
      .replace(/^./, (c) => c.toUpperCase()) + (field.required ? ' *' : '');
  constructor() {
    this.destroyRef.onDestroy(
      inject(PendingChanges).register(
        () => (this.editing() && this.form().dirty) || this.actionDirty() || this.busy(),
      ),
    );
    for (const filter of filterFields[this.route.snapshot.data['module']] ?? [])
      this.filterForm.addControl(filter.key, new FormControl(''));
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const page = Number(params.get('page') || 0);
      this.page.set(Number.isSafeInteger(page) && page >= 0 ? page : 0);
      this.descending.set(params.get('order') !== 'asc');
      const query = new URLSearchParams();
      for (const filter of filterFields[this.route.snapshot.data['module']] ?? []) {
        const raw = params.get(filter.key) ?? '';
        const value = filter.options
          ? filter.options.includes(raw)
            ? raw
            : ''
          : filter.key === 'name'
            ? raw.slice(0, 150)
            : /^\d+$/.test(raw) && Number(raw) > 0
              ? raw
              : '';
        this.filterForm.get(filter.key)?.setValue(value);
        if (value) query.set(filter.key, value);
      }
      this.query.set(query.size ? '&' + query.toString() : '');
    });
    let previousCompany = this.session.companyId();
    effect(() => {
      this.module();
      const company = this.session.companyId();
      if (company !== previousCompany) {
        previousCompany = company;
        this.filterForm.reset();
        this.applyFilters();
      }
      this.editing.set(false);
      this.action.set(null);
      this.actionDirty.set(false);
      this.selected.set(null);
      this.message.set('');
      this.error.set('');
    });
  }
  setPage(page: number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  applyFilters() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.filterForm.getRawValue(),
        page: 0,
        order: this.descending() ? 'desc' : 'asc',
      },
      replaceUrl: true,
    });
  }
  private setup(fields: Field[], data: RecordData = {}) {
    const controls: Record<string, FormControl> = {};
    for (const field of fields) {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
        if (!field.type || field.type === 'text') validators.push(Validators.pattern(/\S/));
      }
      if (field.max) validators.push(Validators.maxLength(field.max));
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.type === 'email') validators.push(Validators.email);
      if (field.type === 'number') {
        validators.push(
          Validators.pattern(
            field.step === '0.001'
              ? /^\d+(\.\d{1,3})?$/
              : field.step === '0.01'
                ? /^\d+(\.\d{1,2})?$/
                : /^\d+$/,
          ),
        );
        validators.push(
          Validators.max(
            field.step === '0.001'
              ? 999999999.999
              : field.step === '0.01'
                ? 9999999999999.99
                : Number.MAX_SAFE_INTEGER,
          ),
        );
      }
      controls[field.key] = new FormControl(
        data[field.key] ?? (field.key === 'executionType' ? this.mode() : null),
        validators,
      );
    }
    this.form.set(new FormGroup(controls));
  }
  create() {
    this.step.set(0);
    this.selected.set(null);
    this.mode.set('PARTNER');
    this.setup(this.fields());
    this.editing.set(true);
    this.error.set('');
    this.message.set('');
  }
  edit() {
    this.setup(this.fields(), this.selected()!);
    this.editing.set(true);
    this.error.set('');
  }
  modeChange() {
    const data = this.form().getRawValue();
    this.mode.set(String(data['executionType']));
    this.setup(this.fields(), data);
    this.form().markAsDirty();
  }
  cancel() {
    if (this.busy()) return;
    if (!this.form().dirty || window.confirm('¿Descartar los cambios sin guardar?')) {
      this.editing.set(false);
      this.form().reset();
      this.error.set('');
    }
  }
  detail(row: RecordData) {
    if (this.busy()) return;
    const base = this.base();
    this.busy.set(true);
    this.error.set('');
    this.api
      .detail(`${base}/${row[this.config().id]}`)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (base === this.base()) this.selected.set(data);
        },
        error: (e) => {
          if (base === this.base()) this.error.set(apiError(e));
        },
      });
  }
  save() {
    if (this.busy() || !this.session.canWrite()) return;
    if (this.wizard() && this.step() < 2) {
      this.nextStep();
      return;
    }
    this.form().markAllAsTouched();
    if (this.form().invalid) return;
    const body: RecordData = {};
    for (const field of this.fields()) {
      const value = this.form().get(field.key)?.value;
      body[field.key] = typeof value === 'string' ? value.trim() || null : (value ?? null);
    }
    if (
      this.module() === 'asignaciones' &&
      body['assignedUntil'] &&
      String(body['assignedUntil']) <= String(body['assignedFrom'])
    ) {
      this.error.set('El fin de la asignación debe ser posterior al inicio.');
      return;
    }
    const selected = this.selected();
    this.perform(
      selected
        ? this.api.update(`${this.base()}/${selected[this.config().id]}`, body)
        : this.api.create(this.base(), body),
    );
  }
  changeStatus(value: string) {
    if (
      !this.selected() ||
      this.busy() ||
      !this.canChangeStatus() ||
      !this.availableStatuses().includes(value)
    )
      return;
    if (!window.confirm(`¿Confirmas el cambio de estado a ${this.label(value)}?`)) return;
    const body: RecordData =
      this.config().state === 'clientState' ? { clientState: value === 'true' } : { status: value };
    this.perform(
      this.api.update(`${this.base()}/${this.selected()![this.config().id]}/status`, body),
    );
  }
  endAssignment(until: string) {
    if (this.busy() || !this.session.canWrite() || !this.selected()) return;
    if (!until) {
      this.error.set('Introduce una fecha de finalización.');
      return;
    }
    if (until <= String(this.selected()!['assignedFrom'])) {
      this.error.set('El fin debe ser posterior al inicio.');
      return;
    }
    if (window.confirm('¿Confirmas finalizar esta asignación?'))
      this.perform(
        this.api.update(`${this.base()}/${this.selected()![this.config().id]}/end`, {
          assignedUntil: until,
        }),
      );
  }
  private perform(operation: ReturnType<CatalogApi['create']>) {
    const base = this.base();
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    operation
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (this.base() !== base) return;
          this.selected.set(data);
          this.editing.set(false);
          this.action.set(null);
          this.actionDirty.set(false);
          this.form().markAsPristine();
          this.message.set('Operación completada correctamente.');
          this.result.reload();
        },
        error: (e) => {
          if (this.base() === base) this.error.set(apiError(e));
        },
      });
  }
}
