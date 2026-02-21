import { Routes } from '@angular/router';
import { CustomAuthComponent } from './auth.component';
import { CustomLoginComponent } from './login/login.component';
import { CustomLogoutComponent } from './logout/logout.component';
import { CustomResetPasswordComponent } from './reset-password/reset-password.component';
import { CustomSignupComponent } from './signup/signup.component';

export const routes: Routes = [
  {
    path: '',
    component: CustomAuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: CustomLoginComponent,
      },
      {
        path: 'signup',
        component: CustomSignupComponent,
      },
      {
        path: 'logout',
        component: CustomLogoutComponent,
      },
      {
        path: 'resetpassword',
        component: CustomResetPasswordComponent,
      },
    ],
  },
];
