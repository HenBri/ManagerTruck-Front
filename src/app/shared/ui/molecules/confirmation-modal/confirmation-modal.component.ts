import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormModal } from '../form-modal/form-modal.component';

@Component({
  selector: 'app-confirmation-modal',
  imports: [FormModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal [title]="title()" [busy]="busy()" (closeRequested)="cancelled.emit()">
      <p>{{ message() }}</p>
      <div class="actions">
        <button class="button" type="button" [disabled]="busy()" (click)="cancelled.emit()">
          Cancelar
        </button>
        <button class="button primary" type="button" [disabled]="busy()" (click)="confirmed.emit()">
          Confirmar
        </button>
      </div>
    </app-form-modal>
  `,
})
export class ConfirmationModal {
  readonly title = input('Confirmar acción');
  readonly message = input.required<string>();
  readonly busy = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
