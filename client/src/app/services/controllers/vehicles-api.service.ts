import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleStatus,
} from '../../core/models/vehicle.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class VehiclesApiService {
  constructor(private apiService: ApiService) {}

  public getVehicles(
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: VehicleStatus,
    includeDeleted: boolean = false,
  ): Observable<PagedResult<Vehicle>> {
    const queryParams: Record<string, string | number | boolean> = { pageNumber, pageSize, includeDeleted };
    if (status) queryParams['status'] = status;

    return this.apiService.get<PagedResult<Vehicle>>(API.vehicles.base, { queryParams });
  }

  public getVehicleById(id: string): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`${API.vehicles.base}/{id}`, {
      routeParams: { id },
    });
  }

  public createVehicle(request: CreateVehicleRequest): Observable<Vehicle> {
    return this.apiService.post<Vehicle>(API.vehicles.base, request);
  }

  public updateVehicle(id: string, request: UpdateVehicleRequest): Observable<Vehicle> {
    return this.apiService.put<Vehicle>(`${API.vehicles.base}/{id}`, request, {
      routeParams: { id },
    });
  }

  public retireVehicle(id: string): Observable<void> {
    return this.apiService.patch<void>(
      `${API.vehicles.base}/{id}/retire`,
      {},
      { routeParams: { id } },
    );
  }

  public deleteVehicle(id: string): Observable<void> {
    return this.apiService.delete<void>(`${API.vehicles.base}/{id}`, {
      routeParams: { id },
    });
  }
}
