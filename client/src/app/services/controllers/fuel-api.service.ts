import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { FuelLog, CreateFuelLogRequest } from '../../core/models/fuel.model';

@Injectable({ providedIn: 'root' })
export class FuelApiService {
  constructor(private apiService: ApiService) {}

  public createFuelLog(request: CreateFuelLogRequest): Observable<FuelLog> {
    return this.apiService.post<FuelLog>(API.fuel.base, request);
  }

  public getFuelLogsByVehicle(vehicleId: string): Observable<FuelLog[]> {
    return this.apiService.get<FuelLog[]>(API.fuel.base, {
      queryParams: { vehicleId },
    });
  }
}
