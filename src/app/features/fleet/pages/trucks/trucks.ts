import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { apiError } from '../../../../core/http/api-error';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';
import { StatusBadge } from '../../../../shared/ui/atoms/status-badge/status-badge';
import { FleetApi, Truck, TruckWrite } from '../../data-access/fleet-api';
import { PendingChanges } from '../../../../core/auth/pending-changes';
import { FormModal } from '../../../../shared/ui/molecules/form-modal/form-modal.component';

@Component({
  selector: 'app-trucks',
  imports: [ReactiveFormsModule, PageHeading, StatusBadge, FormModal],
  templateUrl: './trucks.html',
  styleUrl: './trucks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trucks {
  readonly session = inject(Session);
  private readonly api = inject(FleetApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly page = signal(0);
  readonly trucks = this.api.list(this.page, this.session.canReadTrucks);
  readonly items = computed(() => (this.trucks.hasValue() ? this.trucks.value().trucks : []));
  readonly selected = signal<Truck | null>(null);
  readonly editing = signal(false);
  readonly statusOpen = signal(false);
  readonly statusDirty = signal(false);
  openStatus() {
    this.error.set('');
    this.statusDirty.set(false);
    this.statusOpen.set(true);
  }
  closeStatus() {
    if (
      this.busy() ||
      (this.statusDirty() && !window.confirm('¿Descartar los cambios sin guardar?'))
    )
      return;
    this.statusOpen.set(false);
    this.statusDirty.set(false);
    this.error.set('');
  }
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly partnerPage = signal(0);
  readonly partners = httpResource<{
    partners: { partnerId: number; firstName: string; lastName: string; state: 'ACTIVE' | 'INACTIVE' }[];
    totalPages: number;
  }>(() =>
    this.editing() && !this.selected() && this.session.canWrite()
      ? `/api/partners?page=${this.partnerPage()}&size=20`
      : undefined,
  );
  readonly errorText = apiError;
  readonly form = inject(FormBuilder).group({
    ownerPartnerId: [null as number | null, [Validators.required, Validators.min(1)]],
    truckBoard: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/\S/)]],
    truckBrand: ['', Validators.maxLength(50)],
    truckModel: ['', Validators.maxLength(50)],
    truckChassis: ['', Validators.maxLength(50)],
    truckColor: ['', Validators.maxLength(30)],
    truckType: ['', Validators.maxLength(50)],
    chassisPlate: ['', Validators.maxLength(20)],
    insuranceExpiration: [''],
    technicalInspectionExpiration: [''],
    truckEmptyWeightKg: [
      null as number | null,
      [Validators.min(0), Validators.max(999999999.999), Validators.pattern(/^\d+(\.\d{1,3})?$/)],
    ],
    trailerEmptyWeightKg: [
      null as number | null,
      [Validators.min(0), Validators.max(999999999.999), Validators.pattern(/^\d+(\.\d{1,3})?$/)],
    ],
    maxGrossWeightKg: [
      null as number | null,
      [Validators.min(0), Validators.max(999999999.999), Validators.pattern(/^\d+(\.\d{1,3})?$/)],
    ],
    truckYear: [
      null as number | null,
      [Validators.min(0), Validators.max(65535), Validators.pattern(/^\d+$/)],
    ],
    truckCapacity: [
      null as number | null,
      [Validators.min(0), Validators.max(999999999.999), Validators.pattern(/^\d+(\.\d{1,3})?$/)],
    ],
  });
  readonly textFields = [
    { key: 'truckBoard', label: 'Placa', max: 20 },
    { key: 'truckBrand', label: 'Marca', max: 50 },
    { key: 'truckModel', label: 'Modelo', max: 50 },
    { key: 'truckChassis', label: 'Chasis', max: 50 },
    { key: 'truckColor', label: 'Color', max: 30 },
    { key: 'truckType', label: 'Tipo de camión', max: 50 },
    { key: 'chassisPlate', label: 'Placa de remolque', max: 20 },
  ];
  readonly extraFields = [
    { key: 'truckEmptyWeightKg', label: 'Peso vacío del camión (kg)', type: 'number' },
    { key: 'trailerEmptyWeightKg', label: 'Peso vacío del remolque (kg)', type: 'number' },
    { key: 'maxGrossWeightKg', label: 'Peso bruto máximo (kg)', type: 'number' },
    { key: 'insuranceExpiration', label: 'Vencimiento del seguro', type: 'date' },
    {
      key: 'technicalInspectionExpiration',
      label: 'Vencimiento de inspección técnica',
      type: 'date',
    },
  ] as const;
  constructor() {
    this.destroyRef.onDestroy(
      inject(PendingChanges).register(
        () => (this.editing() && this.form.dirty) || this.statusDirty() || this.busy(),
      ),
    );
    effect(() => {
      this.session.user();
      this.page.set(0);
      this.selected.set(null);
      this.editing.set(false);
      this.statusOpen.set(false);
      this.statusDirty.set(false);
      this.error.set('');
      this.success.set('');
      this.form.reset();
    });
  }
  create() {
    this.selected.set(null);
    this.form.reset();
    this.partnerPage.set(0);
    this.editing.set(true);
    this.error.set('');
    this.success.set('');
  }
  detail(truck: Truck) {
    if (this.busy()) return;
    const user = this.session.user();
    this.busy.set(true);
    this.error.set('');
    this.editing.set(false);
    this.api
      .detail(truck.truckId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (detail) => {
          if (this.session.user() === user) this.selected.set(detail);
        },
        error: (error) => {
          if (this.session.user() === user) this.error.set(apiError(error));
        },
      });
  }
  edit() {
    this.form.reset(this.selected()!);
    this.editing.set(true);
    this.error.set('');
  }
  cancel() {
    if (this.busy()) return;
    if (this.form.dirty && !window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos?'))
      return;
    this.editing.set(false);
    this.form.reset();
    this.error.set('');
  }
  save() {
    if (this.busy() || !this.session.canWrite()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const user = this.session.user();
    const value = this.form.getRawValue();
    const body: TruckWrite = {
      truckEmptyWeightKg: value.truckEmptyWeightKg,
      trailerEmptyWeightKg: value.trailerEmptyWeightKg,
      maxGrossWeightKg: value.maxGrossWeightKg,
      truckType: value.truckType?.trim() || null,
      chassisPlate: value.chassisPlate?.trim() || null,
      insuranceExpiration: value.insuranceExpiration || null,
      technicalInspectionExpiration: value.technicalInspectionExpiration || null,
      truckBoard: value.truckBoard!.trim(),
      truckBrand: value.truckBrand?.trim() || null,
      truckModel: value.truckModel?.trim() || null,
      truckChassis: value.truckChassis?.trim() || null,
      truckColor: value.truckColor?.trim() || null,
      truckYear: value.truckYear,
      truckCapacity: value.truckCapacity,
    };
    const current = this.selected();
    this.busy.set(true);
    this.error.set('');
    const operation = current
      ? this.api.update(current.truckId, body)
      : this.api.create({ ...body, ownerPartnerId: value.ownerPartnerId! });
    operation
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (truck) => {
          if (this.session.user() !== user) return;
          this.selected.set(truck);
          this.editing.set(false);
          this.form.markAsPristine();
          this.success.set('Camión guardado correctamente.');
          this.trucks.reload();
        },
        error: (error) => {
          if (this.session.user() === user) this.error.set(apiError(error));
        },
      });
  }
  changeStatus(state: string) {
    const truck = this.selected();
    if (
      !truck ||
      this.busy() ||
      !this.session.canWrite() ||
      state === truck.state ||
      !['ACTIVE', 'MAINTENANCE', 'INACTIVE'].includes(state)
    )
      return;
    if (!window.confirm(`¿Confirmas cambiar el estado de ${truck.truckBoard}?`)) return;
    const user = this.session.user();
    this.busy.set(true);
    this.error.set('');
    this.api
      .status(truck.truckId, state as Truck['state'])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (updated) => {
          if (this.session.user() !== user) return;
          this.selected.set(updated);
          this.statusOpen.set(false);
          this.statusDirty.set(false);
          this.success.set('Estado actualizado.');
          this.trucks.reload();
        },
        error: (error) => {
          if (this.session.user() === user) this.error.set(apiError(error));
        },
      });
  }
}
