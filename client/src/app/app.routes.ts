import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'signup', redirectTo: '/auth/signup', pathMatch: 'full' },
  {
    path: 'users',
    loadComponent: () => import('./layouts/users/users').then((m) => m.Users),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./layouts/dashboard/dashboard.component').then((m) => m.Dashboard),
  },
  {
    path: 'register',
    loadComponent: () => import('./layouts/view-registered-vehicles/view-registered-vehicles').then((m) => m.VehicleRegister),
  },

  {
    path: 'dispatcher',
    loadComponent: () => import('./layouts/vehicle-trip-dispatcher/vehicle-trip-dispatcher').then((m) => m.VehicleTripDispatcher),
  },
  {
    path: 'service-log',
    loadComponent: () => import('./layouts/view-service-log/view-service-log').then((m) => m.ViewServiceLog),
  },
  {
    path: 'expenses',
    loadComponent: () => import('./layouts/view-expenses/view-expenses').then((m) => m.ViewExpenses),
  },

  { path: '', redirectTo: '/auth', pathMatch: 'full' },
];