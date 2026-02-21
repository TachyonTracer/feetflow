import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export const authGuard: CanActivateFn = async () => {
  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);
  const httpBackend = inject(HttpBackend);
  const bypassHttp = new HttpClient(httpBackend); // Bypasses interceptors

  // 1. If the access token cookie is still valid, allow
  if (jwtHelper.isLoginCheck()) {
    return true;
  }

  // 2. Cookie expired — try to refresh using the refresh token in localStorage
  const refreshToken = localStorage.getItem('x-auth-token');
  const rawJwtToken = localStorage.getItem('raw_jwt_token');

  if (refreshToken && rawJwtToken) {
    try {
      const rawRefreshToken = refreshToken.replace(/^bearer\s+/i, '');
      const cleanJwtToken = rawJwtToken.replace(/^bearer\s+/i, '');

      const refreshUrl = `${environment.apiBasePath}${environment.api.auth.refresh}`;

      const response = await bypassHttp
        .post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>(
          refreshUrl,
          {
            accessToken: cleanJwtToken,
            refreshToken: rawRefreshToken,
          },
        )
        .toPromise();

      if (response?.result?.accessToken) {
        const tokens = response.result;
        // Store new tokens
        jwtHelper.setJWTToken(tokens.accessToken, tokens.expiresIn ?? -1);
        jwtHelper.setAuthToken(tokens.refreshToken);
        return true;
      }
    } catch (error) {
      console.warn('[AuthGuard] Token refresh failed, redirecting to login', error);
    }
  }

  // 3. No refresh token or refresh failed — redirect to login
  router.navigate(['/auth/login']);
  return false;
};
