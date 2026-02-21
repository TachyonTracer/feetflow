import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { AppShell } from './layouts/app-shell/app-shell';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'signup', redirectTo: '/auth/signup', pathMatch: 'full' },

  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./layouts/dashboard/dashboard.component').then((m) => m.Dashboard),
      },
      {
        path: 'register-vehicles',
        loadComponent: () =>
          import('./layouts/view-registered-vehicles/view-registered-vehicles').then(
            (m) => m.VehicleRegister,
          ),
      },
      {
        path: 'view-trips',
        loadComponent: () =>
          import('./layouts/vehicle-trip-dispatcher/vehicle-trip-dispatcher').then(
            (m) => m.VehicleTripDispatcher,
          ),
      },
      {
        path: 'service-log',
        loadComponent: () =>
          import('./layouts/view-service-log/view-service-log').then((m) => m.ViewServiceLog),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./layouts/view-expenses/view-expenses').then((m) => m.ViewExpenses),
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./layouts/view-driver-performance/view-driver-performance').then(
            (m) => m.ViewDriverPerformance,
          ),
      },
      {
        path: 'financials',
        loadComponent: () =>
          import('./layouts/view-financial-reports/view-financial-reports').then(
            (m) => m.ViewFinancialReports,
          ),
      },
      {
        path: 'users',
        loadComponent: () => import('./layouts/users/users').then((m) => m.Users),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
