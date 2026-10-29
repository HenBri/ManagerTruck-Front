import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';

@Component({
  selector: 'app-administration',
  imports: [RouterLink, PageHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-heading
      title="Administración"
      eyebrow="SISTEMA"
      description="Gestiona cuentas y el catálogo de roles de ManagerTruck."
    />
    <section class="panel stack">
      <h2>Acceso al sistema</h2>
      <div class="actions">
        <a class="button primary" routerLink="/gestion/usuarios">Usuarios</a>
        <a class="button" routerLink="/gestion/roles">Roles</a>
      </div>
      <p class="muted">
        La asignación de roles a usuarios requiere soporte del backend; el catálogo permite crear y
        editar sus definiciones.
      </p>
    </section>
  `,
})
export class Administration {}
