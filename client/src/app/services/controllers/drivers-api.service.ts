import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { Driver, CreateDriverRequest, UpdateDriverRequest } from '../../core/models/driver.model';

@Injectable({ providedIn: 'root' })
export class DriversApiService {
  constructor(private apiService: ApiService) {}

  public getDrivers(includeDeleted: boolean = false): Observable<Driver[]> {
    return this.apiService.get<Driver[]>(API.drivers.base, {
      queryParams: { includeDeleted },
    });
  }

  public createDriver(request: CreateDriverRequest): Observable<Driver> {
    return this.apiService.post<Driver>(API.drivers.base, request);
  }

  public updateDriver(id: string, request: UpdateDriverRequest): Observable<Driver> {
    return this.apiService.put<Driver>(`${API.drivers.base}/{id}`, request, {
      routeParams: { id },
    });
  }

  public suspendDriver(id: string): Observable<void> {
    return this.apiService.patch<void>(
      `${API.drivers.base}/{id}/suspend`,
      {},
      {
        routeParams: { id },
      },
    );
  }
}
