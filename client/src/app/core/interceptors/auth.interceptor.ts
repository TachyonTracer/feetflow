import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);

  const authHeaderValue = jwtHelper.getAuthorizationHeaderValue();

  if (authHeaderValue) {
    req = req.clone({
      setHeaders: {
        Authorization: authHeaderValue,
        'X-AUTH-TOKEN': jwtHelper.getAuthToken(),
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        jwtHelper.clearJWTToken();
        localStorage.removeItem('x-auth-token');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};
