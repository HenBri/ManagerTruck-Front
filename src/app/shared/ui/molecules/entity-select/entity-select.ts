import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Session } from '../../../../core/auth/session';
import { LookupApi, LookupConfig, LookupRow } from '../../../../core/company-context/lookup-api';
import { apiError } from '../../../../core/http/api-error';

@Component({
  selector: 'app-entity-select',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label [for]="fieldId()">{{ label() }}</label>
      <select
        [id]="fieldId()"
        [formControl]="control()"
        (change)="selectionChanged()"
        [attr.aria-describedby]="fieldId() + '-help'"
        [attr.aria-invalid]="control().touched && control().invalid"
      >
        <option [ngValue]="null">Selecciona un registro</option>
        @if (control().value && !containsSelected()) {
          <option [ngValue]="control().value">Registro seleccionado #{{ control().value }}</option>
        }
        @for (row of rows(); track row[config().id]) {
          <option [ngValue]="row[config().id]" [disabled]="!eligible(row)">
            {{ display(row) }}
          </option>
        }
      </select>
      <small [id]="fieldId() + '-help'">{{
        result.isLoading()
          ? 'Cargando opciones…'
          : 'Registros disponibles. Los no elegibles están deshabilitados.'
      }}</small>
      @if (control().touched && control().invalid) {
        <small class="validation">Selecciona un registro válido.</small>
      }
      @if (result.error()) {
        <div class="error" role="alert">
          No se pudieron cargar las opciones de {{ label() }}. {{ errorText(result.error())
          }}<button type="button" class="button" (click)="result.reload()">
            Reintentar opciones
          </button>
        </div>
      }
      @if (result.hasValue() && result.value().totalPages > 1) {
        <div class="actions">
          <button
            type="button"
            class="button"
            [disabled]="page() === 0 || result.isLoading()"
            (click)="page.set(page() - 1)"
          >
            Opciones anteriores</button
          ><span class="help">{{ page() + 1 }} / {{ result.value().totalPages }}</span
          ><button
            type="button"
            class="button"
            [disabled]="page() + 1 >= result.value().totalPages || result.isLoading()"
            (click)="page.set(page() + 1)"
          >
            Más opciones
          </button>
        </div>
      }
      @if (result.hasValue() && !rows().length) {
        <small>No hay registros en esta página. Registra primero la entidad relacionada.</small>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .validation {
      color: #9c2434;
    }
  `,
})
export class EntitySelect {
  readonly config = input.required<LookupConfig>();
  readonly control = input.required<FormControl>();
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly selectionChange = output<LookupRow | null>();
  private readonly session = inject(Session);
  readonly page = signal(0);
  readonly result = inject(LookupApi).resource(() =>
    this.session.canRead(this.config().endpoint)
       ? `/api/${this.config().endpoint}?page=${this.page()}&size=20${this.config().query ?? ''}`
      : undefined,
  );
  readonly rows = computed(() =>
    this.result.hasValue() ? (this.result.value()[this.config().collection] as LookupRow[]) : [],
  );
  readonly errorText = apiError;
  constructor() {
    effect(() => {
      this.session.user();
      this.config();
      this.page.set(0);
    });
  }
  containsSelected() {
    return this.rows().some((row) => row[this.config().id] === this.control().value);
  }
  eligible(row: LookupRow) {
    const config = this.config();
    return (
      (!config.state || row[config.state] === (config.requiredState ?? 'ACTIVE')) &&
      !config.excludedStates?.includes(String(row['state'])) &&
      (!config.validUntil ||
        !row[config.validUntil] ||
        new Date(String(row[config.validUntil])).getTime() >= Date.now()) &&
      (!config.kind || row[config.kind.key] === config.kind.value)
    );
  }
  display(row: LookupRow) {
    return `${this.config()
      .labels.map((key) => row[key])
      .filter((value) => value !== null && value !== undefined && value !== '')
      .join(' · ')} · #${row[this.config().id]}`;
  }
  selectionChanged() {
    const id = this.control().value;
    const row = this.rows().find(
      (candidate) =>
        candidate[this.config().id] === id ||
        String(candidate[this.config().id]) === String(id),
    );
    this.selectionChange.emit(row ?? null);
  }
}
