import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Session } from '../../../../core/auth/session';
import { CatalogApi } from '../../../catalog/data-access/catalog-api';
import { PageHeading } from '../../../../shared/ui/molecules/page-heading/page-heading';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PageHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-heading
      [title]="'Hola, ' + session.user()?.name"
      description="Tu operación empieza aquí. Accede a la información de tu empresa y continúa donde lo dejaste."
      eyebrow="RESUMEN / INICIO"
    />
    <section class="welcome">
      <div>
        <span class="welcome-tag">TU CENTRO DE OPERACIONES</span>
        <h2>Todo conectado.<br />Siempre en movimiento.</h2>
        <p>Gestiona personas, flota y viajes desde un solo espacio de trabajo.</p>
        @if (session.canReadTrucks()) {
          <a routerLink="/camiones" class="button"
            >Explorar mi flota <span aria-hidden="true">→</span></a
          >
        }
      </div>
      <div class="welcome-art" aria-hidden="true">
        <span>↗</span>
        <div class="road"></div>
        <strong>MT</strong>
      </div>
    </section>
    @if (!session.companyId()) {
      <section class="panel empty">
        <h2>Tu cuenta aún no tiene una empresa activa</h2>
        <p class="muted">
          Solicita a un administrador una membresía y un rol para comenzar a operar.
        </p>
        <a class="button" routerLink="/perfil">Ver mi perfil</a>
      </section>
    } @else {
      <div class="section-title">
        <h2>Una mirada a tu operación</h2>
        <span class="muted">Empresa #{{ session.companyId() }} · Datos de la API</span>
      </div>
      <section class="metrics" aria-label="Totales de registros accesibles">
        @for (metric of metrics; track metric.label) {
          @if (metric.visible()) {
            <a class="panel metric" [routerLink]="metric.link"
              ><div class="metric-top">
                <span>{{ metric.label }}</span
                ><span class="metric-icon" aria-hidden="true">{{ metric.icon }}</span>
              </div>
              <strong>{{
                metric.resource.isLoading()
                  ? '…'
                  : metric.resource.hasValue()
                    ? metric.resource.value().totalElements
                    : '—'
              }}</strong
              ><small>{{
                metric.resource.error()
                  ? 'No disponible. Abre el módulo para reintentar.'
                  : 'Registros accesibles para tu cuenta'
              }}</small></a
            >
          }
        }
      </section>
      <div class="dashboard-bottom">
        <section class="panel">
          <div class="section-title">
            <h2>Accesos rápidos</h2>
            <span class="muted">Tu día a día</span>
          </div>
          <div class="quick-links">
            @if (session.canReadTrucks()) {
              <a routerLink="/camiones"
                ><span class="quick-icon">▰</span>
                <div>
                  <strong>Gestionar camiones</strong><small>Consulta la flota y su estado</small>
                </div>
                <span>→</span></a
              >
            }
            <a routerLink="/gestion/viajes"
              ><span class="quick-icon">↗</span>
              <div><strong>Consultar viajes</strong><small>Origen, destino y ejecución</small></div>
              <span>→</span></a
            ><a routerLink="/gestion/conductores"
              ><span class="quick-icon">♙</span>
              <div>
                <strong>Equipo de conductores</strong><small>Datos de contacto y licencias</small>
              </div>
              <span>→</span></a
            >
          </div>
        </section>
        <section class="panel workspace-card">
          <p class="eyebrow">MI ESPACIO</p>
          <h2>La empresa correcta,<br />los datos correctos.</h2>
          <p class="muted">
            Puedes cambiar de empresa desde el encabezado. Cada espacio tiene sus propios registros
            y permisos.
          </p>
          <div class="role-list">
            @for (role of session.roles(); track role) {
              <span>{{ role }}</span>
            }
          </div>
          <a routerLink="/perfil">Consultar mi perfil →</a>
        </section>
      </div>
    }
  `,
  styles: `
    .welcome {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(115deg, #163356, #224f81);
      border-radius: 16px;
      padding: 2rem 2.5rem;
      color: white;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .welcome-tag {
      font-size: 0.6rem;
      letter-spacing: 0.16em;
      color: #b5d0f6;
      font-weight: 700;
    }
    .welcome h2 {
      font-size: 1.85rem;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin: 0.7rem 0;
    }
    .welcome p {
      font-size: 0.8rem;
      color: #c2d4eb;
      max-width: 340px;
    }
    .welcome .button {
      margin-top: 0.5rem;
      font-size: 0.8rem;
    }
    .welcome-art {
      position: relative;
      width: 220px;
      height: 180px;
      flex-shrink: 0;
    }
    .welcome-art > span {
      position: absolute;
      right: 0;
      top: -30px;
      font-size: 12rem;
      line-height: 1;
      color: #ffffff12;
    }
    .welcome-art strong {
      position: absolute;
      top: 55px;
      left: 45px;
      font-size: 3rem;
      color: #c5ddfa;
      letter-spacing: -0.1em;
    }
    .road {
      position: absolute;
      width: 220px;
      height: 85px;
      border: 2px dashed #7197bd;
      transform: rotate(-15deg);
      border-radius: 25px;
      top: 60px;
    }
    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .section-title h2 {
      margin: 0;
    }
    .section-title > span {
      font-size: 0.72rem;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }
    .metric {
      color: var(--ink);
      text-decoration: none;
      padding: 1.25rem;
    }
    .metric:hover {
      border-color: #93add6;
      box-shadow: 0 5px 20px #1c3b6810;
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .metric-icon {
      background: #edf3fe;
      color: #3463a7;
      padding: 0.4rem 0.65rem;
      border-radius: 8px;
    }
    .metric > strong {
      display: block;
      font-size: 2.15rem;
      letter-spacing: -0.05em;
      margin: 0.5rem 0;
    }
    .metric > small {
      font-size: 0.65rem;
      color: var(--muted);
    }
    .dashboard-bottom {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.25rem;
    }
    .quick-links a {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: var(--ink);
      padding: 1rem 0;
      text-decoration: none;
      border-bottom: 1px solid var(--line);
    }
    .quick-links a:last-child {
      border: 0;
    }
    .quick-links a:hover strong {
      color: var(--primary);
    }
    .quick-links a > span:last-child {
      margin-left: auto;
      color: var(--primary);
    }
    .quick-icon {
      display: grid;
      place-items: center;
      background: var(--canvas);
      color: #38618d;
      border-radius: 10px;
      width: 42px;
      height: 42px;
      font-size: 1.3rem;
    }
    .quick-links strong,
    .quick-links small {
      display: block;
    }
    .quick-links strong {
      font-size: 0.85rem;
    }
    .quick-links small {
      color: var(--muted);
      font-size: 0.72rem;
      margin-top: 0.2rem;
    }
    .workspace-card h2 {
      margin-top: 0.8rem;
      line-height: 1.4;
    }
    .workspace-card > p:not(.eyebrow) {
      font-size: 0.8rem;
    }
    .role-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin: 1.2rem 0;
    }
    .role-list span {
      background: #edf3fc;
      color: #375b8d;
      border-radius: 6px;
      padding: 0.3rem 0.6rem;
      font-size: 0.65rem;
    }
    .workspace-card > a {
      font-size: 0.8rem;
    }
    @media (max-width: 700px) {
      .welcome {
        padding: 1.5rem;
      }
      .welcome h2 {
        font-size: 1.6rem;
      }
      .welcome-art {
        display: none;
      }
      .dashboard-bottom {
        grid-template-columns: 1fr;
      }
      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .metric {
        padding: 1rem;
      }
      .metric-top {
        align-items: flex-start;
      }
      .metric-icon {
        display: none;
      }
    }
    @media (max-width: 360px) {
      .metrics {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Dashboard {
  readonly session = inject(Session);
  private readonly api = inject(CatalogApi);
  private total(endpoint: string, allowed = () => true) {
    return this.api.list(() =>
      this.session.companyId() && allowed()
        ? `/api/companies/${this.session.companyId()}/${endpoint}?page=0&size=1`
        : undefined,
    );
  }
  readonly metrics = [
    {
      label: 'Camiones',
      icon: '▰',
      link: '/camiones',
      visible: () => this.session.canReadTrucks(),
      resource: this.total('trucks', () => this.session.canReadTrucks()),
    },
    {
      label: 'Conductores',
      icon: '♙',
      link: '/gestion/conductores',
      visible: () => true,
      resource: this.total('drivers'),
    },
    {
      label: 'Viajes',
      icon: '↗',
      link: '/gestion/viajes',
      visible: () => true,
      resource: this.total('journeys'),
    },
    {
      label: 'Clientes',
      icon: '♧',
      link: '/gestion/clientes',
      visible: () => this.session.canWrite(),
      resource: this.total('clients', () => this.session.canWrite()),
    },
  ];
}
