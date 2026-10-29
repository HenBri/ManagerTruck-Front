import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LookupApi, LookupConfig } from '../../../../core/company-context/lookup-api';
import { Session } from '../../../../core/auth/session';

@Component({
  selector: 'app-entity-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ text() }}</span>`,
  styles: `
    :host {
      display: inline;
    }
  `,
})
export class EntityLabel {
  readonly config = input.required<LookupConfig>();
  readonly id = input<unknown>();
  private readonly session = inject(Session);
  readonly result = inject(LookupApi).resource(() =>
    this.id() &&
    this.session.canRead(this.config().endpoint) &&
    this.config().endpoint !== 'users' &&
    this.config().supportsDetail !== false
      ? `/api/${this.config().endpoint}/${this.id()}`
      : undefined,
  );
  readonly text = computed(() => {
    if (!this.id()) return '—';
    const record = this.result.hasValue() ? this.result.value() : undefined;
    const name = record
      ? this.config()
          .labels.map((key) => record[key])
          .filter((value) => value !== undefined && value !== null && value !== '')
          .join(' · ')
      : '';
    return name ? `${name} · #${this.id()}` : `#${this.id()}`;
  });
}
