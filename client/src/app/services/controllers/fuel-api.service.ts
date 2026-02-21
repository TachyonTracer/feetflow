import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import {
  FuelLog,
  CreateFuelLogRequest,
  UpdateFuelLogRequest,
  FuelLogPagedResponse,
} from '../../core/models/fuel.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class FuelApiService {
  constructor(private apiService: ApiService) {}

  public createFuelLog(request: CreateFuelLogRequest): Observable<FuelLog> {
    return this.apiService.post<FuelLog>(API.fuel.base, request);
  }

  public getFuelLogsByVehicle(
    vehicleId?: string,
    pageNumber: number = 1,
    pageSize: number = 10,
  ): Observable<FuelLogPagedResponse> {
    const params: any = { pageNumber, pageSize };
    if (vehicleId) {
      params.vehicleId = vehicleId;
    }
    return this.apiService.get<FuelLogPagedResponse>(API.fuel.base, {
      queryParams: params,
    });
  }

  public updateFuelLog(id: string, request: UpdateFuelLogRequest): Observable<FuelLog> {
    return this.apiService.put<FuelLog>(`${API.fuel.base}/${id}`, request);
  }
}
