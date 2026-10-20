import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-form-modal',
  imports: [DialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template>
      <section class="modal" [attr.aria-busy]="busy()">
        <header>
          <h2>{{ title() }}</h2>
          <button
            type="button"
            class="button"
            aria-label="Cerrar formulario"
            [disabled]="busy()"
            (click)="requestClose()"
          >
            ✕
          </button>
        </header>
        <div class="content"><ng-content /></div>
      </section>
    </ng-template>
  `,
  styles: `
    .modal {
      background: var(--canvas);
      color: var(--ink);
      border-radius: 16px;
      box-shadow: 0 24px 80px #0005;
      max-height: calc(100dvh - 32px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      margin: 0;
    }
    .content {
      padding: 1.5rem;
      overflow: auto;
    }
    @media (max-width: 600px) {
      header,
      .content {
        padding: 1rem;
      }
    }
  `,
})
export class FormModal {
  readonly title = input.required<string>();
  readonly busy = input(false);
  readonly closeRequested = output<void>();
  private readonly template = viewChild.required(TemplateRef);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const ref = this.dialog.open(this.template(), {
        ariaLabel: this.title(),
        disableClose: true,
        closeOnNavigation: false,
        width: '800px',
        maxWidth: 'calc(100vw - 24px)',
        autoFocus: 'first-tabbable',
      });
      ref.backdropClick
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.requestClose());
      ref.keydownEvents.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.requestClose();
        }
      });
      this.destroyRef.onDestroy(() => ref.close());
    });
  }

  requestClose() {
    if (!this.busy()) this.closeRequested.emit();
  }
}
