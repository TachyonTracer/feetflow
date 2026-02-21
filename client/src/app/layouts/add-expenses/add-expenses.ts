import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { CreateFuelLogRequest } from '../../core/models/fuel.model';

@Component({
  selector: 'app-add-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-expenses.html',
  styleUrl: './add-expenses.scss',
})
export class AddExpenses implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  vehicles: Vehicle[] = [];
  isSubmitting = false;

  formData: CreateFuelLogRequest = {
    vehicleId: '',
    liters: 0,
    cost: 0,
    fuelDate: new Date().toISOString().split('T')[0],
  };
  notes = '';

  constructor(
    private vehiclesService: VehiclesApiService,
    private fuelService: FuelApiService,
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => (this.vehicles = res.items || []),
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  submitExpense() {
    if (!this.formData.vehicleId || this.formData.cost <= 0) {
      return;
    }

    this.isSubmitting = true;
    this.fuelService.createFuelLog(this.formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.created.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to create fuel log', err);
        this.isSubmitting = false;
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
