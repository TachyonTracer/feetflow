import { Component, Output, EventEmitter, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { AlertService } from '../../services/shared/alert.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { Trip } from '../../core/models/trip.model';
import { FuelLog, CreateFuelLogRequest } from '../../core/models/fuel.model';
import { Driver } from '../../core/models/driver.model';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-add-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './add-expenses.html',
  styleUrl: './add-expenses.scss',
})
export class AddExpenses implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Input() logToEdit: FuelLog | null = null;

  vehicles: Vehicle[] = [];
  trips: Trip[] = [];
  drivers: Driver[] = [];
  isSubmitting = false;
  errorMessage = signal('');

  formData: CreateFuelLogRequest = {
    vehicleId: '',
    tripId: '',
    driverId: '',
    liters: 0,
    cost: 0,
    distance: 0,
    miscExpense: 0,
    status: 'Completed',
    fuelDate: new Date().toISOString().split('T')[0],
  };
  notes = '';

  get vehicleOptions(): SearchableSelectOption[] {
    return this.vehicles.map((v) => ({
      value: v.id,
      label: `${v.name} - ${v.licensePlate}`,
    }));
  }

  get tripOptions(): SearchableSelectOption[] {
    return this.trips.map((t) => ({
      value: t.id,
      label: `#${t.id.substring(0, 8).toUpperCase()} — ${t.vehicleName || 'Vehicle'}`,
    }));
  }

  get driverOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Select Driver' },
      ...this.drivers.map((d) => ({
        value: d.id,
        label: d.fullName,
      })),
    ];
  }

  readonly statusOptions: SearchableSelectOption[] = [
    { value: 'Completed', label: 'Completed' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Disputed', label: 'Disputed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  constructor(
    private vehiclesService: VehiclesApiService,
    private fuelService: FuelApiService,
    private tripsService: TripsApiService,
    private driversService: DriversApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.loadVehicles();
    this.loadTrips();
    this.loadDrivers();
    if (this.logToEdit) {
      this.formData = {
        vehicleId: this.logToEdit.vehicleId,
        tripId: this.logToEdit.tripId,
        driverId: this.logToEdit.driverId,
        liters: this.logToEdit.liters,
        cost: this.logToEdit.cost,
        distance: this.logToEdit.distance,
        miscExpense: this.logToEdit.miscExpense,
        status: this.logToEdit.status,
        fuelDate: this.logToEdit.fuelDate,
      };
      this.notes = '';
    }
  }

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => (this.vehicles = res.items || []),
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  loadTrips() {
    this.tripsService.getTrips(1, 100).subscribe({
      next: (res) => (this.trips = res.items || []),
      error: (err) => console.error('Failed to load trips', err),
    });
  }

  loadDrivers() {
    this.driversService.getDrivers(1, 100).subscribe({
      next: (res) => (this.drivers = res.items || []),
      error: (err) => console.error('Failed to load drivers', err),
    });
  }

  onTripChange(tripId: string) {
    if (!tripId) return;

    const trip = this.trips.find((t) => t.id === tripId);
    if (trip) {
      this.formData.vehicleId = trip.vehicleId;
      this.formData.driverId = trip.driverId;
    }
  }

  submitExpense() {
    if (!this.formData.tripId) {
      this.errorMessage.set('Please select a trip.');
      return;
    }
    if (!this.formData.vehicleId) {
      this.errorMessage.set('Please select a vehicle.');
      return;
    }
    if (this.formData.cost < 0) {
      this.errorMessage.set('Please enter a valid fuel cost.');
      return;
    }
    if (this.formData.liters < 0) {
      this.errorMessage.set('Please enter a valid liters amount.');
      return;
    }
    if (this.formData.distance < 0) {
      this.errorMessage.set('Please enter a valid distance.');
      return;
    }
    if (this.formData.miscExpense < 0) {
      this.errorMessage.set('Please enter a valid miscellaneous expense.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting = true;

    const request$ = this.logToEdit
      ? this.fuelService.updateFuelLog(this.logToEdit.id, this.formData)
      : this.fuelService.createFuelLog(this.formData);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.logToEdit ? 'Updated!' : 'Created!';
        const detail = this.logToEdit
          ? 'Fuel expense has been updated successfully.'
          : 'Fuel expense has been recorded successfully.';
        this.alertService.success(msg, detail);
        this.created.emit();
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Failed to create fuel log', err);
        this.isSubmitting = false;
        this.errorMessage.set(err.error?.errorMessage || 'Failed to create fuel log.');
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
