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

export interface GetTripsResponse {
  items: Trip[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  constructor(private apiService: ApiService) {}

  public getTrips(
    page: number = 1,
    pageSize: number = 20,
    status?: TripStatus,
    vehicleId?: string,
  ): Observable<GetTripsResponse> {
    const queryParams: any = { page, pageSize };
    if (status) queryParams.status = status;
    if (vehicleId) queryParams.vehicleId = vehicleId;

    return this.apiService.get<GetTripsResponse>(API.trips.base, { queryParams });
  }

  public createTrip(request: CreateTripRequest): Observable<Trip> {
    return this.apiService.post<Trip>(API.trips.base, request);
  }

  public dispatchTrip(id: string): Observable<void> {
    return this.apiService.patch<void>(
      `${API.trips.base}/{id}/dispatch`,
      {},
      {
        routeParams: { id },
      },
    );
  }

  public completeTrip(id: string, request: CompleteTripRequest): Observable<void> {
    return this.apiService.patch<void>(`${API.trips.base}/{id}/complete`, request, {
      routeParams: { id },
    });
  }

  public cancelTrip(id: string): Observable<void> {
    return this.apiService.patch<void>(
      `${API.trips.base}/{id}/cancel`,
      {},
      {
        routeParams: { id },
      },
    );
  }
}
