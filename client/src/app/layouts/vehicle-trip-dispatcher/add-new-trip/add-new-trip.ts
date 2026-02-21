import { Component, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripsApiService } from '../../../services/controllers/trips-api.service';
import { CreateTripRequest } from '../../../core/models/trip.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';
import { AlertService } from '../../../services/shared/alert.service';

@Component({
  selector: 'app-add-new-trip',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './add-new-trip.html',
  styleUrl: './add-new-trip.scss',
})
export class AddNewTrip {
  @Input() vehicleOptions: SearchableSelectOption[] = [];
  @Input() driverOptions: SearchableSelectOption[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() tripCreated = new EventEmitter<void>();

  newTrip: CreateTripRequest = {
    vehicleId: '',
    driverId: '',
    cargoWeightKg: 0,
    originState: '',
    destinationState: '',
  };

  uiOrigin = '';
  uiDestination = '';
  uiEstimatedFuelCost = 0;

  readonly stateOptions: SearchableSelectOption[] = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ].map((s) => ({ label: s, value: s }));

  isSubmitting = signal(false);

  constructor(
    private tripsService: TripsApiService,
    private alertService: AlertService,
  ) {}

  submitNewTrip(): void {
    if (
      !this.newTrip.vehicleId ||
      !this.newTrip.driverId ||
      !this.newTrip.originState ||
      !this.newTrip.destinationState
    ) {
      this.alertService.warning(
        'Missing Required Fields',
        'Please select a vehicle, driver, origin state, and destination state.',
      );
      return;
    }

    this.isSubmitting.set(true);

    const tripRequest = {
      ...this.newTrip,
      originState: this.newTrip.originState.toUpperCase(),
      destinationState: this.newTrip.destinationState.toUpperCase(),
    };

    this.tripsService.createTrip(tripRequest).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.tripCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to create trip', err);
        this.alertService.showApiError(err);
        this.isSubmitting.set(false);
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
