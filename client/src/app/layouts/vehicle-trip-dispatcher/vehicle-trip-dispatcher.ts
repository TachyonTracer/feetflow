import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Trip, CreateTripRequest } from '../../core/models/trip.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-vehicle-trip-dispatcher',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
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

    if (this.currentStatus) {
      filtered = filtered.filter((t) => t.status === this.currentStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(term) ||
          (t.vehicleName && t.vehicleName.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'status') return a.status.localeCompare(b.status);
        if (this.sortBy === 'id') return a.id.localeCompare(b.id);
        return 0;
      });
    }

    return filtered;
  }

  loadActiveTrips() {
    this.isLoadingLogs = true;
    this.tripsService.getTrips(1, 100).subscribe({
      next: (res) => {
        this.trips = res.items || [];
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Failed to load trips', err);
        this.isLoadingLogs = false;
      },
    });
  }

  loadDropdownData() {
    this.vehiclesService.getVehicles(1, 100).subscribe((res) => (this.vehicles = res.items || []));
    this.driversService.getDrivers(false).subscribe((res) => (this.drivers = res || []));
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
