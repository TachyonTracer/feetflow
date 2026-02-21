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

export interface GetVehiclesResponse {
  items: Vehicle[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class VehiclesApiService {
  constructor(private apiService: ApiService) {}

  public getVehicles(
    page: number = 1,
    pageSize: number = 20,
    status?: VehicleStatus,
    includeDeleted: boolean = false,
  ): Observable<GetVehiclesResponse> {
    const queryParams: any = { page, pageSize, includeDeleted };
    if (status) queryParams.status = status;

    return this.apiService.get<GetVehiclesResponse>(API.vehicles.base, { queryParams });
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
      {
        routeParams: { id },
      },
    );
  }

  public deleteVehicle(id: string): Observable<void> {
    return this.apiService.delete<void>(`${API.vehicles.base}/{id}`, {
      routeParams: { id },
    });
  }
}
