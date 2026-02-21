import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DashboardMetrics, VehicleRoi } from '../../core/models/analytics.model';
import { Vehicle } from '../../core/models/vehicle.model';

import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-view-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
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
  isDropdownOpen = signal(false);
  searchTerm = signal('');

  get filteredVehicles(): Vehicle[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.vehicles();
    return this.vehicles().filter(v =>
      v.name.toLowerCase().includes(term) ||
      v.licensePlate.toLowerCase().includes(term)
    );
  }

  get selectedVehicleName(): string {
    if (!this.selectedVehicleId) return 'Search and select a vehicle...';
    const vehicle = this.vehicles().find(v => v.id === this.selectedVehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Select a vehicle...';
  }

  toggleDropdown() {
    this.isDropdownOpen.set(!this.isDropdownOpen());
    if (this.isDropdownOpen()) {
      this.searchTerm.set('');
      // Add tiny timeout to ensure DOM updating has completed rendering the input
      setTimeout(() => {
        const searchInput = document.querySelector('.view-financial-reports .search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      }, 10);
    }
  }

  selectVehicle(id: string) {
    this.selectedVehicleId = id;
    this.isDropdownOpen.set(false);
    this.loadVehicleRoi();
  }

  // Close dropdown when clicking outside
  checkClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.isDropdownOpen.set(false);
    }
  }

  constructor(
    private analyticsApiService: AnalyticsApiService,
    private vehiclesApiService: VehiclesApiService,
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadVehicles();
    document.addEventListener('click', this.checkClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.checkClickOutside.bind(this));
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
    return (
      '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    );
  }
}
