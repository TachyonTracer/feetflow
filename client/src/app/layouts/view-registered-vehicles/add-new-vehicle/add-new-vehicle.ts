import { Component, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehiclesApiService } from '../../../services/controllers/vehicles-api.service';
import { CreateVehicleRequest } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-add-new-vehicle',
  standalone: true,
  imports: [FormsModule],
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

  constructor(private vehiclesApiService: VehiclesApiService) {}

  submitVehicle(): void {
    if (!this.formData.name || !this.formData.licensePlate || !this.formData.vehicleType) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.vehiclesApiService.createVehicle(this.formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.errorMessage || 'Failed to create vehicle.');
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
