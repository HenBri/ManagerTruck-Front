import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="panel empty">
    <p class="eyebrow">ERROR 404</p>
    <h1>Esta ruta no está disponible</h1>
    <p class="muted">Verifica la dirección o vuelve a tu espacio de trabajo.</p>
    <a class="button primary" routerLink="/inicio">Volver al inicio</a>
  </section>`,
})
export class NotFound {}
