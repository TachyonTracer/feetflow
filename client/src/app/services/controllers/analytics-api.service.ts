import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import {
  DashboardMetrics,
  VehicleRoi,
  FuelEfficiency,
  FleetFinancialSummary,
  FuelEfficiencyTrendItem,
  TopCostliestVehicleItem,
} from '../../core/models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  constructor(private apiService: ApiService) {}

  public getDashboard(): Observable<DashboardMetrics> {
    return this.apiService.get<DashboardMetrics>(API.analytics.dashboard, {
      cache: true,
    });
  }

  public getVehicleRoi(vehicleId: string): Observable<VehicleRoi> {
    return this.apiService.get<VehicleRoi>(`${API.analytics.base}/vehicle-roi/{id}`, {
      routeParams: { id: vehicleId },
    });
  }

  public getFuelEfficiency(vehicleId: string): Observable<FuelEfficiency> {
    return this.apiService.get<FuelEfficiency>(`${API.analytics.base}/fuel-efficiency/{id}`, {
      routeParams: { id: vehicleId },
    });
  }

  public getFleetFinancialSummary(
    startDate?: string,
    endDate?: string,
  ): Observable<FleetFinancialSummary> {
    const queryParams: any = {};
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    return this.apiService.get<FleetFinancialSummary>(
      `${API.analytics.base}/fleet-financial-summary`,
      { queryParams },
    );
  }

  public getFuelEfficiencyTrend(
    startDate?: string,
    endDate?: string,
  ): Observable<FuelEfficiencyTrendItem[]> {
    const queryParams: any = {};
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    return this.apiService.get<FuelEfficiencyTrendItem[]>(
      `${API.analytics.base}/fuel-efficiency-trend`,
      { queryParams },
    );
  }

  public getTopCostliestVehicles(
    startDate?: string,
    endDate?: string,
  ): Observable<TopCostliestVehicleItem[]> {
    const queryParams: any = {};
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    return this.apiService.get<TopCostliestVehicleItem[]>(
      `${API.analytics.base}/top-costliest-vehicles`,
      { queryParams },
    );
  }
}
