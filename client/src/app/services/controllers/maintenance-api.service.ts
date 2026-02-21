import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { MaintenanceLog, CreateMaintenanceRequest } from '../../core/models/maintenance.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceApiService {
  constructor(private apiService: ApiService) {}

  public createMaintenance(request: CreateMaintenanceRequest): Observable<MaintenanceLog> {
    return this.apiService.post<MaintenanceLog>(API.maintenance.base, request);
  }

  public closeMaintenance(id: string): Observable<void> {
    return this.apiService.patch<void>(
      `${API.maintenance.base}/{id}/close`,
      {},
      { routeParams: { id } },
    );
  }

  public getMaintenanceLogs(
    pageNumber: number = 1,
    pageSize: number = 10,
  ): Observable<PagedResult<MaintenanceLog>> {
    return this.apiService.get<PagedResult<MaintenanceLog>>(API.maintenance.base, {
      queryParams: { pageNumber, pageSize },
    });
  }
}
