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

  // To be used once backend endpoint is complete
  public getMaintenanceLogs(): Observable<MaintenanceLog[]> {
    return this.apiService.get<MaintenanceLog[]>(API.maintenance.base);
  }
}
