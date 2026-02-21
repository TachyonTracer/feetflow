import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { Driver, CreateDriverRequest, UpdateDriverRequest } from '../../core/models/driver.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class DriversApiService {
  constructor(private apiService: ApiService) {}

  public getDrivers(
    pageNumber: number = 1,
    pageSize: number = 10,
    includeDeleted: boolean = false,
  ): Observable<PagedResult<Driver>> {
    return this.apiService.get<PagedResult<Driver>>(API.drivers.base, {
      queryParams: { pageNumber, pageSize, includeDeleted },
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
    return this.apiService.patch<void>(`${API.drivers.base}/{id}/suspend`, {}, {
      routeParams: { id },
    });
  }
}
