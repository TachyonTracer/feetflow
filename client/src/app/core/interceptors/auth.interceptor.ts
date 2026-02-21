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
      const apiError = extractApiError(error);

      switch (error.status) {
        case 401:
          jwtHelper.clearJWTToken();
          localStorage.removeItem('x-auth-token');
          router.navigate(['/auth/login']);
          break;

        case 403:
          console.error('[403] Access denied:', apiError);
          break;

        case 400:
          console.error('[400] Validation error:', apiError);
          break;

        case 500:
          console.error('[500] Server error:', apiError);
          break;
      }

      return throwError(() => error);
    }),
  );
};

function extractApiError(error: HttpErrorResponse): string {
  if (error.error?.errorMessage) {
    return error.error.errorMessage;
  }
  if (error.error?.detail) {
    return error.error.detail;
  }
  if (typeof error.error === 'string') {
    return error.error;
  }
  return error.message || 'An unexpected error occurred';
}
