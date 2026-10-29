import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
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
import { LookupRow } from '../../../../core/company-context/lookup-api';
import { PendingChanges } from '../../../../core/auth/pending-changes';
import { journeyStep, journeyTargets } from '../../../journeys/models/journey-policy';
import { FormModal } from '../../../../shared/ui/molecules/form-modal/form-modal.component';
import { toApiDateTime, toLocalDateTime } from '../../../../core/http/form-values';

@Component({
  selector: 'app-catalog',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    StatusBadge,
    EntitySelect,
    EntityLabel,
    FormModal,
    RouterLink,
  ],
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
  readonly allowed = computed(() =>
    this.config()?.adminOnly
      ? this.session.isAdmin()
      : this.session.canRead(this.config()?.endpoint),
  );
  readonly canWrite = computed(
    () =>
      this.allowed() &&
      (this.config()?.adminOnly ? this.session.isAdmin() : this.session.canWrite()),
  );
  readonly canEdit = computed(
    () =>
      this.canWrite() &&
      !this.config()?.noEdit &&
      (!['viajes', 'fletes'].includes(this.module()) || this.selected()?.['state'] === 'PENDIENTE'),
  );
  readonly assignment = httpResource<{ driverId: number }>(() =>
    this.module() === 'viajes' &&
    this.selected()?.['assignmentId'] &&
    this.session.driverId() !== null
      ? `/api/assignments/${this.selected()!['assignmentId']}`
      : undefined,
  );
  readonly assignedDriver = computed(
    () =>
      this.assignment.hasValue() && this.assignment.value().driverId === this.session.driverId(),
  );
  readonly canChangeStatus = computed(
    () =>
      (this.canWrite() &&
        !(
          this.module() === 'usuarios' &&
          this.selected()?.['userId'] === this.session.user()?.userId
        )) ||
      (this.module() === 'viajes' && this.assignedDriver()),
  );
  readonly availableStatuses = computed(() => {
    if (!['viajes', 'fletes'].includes(this.module()))
      return (this.config()?.statuses ?? []).filter(
        (s) => s !== this.selected()?.[this.config().state!],
      );
    return journeyTargets(this.selected()?.['state'], this.canWrite(), this.assignedDriver());
  });
  readonly page = signal(0);
  readonly filters = computed(() => filterFields[this.module()] ?? []);
  readonly filterForm = new FormGroup<Record<string, FormControl>>({});
  readonly query = signal('');
  readonly descending = signal(true);
  readonly base = computed(() => `/api/${this.config()?.endpoint}`);
  readonly result = this.api.list(() =>
    this.allowed() && this.config()
      ? this.config().unpaged
        ? this.base()
        : `${this.base()}?page=${this.page()}&size=10&sort=${this.config().id},${this.descending() ? 'desc' : 'asc'}${this.query()}`
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
      (f) =>
        !f.readOnly &&
        (!this.selected() || !f.createOnly) &&
        (!!this.selected() || !f.editOnly) &&
        (!f.only || f.only === this.mode()),
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
  private relatedRows: Record<string, LookupRow | null> = {};
  readonly relationLabel = (field: Field) =>
    field.label
      .replace(/^ID (del |de la |de |del|de)/, '')
       .replace(/^ID /, '')
       .replace(/^./, (c) => c.toUpperCase()) + (field.required ? ' *' : '');
  relationSelected(field: Field, row: LookupRow | null) {
    this.relatedRows[field.key] = row;
    if (this.selected() || !row) return;
    if (this.module() === 'fletes') {
      this.syncFreightFields();
      return;
    }
    if (this.module() !== 'contenedores' || field.key !== 'chargeId') return;
    const values: Record<string, unknown> = {};
    if (row['chargeDescription'] || row['goodsDescription'])
      values['containerDescription'] = [row['chargeDescription'], row['goodsDescription']]
        .filter((value) => value !== null && value !== undefined && value !== '')
        .join(' — ');
    if (row['chargeType']) values['containerType'] = row['chargeType'];
    if (row['cargoReference']) values['customsReference'] = row['cargoReference'];
    this.form().patchValue(values);
  }
  private syncFreightFields() {
    const contract = this.relatedRows['contractId'];
    const container = this.relatedRows['containerId'];
    const values: Record<string, unknown> = {};
    if (contract) {
      if (contract['contractCode']) values['freightCode'] = String(contract['contractCode']).slice(0, 40);
      if (contract['contractAmount'] !== null && contract['contractAmount'] !== undefined)
        values['freightAmount'] = contract['contractAmount'];
      if (contract['expectedStartDate'])
        values['scheduledDeparture'] = toLocalDateTime(contract['expectedStartDate']);
      if (contract['expectedDeliveryDate'])
        values['scheduledArrival'] = toLocalDateTime(contract['expectedDeliveryDate']);
    }
    const descriptions = [contract?.['contractDescription'], container?.['containerDescription']]
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map(String);
    if (descriptions.length) values['freightDescription'] = descriptions.join(' — ');
    this.form().patchValue(values);
  }
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
    effect(() => {
      this.module();
      this.session.user();
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
      const validators: ValidatorFn[] = [];
      if (field.required) {
        validators.push(Validators.required);
        if (!field.type || field.type === 'text') validators.push(Validators.pattern(/\S/));
      }
      if (field.max) validators.push(Validators.maxLength(field.max));
      if (field.minLength) validators.push(Validators.minLength(field.minLength));
      if (field.options)
        validators.push((control) =>
          control.value && !field.options!.includes(control.value) ? { option: true } : null,
        );
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.type === 'email') validators.push(Validators.email);
      if (field.type === 'date' || field.type === 'datetime-local')
        validators.push((control) =>
          !control.value || Number.isFinite(new Date(control.value).getTime())
            ? null
            : { date: true },
        );
      if (field.type === 'number') {
        validators.push(
          Validators.pattern(
            field.step === '0.001'
              ? /^-?\d+(\.\d{1,3})?$/
              : field.step === '0.01'
                ? /^-?\d+(\.\d{1,2})?$/
                : /^\d+$/,
          ),
        );
        validators.push(
          Validators.max(
            field.maximum ??
              (field.step === '0.001'
                ? 999999999.999
                : field.step === '0.01'
                  ? 9999999999999.99
                  : Number.MAX_SAFE_INTEGER),
          ),
        );
      }
      controls[field.key] = new FormControl(
        field.type === 'datetime-local'
          ? toLocalDateTime(data[field.key])
          : (data[field.key] ?? (field.type === 'checkbox' ? false : null)),
        validators,
      );
    }
    this.form.set(new FormGroup(controls));
  }
  create() {
    if (!this.canWrite() || this.config()?.noCreate) return;
    this.relatedRows = {};
    this.step.set(0);
    this.selected.set(null);
    this.mode.set('PARTNER');
    this.setup(this.fields());
    this.editing.set(true);
    this.error.set('');
    this.message.set('');
  }
  edit() {
    if (!this.canEdit()) return;
    this.mode.set(this.selected()?.['auxiliaryProviderId'] ? 'AUXILIARY' : 'PARTNER');
    this.setup(this.fields(), this.selected()!);
    this.editing.set(true);
    this.error.set('');
  }
  modeChange(mode: string) {
    if (this.selected()) return;
    const data = this.form().getRawValue();
    this.mode.set(mode);
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
    if (this.busy() || !this.canWrite() || (this.selected() && !this.canEdit())) return;
    if (this.wizard() && this.step() < 2) {
      this.nextStep();
      return;
    }
    this.form().markAllAsTouched();
    if (this.form().invalid) return;
    const body: RecordData = {};
    for (const field of this.fields()) {
      const value = this.form().get(field.key)?.value;
      body[field.key] =
        field.type === 'password'
          ? value || null
          : typeof value === 'string'
            ? value.trim() || null
            : (value ?? null);
      if (field.type === 'datetime-local' && value) body[field.key] = toApiDateTime(value);
      if (field.type === 'number' && value !== null && value !== '')
        body[field.key] = Number(value);
    }
    if (
      ['socios', 'conductores'].includes(this.module()) &&
      !this.selected() &&
      !body['personId'] &&
      (!body['firstName'] || !body['lastName'] || !body['email'])
    ) {
      this.error.set(
        'Para crear una persona completa nombres, apellido y correo; o indica un ID de persona existente.',
      );
      return;
    }
    if (this.module() === 'fletes') {
      body[this.mode() === 'PARTNER' ? 'auxiliaryProviderId' : 'truckId'] = null;
      if (this.mode() === 'PARTNER') body['auxiliaryTruckPlate'] = null;
    }
    if (this.module() === 'contratos' && !this.selected()) {
      (body as Record<string, unknown>)['charges'] = [
        {
          cargoReference: body['cargoReference'],
          chargeType: body['chargeType'],
          chargeDescription: body['chargeDescription'],
          goodsDescription: body['goodsDescription'],
          hazardousGoods: body['hazardousGoods'],
          handlingInstructions: body['handlingInstructions'],
        },
      ];
      for (const key of [
        'cargoReference',
        'chargeType',
        'chargeDescription',
        'goodsDescription',
        'hazardousGoods',
        'handlingInstructions',
      ]) delete body[key];
    }
    for (const [start, end] of [
      ['scheduledDeparture', 'scheduledArrival'],
      ['plannedStartDate', 'plannedEndDate'],
      ['expectedStartDate', 'expectedDeliveryDate'],
      ['actualDeparture', 'actualArrival'],
    ]) {
      if (body[start] && body[end] && new Date(String(body[end])) < new Date(String(body[start]))) {
        this.error.set('La fecha final no puede ser anterior a la inicial.');
        return;
      }
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
        : this.api.create(this.config().createEndpoint ?? this.base(), body),
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
    const body: RecordData = { [this.config().statusKey ?? 'state']: value };
    this.perform(
      this.api.update(`${this.base()}/${this.selected()![this.config().id]}/status`, body),
    );
  }
  endAssignment(until: string) {
    if (this.busy() || !this.canWrite() || !this.selected() || this.selected()!['assignedUntil'])
      return;
    if (!until) {
      this.error.set('Introduce una fecha de finalización.');
      return;
    }
    if (new Date(until) <= new Date(String(this.selected()!['assignedFrom']))) {
      this.error.set('El fin debe ser posterior al inicio.');
      return;
    }
    if (window.confirm('¿Confirmas finalizar esta asignación?'))
      this.perform(
        this.api.update(`${this.base()}/${this.selected()![this.config().id]}/end`, {
          assignedUntil: toApiDateTime(until),
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
