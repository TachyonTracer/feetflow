import { Component, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehiclesApiService } from '../../../services/controllers/vehicles-api.service';
import { CreateVehicleRequest } from '../../../core/models/vehicle.model';
import { AlertService } from '../../../services/shared/alert.service';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-add-new-vehicle',
  standalone: true,
  imports: [FormsModule, SearchableSelectComponent],
  templateUrl: './add-new-vehicle.html',
  styleUrl: './add-new-vehicle.scss',
})
export class AddNewVehicle {
  @Output() close = new EventEmitter<void>();

  formData: CreateVehicleRequest = {
    name: '',
    licensePlate: '',
    vehicleType: '',
    maxCapacityKg: 0,
    acquisitionCost: 0,
    odometerKm: 0,
  };

  isSubmitting = signal(false);
  errorMessage = signal('');

  readonly vehicleTypeOptions: SearchableSelectOption[] = [
    { value: 'TRUCK', label: 'Truck' },
    { value: 'VAN', label: 'Van' },
    { value: 'BIKE', label: 'Bike' },
  ];

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private alertService: AlertService,
  ) {}

  submitVehicle(): void {
    if (!this.formData.name || !this.formData.licensePlate || !this.formData.vehicleType) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload = {
      ...this.formData,
      vehicleType: this.formData.vehicleType.toUpperCase(),
    };

    this.vehiclesApiService.createVehicle(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.errorMessage || 'Failed to create vehicle.');
        this.alertService.showApiError(err);
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
