import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/shared/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loadingService = inject(LoadingService);

  if (request.url.includes('/assets/')) {
    return next(request);
  }

  loadingService.startLoading();

  return next(request).pipe(finalize(() => loadingService.stopLoading()));
};
