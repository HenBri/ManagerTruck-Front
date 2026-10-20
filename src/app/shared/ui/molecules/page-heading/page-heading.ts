import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="heading">
    <div>
      <p class="eyebrow">{{ eyebrow() }}</p>
      <h1>{{ title() }}</h1>
      <p class="muted">{{ description() }}</p>
    </div>
    <div><ng-content /></div>
  </div>`,
  styles: `
    .heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }
    h1 {
      margin: 0.3rem 0 0.65rem;
      font-size: clamp(1.7rem, 3vw, 2.15rem);
      letter-spacing: -0.04em;
    }
    .muted {
      margin: 0;
      max-width: 65ch;
    }
    @media (max-width: 600px) {
      .heading {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `,
})
export class PageHeading {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly eyebrow = input('ESPACIO DE TRABAJO');
}
