import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Session } from '../../../../core/auth/session';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="brand" routerLink="/inicio" (click)="navigated.emit()"
      ><span class="brand-mark" aria-hidden="true">M<span>↗</span></span>
      @if (compact()) {
        <span class="sr-only">ManagerTruck, inicio</span>
      }
      @if (!compact()) {
        <span
          >Manager<span class="light">Truck</span
          ><small aria-hidden="true">TRANSPORTE & GESTIÓN</small></span
        >
      }
    </a>
    <nav aria-label="Navegación principal" [class.compact]="compact()">
      <p class="section-label">{{ compact() ? '···' : 'PRINCIPAL' }}</p>
      <a
        routerLink="/inicio"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        (click)="navigated.emit()"
        title="Inicio"
        ><span aria-hidden="true">◫</span><span class="label">Inicio</span></a
      >
      @if (session.user()) {
        <p class="section-label">{{ compact() ? '···' : 'OPERACIONES' }}</p>
        @if (session.canReadTrucks()) {
          <a
            routerLink="/camiones"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            (click)="navigated.emit()"
            title="Camiones"
            ><span aria-hidden="true">▰</span><span class="label">Camiones</span></a
          >
        }
        @for (item of operational; track item.path) {
          @if (session.canRead(item.endpoint)) {
            <a
              [routerLink]="['/gestion', item.path]"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="navigated.emit()"
              [title]="item.label"
              ><span aria-hidden="true">{{ item.icon }}</span
              ><span class="label">{{ item.label }}</span></a
            >
          }
        }
        @if (session.canWrite()) {
          <p class="section-label">{{ compact() ? '···' : 'GESTIÓN COMERCIAL' }}</p>
          @for (item of commercial; track item.path) {
            <a
              [routerLink]="['/gestion', item.path]"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="navigated.emit()"
              [title]="item.label"
              ><span aria-hidden="true">{{ item.icon }}</span
              ><span class="label">{{ item.label }}</span></a
            >
          }
        }
      }
      <p class="section-label">{{ compact() ? '···' : 'MI CUENTA' }}</p>
      @if (session.isAdmin()) {
        <a
          routerLink="/administracion"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          (click)="navigated.emit()"
          title="Administración"
          ><span aria-hidden="true">⚙</span><span class="label">Administración</span></a
        >
      }
      <a
        routerLink="/perfil"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        (click)="navigated.emit()"
        title="Mi perfil"
        ><span aria-hidden="true">◎</span><span class="label">Mi perfil</span></a
      >
    </nav>
    @if (!compact()) {
      <div class="nav-note">
        <span class="dot"></span> Tu operación, en un solo lugar.<small
          >ManagerTruck · Plataforma de gestión</small
        >
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #d0daeb;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 85px;
      padding: 1.4rem;
      color: white;
      font-size: 1.2rem;
      font-weight: 750;
      text-decoration: none;
      white-space: nowrap;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      color: white;
      font-size: 1.6rem;
      letter-spacing: -0.1em;
      flex-shrink: 0;
    }
    .brand-mark span {
      color: #73adff;
      font-size: 1.2rem;
    }
    .light {
      font-weight: 400;
    }
    small {
      display: block;
      font-size: 0.56rem;
      letter-spacing: 0.12em;
      color: #a8bad3;
      margin-top: 0.25rem;
    }
    nav {
      padding: 0.5rem 0.9rem;
      flex: 1;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.65rem 0.85rem;
      min-height: 44px;
      color: #c5d1e3;
      border-radius: 8px;
      margin: 0.18rem 0;
      text-decoration: none;
      font-weight: 500;
    }
    nav a > span:first-child {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
    }
    nav a:hover {
      background: #ffffff0d;
      color: white;
    }
    nav a.active {
      background: #2e5688;
      color: white;
      box-shadow: inset 3px 0 #80baff;
    }
    .section-label {
      font-size: 0.6rem;
      letter-spacing: 0.14em;
      color: #9cacc3;
      margin: 1.3rem 0.85rem 0.6rem;
    }
    .compact .label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    .compact a {
      justify-content: center;
      padding: 0.65rem;
    }
    .nav-note {
      margin: 1rem 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #ffffff1a;
      font-size: 0.7rem;
    }
    .nav-note small {
      letter-spacing: 0;
      font-size: 0.62rem;
    }
    .dot {
      display: inline-block;
      background: #63b99b;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 0.4rem;
    }
  `,
})
export class Navigation {
  readonly session = inject(Session);
  readonly compact = input(false);
  readonly navigated = output();
  readonly operational = [
    { path: 'socios', endpoint: 'partners', label: 'Socios', icon: '◇' },
    { path: 'conductores', endpoint: 'drivers', label: 'Conductores', icon: '♙' },
    { path: 'asignaciones', endpoint: 'assignments', label: 'Asignaciones', icon: '⇄' },
    { path: 'fletes', endpoint: 'freights', label: 'Fletes', icon: '▰' },
    { path: 'viajes', endpoint: 'journeys', label: 'Viajes', icon: '↗' },
  ];
  readonly commercial = [
    { path: 'clientes', label: 'Clientes', icon: '♧' },
    { path: 'contratos', label: 'Contratos', icon: '▤' },
    { path: 'contenedores', label: 'Contenedores', icon: '▥' },
    { path: 'auxiliares', label: 'Auxilio externo', icon: '⊕' },
  ];
}
