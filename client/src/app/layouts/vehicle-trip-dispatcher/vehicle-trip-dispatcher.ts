import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Trip, CreateTripRequest } from '../../core/models/trip.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-vehicle-trip-dispatcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  newTrip: CreateTripRequest = {
    vehicle_id: '',
    driver_id: '',
    cargoWeightKg: 0,
  };

  uiOrigin: string = '';
  uiDestination: string = '';
  uiEstimatedFuelCost: number = 0;

  constructor(
    private tripsService: TripsApiService,
    private vehiclesService: VehiclesApiService,
    private driversService: DriversApiService,
  ) {}

  ngOnInit() {
    this.loadActiveTrips();
    this.loadDropdownData();
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
    // Only fetch first page of vehicles/drivers for dropdowns simplisticly
    this.vehiclesService.getVehicles(1, 100).subscribe((res) => (this.vehicles = res.items || []));
    this.driversService.getDrivers(false).subscribe((res) => (this.drivers = res || []));
  }

  submitNewTrip() {
    if (
      !this.newTrip.vehicle_id ||
      !this.newTrip.driver_id ||
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
        this.activeTab = 'log'; // switch back to logs
        // Reset form
        this.newTrip = {
          vehicle_id: '',
          driver_id: '',
          cargoWeightKg: 0,
        };
        this.uiOrigin = '';
        this.uiDestination = '';
        this.uiEstimatedFuelCost = 0;
      },
      error: (err) => {
        console.error('Failed to dispatch trip', err);
        alert('Failed to submit trip.');
        this.isSubmitting = false;
      },
    });
  }
}
