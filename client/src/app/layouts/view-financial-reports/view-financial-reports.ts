import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DashboardMetrics, VehicleRoi } from '../../core/models/analytics.model';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-view-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-financial-reports.html',
  styleUrl: './view-financial-reports.scss',
})
export class ViewFinancialReports implements OnInit {
  dashboardMetrics = signal<DashboardMetrics | null>(null);
  vehicles = signal<Vehicle[]>([]);
  selectedVehicleId = '';
  vehicleRoi = signal<VehicleRoi | null>(null);
  isLoadingMetrics = signal(true);
  isLoadingRoi = signal(false);

  constructor(
    private analyticsApiService: AnalyticsApiService,
    private vehiclesApiService: VehiclesApiService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadVehicles();
  }

  loadDashboard(): void {
    this.isLoadingMetrics.set(true);
    this.analyticsApiService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardMetrics.set(data);
        this.isLoadingMetrics.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard metrics', err);
        this.isLoadingMetrics.set(false);
      },
    });
  }

  loadVehicles(): void {
    this.vehiclesApiService.getVehicles(1, 100).subscribe({
      next: (res) => this.vehicles.set(res.items || []),
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  loadVehicleRoi(): void {
    if (!this.selectedVehicleId) {
      this.vehicleRoi.set(null);
      return;
    }
    this.isLoadingRoi.set(true);
    this.analyticsApiService.getVehicleRoi(this.selectedVehicleId).subscribe({
      next: (data) => {
        this.vehicleRoi.set(data);
        this.isLoadingRoi.set(false);
      },
      error: (err) => {
        console.error('Failed to load vehicle ROI', err);
        this.vehicleRoi.set(null);
        this.isLoadingRoi.set(false);
      },
    });
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
