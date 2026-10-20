import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="badge"
    [class.positive]="value() === 'ACTIVE' || value() === true"
    [class.warning]="value() === 'MAINTENANCE'"
    >{{ label() }}</span
  >`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      background: #eef1f5;
      color: #44516a;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .positive {
      background: #e8f5ee;
      color: #166443;
    }
    .warning {
      background: #fff3d8;
      color: #815400;
    }
  `,
})
export class StatusBadge {
  readonly value = input<unknown>();
  readonly label = computed(
    () =>
      ({
        ACTIVE: 'Activo',
        INACTIVE: 'Inactivo',
        MAINTENANCE: 'Mantenimiento',
        PLANNED: 'Planificado',
        IN_PROGRESS: 'En curso',
        COMPLETED: 'Completado',
        CANCELLED: 'Cancelado',
        DRAFT: 'Borrador',
        PENDING: 'Pendiente',
        IN_TRANSIT: 'En tránsito',
        DELIVERED: 'Entregado',
        AVAILABLE: 'Disponible',
        LOADED: 'Cargado',
        true: 'Activo',
        false: 'Inactivo',
      })[String(this.value())] ?? String(this.value() ?? 'Sin estado'),
  );
}
