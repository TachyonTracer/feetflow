import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Trip, CreateTripRequest, TripStatus } from '../../core/models/trip.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { Driver } from '../../core/models/driver.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-vehicle-trip-dispatcher',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SearchableSelectComponent, InrCurrencyPipe],
  templateUrl: './vehicle-trip-dispatcher.html',
  styleUrl: './vehicle-trip-dispatcher.scss',
})
export class VehicleTripDispatcher implements OnInit {
  activeTab: 'log' | 'add' = 'log';

  trips: Trip[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];

  isLoadingLogs = false;
  isSubmitting = false;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  readonly sortOptions: SearchableSelectOption[] = [
    { value: '', label: 'Sort By' },
    { value: 'status', label: 'Status' },
    { value: 'id', label: 'Trip ID' },
    { value: 'cargoWeightKg', label: 'Cargo Weight' },
    { value: 'revenue', label: 'Revenue' },
  ];

  readonly pageSizeOptions: SearchableSelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
  ];

  newTrip: CreateTripRequest = {
    vehicleId: '',
    driverId: '',
    cargoWeightKg: 0,
  };

  uiOrigin = '';
  uiDestination = '';
  uiEstimatedFuelCost = 0;

  completeTripId = '';
  completeEndOdometer = 0;
  completeRevenue = 0;
  showCompleteModal = false;

  constructor(
    private tripsService: TripsApiService,
    private vehiclesService: VehiclesApiService,
    private driversService: DriversApiService,
  ) {}

  ngOnInit() {
    this.loadActiveTrips();
    this.loadDropdownData();
  }

  get filteredTrips(): Trip[] {
    let filtered = this.trips;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(term) ||
          (t.vehicleName && t.vehicleName.toLowerCase().includes(term)) ||
          (t.driverName && t.driverName.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'status') return a.status.localeCompare(b.status);
        if (this.sortBy === 'id') return a.id.localeCompare(b.id);
        if (this.sortBy === 'cargoWeightKg') return (b.cargoWeightKg ?? 0) - (a.cargoWeightKg ?? 0);
        if (this.sortBy === 'revenue') return (b.revenue ?? 0) - (a.revenue ?? 0);
        return 0;
      });
    }

    return filtered;
  }

  tripPageNumber = 1;
  tripPageSize = 10;
  tripTotalCount = 0;
  tripTotalPages = 1;

  get startRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return (this.tripPageNumber - 1) * this.tripPageSize + 1;
  }

  get endRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return Math.min(this.tripPageNumber * this.tripPageSize, this.tripTotalCount);
  }

  loadActiveTrips() {
    this.isLoadingLogs = true;
    const statusFilter = this.currentStatus ? (this.currentStatus as TripStatus) : undefined;

    this.tripsService.getTrips(this.tripPageNumber, this.tripPageSize, statusFilter).subscribe({
      next: (res) => {
        this.trips = res.items ?? [];
        this.tripTotalCount = res.totalCount ?? 0;
        this.tripTotalPages = res.totalPages || 1;
        this.tripPageNumber = res.pageNumber || this.tripPageNumber;
        this.tripPageSize = res.pageSize || this.tripPageSize;
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Failed to load trips', err);
        this.isLoadingLogs = false;
      },
    });
  }

  loadDropdownData() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles = res.items ?? [];
      },
      error: (err) => {
        console.error('Failed to load vehicles', err);
      },
    });

    this.driversService.getDrivers(1, 100).subscribe({
      next: (res) => {
        this.drivers = res.items ?? [];
      },
      error: (err) => {
        console.error('Failed to load drivers', err);
      },
    });
  }

  changeTripPage(page: number) {
    if (page < 1 || page > this.tripTotalPages) return;
    this.tripPageNumber = page;
    this.loadActiveTrips();
  }

  onFilterChanged(): void {
    this.tripPageNumber = 1;
    this.loadActiveTrips();
  }

  onSortChanged(): void {
    this.loadActiveTrips();
  }

  onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.tripPageSize = parsedPageSize;
    this.tripPageNumber = 1;
    this.loadActiveTrips();
  }

  getVehicleOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Select a fleet unit' },
      ...this.vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} - ${vehicle.licensePlate}`,
      })),
    ];
  }

  getDriverOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Assign a driver' },
      ...this.drivers.map((driver) => ({
        value: driver.id,
        label: `${driver.fullName} (${driver.licenseNumber})`,
      })),
    ];
  }

  submitNewTrip() {
    if (
      !this.newTrip.vehicleId ||
      !this.newTrip.driverId ||
      !this.uiOrigin ||
      !this.uiDestination
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    this.isSubmitting = true;
    this.tripsService.createTrip(this.newTrip).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loadActiveTrips();
        this.activeTab = 'log';
        this.newTrip = { vehicleId: '', driverId: '', cargoWeightKg: 0 };
        this.uiOrigin = '';
        this.uiDestination = '';
        this.uiEstimatedFuelCost = 0;
      },
      error: (err) => {
        console.error('Failed to create trip', err);
        alert('Failed to submit trip.');
        this.isSubmitting = false;
      },
    });
  }

  dispatchTrip(tripId: string) {
    this.tripsService.dispatchTrip(tripId).subscribe({
      next: () => this.loadActiveTrips(),
      error: (err) => {
        console.error('Failed to dispatch trip', err);
        alert('Failed to dispatch trip.');
      },
    });
  }

  openCompleteModal(tripId: string) {
    this.completeTripId = tripId;
    this.completeEndOdometer = 0;
    this.completeRevenue = 0;
    this.showCompleteModal = true;
  }

  confirmCompleteTrip() {
    if (this.completeEndOdometer <= 0 || this.completeRevenue < 0) {
      alert('Please enter valid end odometer and revenue values.');
      return;
    }
    this.tripsService
      .completeTrip(this.completeTripId, {
        endOdometer: this.completeEndOdometer,
        revenue: this.completeRevenue,
      })
      .subscribe({
        next: () => {
          this.showCompleteModal = false;
          this.loadActiveTrips();
        },
        error: (err) => {
          console.error('Failed to complete trip', err);
          alert('Failed to complete trip.');
        },
      });
  }

  cancelTrip(tripId: string) {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    this.tripsService.cancelTrip(tripId).subscribe({
      next: () => this.loadActiveTrips(),
      error: (err) => {
        console.error('Failed to cancel trip', err);
        alert('Failed to cancel trip.');
      },
    });
  }

  getVehicleName(vehicleId: string): string {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.name}` : `Vehicle ${vehicleId.substring(0, 5)}`;
  }

  getDriverName(driverId: string): string {
    const driver = this.drivers.find((d) => d.id === driverId);
    return driver ? driver.fullName : `Driver ${driverId.substring(0, 5)}`;
  }
}
