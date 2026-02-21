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
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
];
