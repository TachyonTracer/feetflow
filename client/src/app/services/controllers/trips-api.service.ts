import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import {
  Trip,
  CreateTripRequest,
  CompleteTripRequest,
  TripStatus,
} from '../../core/models/trip.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  constructor(private apiService: ApiService) {}

  public getTrips(
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: TripStatus,
    vehicleId?: string,
  ): Observable<PagedResult<Trip>> {
    const queryParams: Record<string, string | number> = { pageNumber, pageSize };
    if (status) queryParams['status'] = status;
    if (vehicleId) queryParams['vehicleId'] = vehicleId;

    return this.apiService.get<PagedResult<Trip>>(API.trips.base, { queryParams });
  }

  public createTrip(request: CreateTripRequest): Observable<Trip> {
    return this.apiService.post<Trip>(API.trips.base, request);
  }

  public dispatchTrip(id: string): Observable<void> {
    return this.apiService.patch<void>(`${API.trips.base}/{id}/dispatch`, {}, { routeParams: { id } });
  }

  public completeTrip(id: string, request: CompleteTripRequest): Observable<void> {
    return this.apiService.patch<void>(`${API.trips.base}/{id}/complete`, request, {
      routeParams: { id },
    });
  }

  public cancelTrip(id: string): Observable<void> {
    return this.apiService.patch<void>(`${API.trips.base}/{id}/cancel`, {}, { routeParams: { id } });
  }
}
