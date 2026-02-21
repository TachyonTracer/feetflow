import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpClient,
  HttpBackend,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AlertService } from '../../services/shared/alert.service';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';
import { UserContextService } from '../services/user-context.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

// Shared state for token refresh coordination
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);
  const userContext = inject(UserContextService);
  const alertService = inject(AlertService);
  const httpBackend = inject(HttpBackend);
  const bypassHttp = new HttpClient(httpBackend); // This client bypasses all interceptors!

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
        case 401: {
          // Don't try to refresh if this IS the refresh request or login request
          const isAuthRequest =
            req.url.includes('/Auth/refresh') || req.url.includes('/Auth/login');

          if (isAuthRequest) {
            const isRefreshRequest = req.url.includes('/Auth/refresh');
            // Only force logout when refresh itself is unauthorized/forbidden.
            if (isRefreshRequest && (error.status === 401 || error.status === 403)) {
              forceLogout(jwtHelper, userContext, router);
            }
            return throwError(() => error);
          }

          // Attempt token refresh
          const refreshToken = localStorage.getItem('x-auth-token');
          const rawJwtToken = localStorage.getItem('raw_jwt_token');
          // If memory header is empty (cookie expired), fallback to raw_jwt_token
          const currentAccessToken = jwtHelper.getAuthorizationHeaderValue() || rawJwtToken;

          if (!refreshToken || !currentAccessToken) {
            forceLogout(jwtHelper, userContext, router);
            return throwError(() => error);
          }

          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            // Extract the raw bearer token (remove "bearer " prefix)
            const rawAccessToken = currentAccessToken.replace(/^bearer\s+/i, '');
            const rawRefreshToken = refreshToken.replace(/^bearer\s+/i, '');

            const refreshUrl = `${environment.apiBasePath}${environment.api.auth.refresh}`;

            return bypassHttp
              .post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>(
                refreshUrl,
                {
                  accessToken: rawAccessToken,
                  refreshToken: rawRefreshToken,
                },
              )
              .pipe(
                switchMap((response) => {
                  isRefreshing = false;

                  const tokens = response.result;

                  // Store new tokens
                  jwtHelper.setJWTToken(tokens.accessToken, tokens.expiresIn ?? -1);
                  jwtHelper.setAuthToken(tokens.refreshToken);
                  refreshTokenSubject.next(tokens.accessToken);

                  // Retry the original request with new token
                  const retryReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${tokens.accessToken}`,
                      'X-AUTH-TOKEN': tokens.refreshToken,
                    },
                  });
                  return next(retryReq);
                }),
                catchError((refreshError) => {
                  isRefreshing = false;
                  refreshTokenSubject.next(null);
                  // Avoid hard logout on transient server/network failures during refresh.
                  if (refreshError?.status === 401 || refreshError?.status === 403) {
                    forceLogout(jwtHelper, userContext, router);
                  }
                  return throwError(() => refreshError);
                }),
              );
          } else {
            // Another request is already refreshing — wait for the new token
            return refreshTokenSubject.pipe(
              filter((token) => token !== null),
              take(1),
              switchMap((token) => {
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`,
                    'X-AUTH-TOKEN': jwtHelper.getAuthToken(),
                  },
                });
                return next(retryReq);
              }),
            );
          }
        }

        case 403:
          alertService.error('Access Denied', 'You do not have permission to perform this action.');
          break;

        case 400:
          alertService.warning('Action Failed', apiError);
          break;

        case 404:
          if (!req.url.includes('/status')) {
            alertService.info('Not Found', apiError || 'The requested resource was not found.');
          }
          break;

        case 500:
          alertService.error(
            'Server Error',
            'An unexpected server error occurred. Please try again later.',
          );
          break;

        case 409:
          alertService.error('Conflict', apiError || 'A conflict occurred with existing data.');
          break;

        case 0:
          if (
            error.statusText !== 'Unknown Error' ||
            error.message.includes('Http failure response')
          ) {
            alertService.error(
              'Connection Error',
              'Unable to connect to the server. Please check your internet connection.',
            );
          }
          break;
      }

      return throwError(() => error);
    }),
  );
};

function forceLogout(
  jwtHelper: JwtHelperService,
  userContext: UserContextService,
  router: Router,
): void {
  userContext.clearUser();
  jwtHelper.clearJWTToken();
  localStorage.removeItem('x-auth-token');
  router.navigate(['/auth/login']);
}

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
