import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DashboardMetrics } from '../../core/models/analytics.model';
import { Vehicle, VehicleStatus } from '../../core/models/vehicle.model';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AddNewTrip } from '../vehicle-trip-dispatcher/add-new-trip/add-new-trip';
import { AddNewVehicle } from '../view-registered-vehicles/add-new-vehicle/add-new-vehicle';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Driver } from '../../core/models/driver.model';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { DASHBOARD_PAGE_SIZE_OPTIONS } from '../../core/constants/ui.constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataPageLayout,
    AddNewTrip,
    AddNewVehicle,
    CustomCellDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class Dashboard implements OnInit {
  metrics$?: Observable<DashboardMetrics>;
  vehicles = signal<Vehicle[]>([]);
  isLoadingVehicles = signal(true);

  isAddTripModalOpen = signal(false);
  isAddVehicleModalOpen = signal(false);
  allVehicles: Vehicle[] = [];
  allDrivers: Driver[] = [];

  searchTerm = signal('');
  currentStatus = signal<string>('');
  currentType = signal<string | string[]>('');
  currentRegion = signal<string | string[]>('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(1);

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Ready (Available)' },
    { value: 'OnTrip', label: 'Busy (On Trip)' },
    { value: 'InShop', label: 'In Shop (Maintenance)' },
  ];

  readonly typeOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Vehicle Types' },
    { value: 'TRUCK', label: 'Trucks' },
    { value: 'VAN', label: 'Vans' },
    { value: 'BIKE', label: 'Bikes' },
  ];

  readonly regionOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Regions' },
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { value: 'Goa', label: 'Goa' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Manipur', label: 'Manipur' },
    { value: 'Meghalaya', label: 'Meghalaya' },
    { value: 'Mizoram', label: 'Mizoram' },
    { value: 'Nagaland', label: 'Nagaland' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Sikkim', label: 'Sikkim' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Tripura', label: 'Tripura' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Uttarakhand', label: 'Uttarakhand' },
    { value: 'West Bengal', label: 'West Bengal' },
  ];

  readonly pageSizeOptions = DASHBOARD_PAGE_SIZE_OPTIONS;

  readonly columns: TableColumn[] = [
    { key: 'vehicleInfo', title: 'Vehicle', align: 'left', type: 'custom' },
    { key: 'type', title: 'Vehicle Type', align: 'center', type: 'custom' },
    { key: 'odometer', title: 'Odometer', align: 'center', type: 'custom' },
    { key: 'route', title: 'Active Route', align: 'center', type: 'custom' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
  ];

  readonly filteredVehicles = computed(() => {
    let filtered = this.vehicles();

    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.licensePlate.toLowerCase().includes(term) ||
          v.vehicleType.toLowerCase().includes(term),
      );
    }

    const type = this.currentType();
    if (type) {
      if (Array.isArray(type) && type.length > 0) {
        filtered = filtered.filter((v) =>
          type.some((t) => v.vehicleType.toLowerCase() === t.toLowerCase()),
        );
      } else if (typeof type === 'string') {
        filtered = filtered.filter((v) => v.vehicleType.toLowerCase() === type.toLowerCase());
      }
    }

    const region = this.currentRegion();
    if (region) {
      if (Array.isArray(region) && region.length > 0) {
        filtered = filtered.filter((v) =>
          region.some(
            (r) =>
              v.activeTripOriginState?.toLowerCase() === r.toLowerCase() ||
              v.activeTripDestinationState?.toLowerCase() === r.toLowerCase(),
          ),
        );
      } else if (typeof region === 'string') {
        filtered = filtered.filter(
          (v) =>
            v.activeTripOriginState?.toLowerCase() === region.toLowerCase() ||
            v.activeTripDestinationState?.toLowerCase() === region.toLowerCase(),
        );
      }
    }

    return filtered;
  });

  constructor(
    private analyticsService: AnalyticsApiService,
    private vehiclesService: VehiclesApiService,
    private driversService: DriversApiService,
    private router: Router,
  ) {}

  onAddTrip(): void {
    this.isAddTripModalOpen.set(true);
  }

  onAddVehicle(): void {
    this.isAddVehicleModalOpen.set(true);
  }

  ngOnInit() {
    this.metrics$ = this.analyticsService.getDashboard();
    this.loadVehicles();
    this.loadDropdownData();
  }

  loadDropdownData() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.allVehicles = res.items ?? [];
      },
    });

    this.driversService.getDrivers(1, 100).subscribe({
      next: (res) => {
        this.allDrivers = res.items ?? [];
      },
    });
  }

  getVehicleOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Select a fleet unit' },
      ...this.allVehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} - ${vehicle.licensePlate}`,
      })),
    ];
  }

  getDriverOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Assign a driver' },
      ...this.allDrivers.map((driver) => ({
        value: driver.id,
        label: driver.fullName,
      })),
    ];
  }

  onTripCreated(): void {
    // Refresh metrics on new trip created to show Active Trips increase
    this.metrics$ = this.analyticsService.getDashboard();
  }

  onVehicleCreated(): void {
    this.loadVehicles();
    this.loadDropdownData();
    this.metrics$ = this.analyticsService.getDashboard();
  }

  loadVehicles() {
    this.isLoadingVehicles.set(true);
    const statusFilter = this.currentStatus() ? (this.currentStatus() as VehicleStatus) : undefined;

    this.vehiclesService.getVehicles(this.pageNumber(), this.pageSize(), statusFilter).subscribe({
      next: (res) => {
        this.vehicles.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.totalPages.set(res.totalPages || 1);
        this.pageNumber.set(res.pageNumber || this.pageNumber());
        this.pageSize.set(res.pageSize || this.pageSize());
        this.isLoadingVehicles.set(false);
      },
      error: (err) => {
        console.error('Failed to load vehicles', err);
        this.isLoadingVehicles.set(false);
      },
    });
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages() || newPage === this.pageNumber()) return;
    this.pageNumber.set(newPage);
    this.loadVehicles();
  }

  onFilterStatusChanged(status: string): void {
    this.currentStatus.set(status);
    this.pageNumber.set(1);
    this.loadVehicles();
  }

  onPageSizeChanged(size: string): void {
    const parsed = Number(size);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    this.pageSize.set(parsed);
    this.pageNumber.set(1);
    this.loadVehicles();
  }

  calculateUtilization(metrics: DashboardMetrics): number {
    if (!metrics || metrics.totalVehicles === 0) return 0;
    return Math.round((metrics.activeTrips / metrics.totalVehicles) * 100);
  }
}
