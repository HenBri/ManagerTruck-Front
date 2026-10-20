import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth';
import { pendingChangesGuard } from './core/auth/pending-changes';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Acceso · ManagerTruck',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/ui/templates/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · ManagerTruck',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'camiones',
        canDeactivate: [pendingChangesGuard],
        title: 'Camiones · ManagerTruck',
        loadComponent: () => import('./features/fleet/pages/trucks/trucks').then((m) => m.Trucks),
      },
      {
        path: 'perfil',
        canDeactivate: [pendingChangesGuard],
        title: 'Mi perfil · ManagerTruck',
        loadComponent: () =>
          import('./features/account/pages/profile/profile').then((m) => m.Profile),
      },
      ...[
        'socios',
        'conductores',
        'asignaciones',
        'viajes',
        'clientes',
        'contratos',
        'cargas',
        'contenedores',
        'auxiliares',
      ].map((module) => ({
        path: `gestion/${module}`,
        data: { module },
        title: `${module.charAt(0).toUpperCase() + module.slice(1)} · ManagerTruck`,
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('./features/catalog/pages/catalog/catalog').then((m) => m.Catalog),
      })),
      {
        path: 'administracion',
        title: 'Administración · ManagerTruck',
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('./features/administration/pages/administration/administration').then(
            (m) => m.Administration,
          ),
      },
      {
        path: '**',
        title: 'Página no encontrada · ManagerTruck',
        loadComponent: () =>
          import('./features/errors/pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
