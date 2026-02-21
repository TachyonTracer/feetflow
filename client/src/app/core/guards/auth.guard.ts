import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';

export const authGuard: CanActivateFn = () => {
  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);

  if (jwtHelper.isLoginCheck()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
