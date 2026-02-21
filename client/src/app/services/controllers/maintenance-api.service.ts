import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { MaintenanceLog, CreateMaintenanceRequest } from '../../core/models/maintenance.model';

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
      {
        routeParams: { id },
      },
    );
  }

  public getMaintenanceLogs(page: number = 1, pageSize: number = 50): Observable<any> {
    return this.apiService.get<any>(API.maintenance.base, {
      queryParams: { page, pageSize },
    });
  }
}
