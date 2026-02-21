import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddExpenses } from '../add-expenses/add-expenses';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { FuelLog } from '../../core/models/fuel.model';

@Component({
  selector: 'app-view-expenses',
  imports: [CommonModule, FormsModule, AddExpenses],
  templateUrl: './view-expenses.html',
  styleUrl: './view-expenses.scss',
})
export class ViewExpenses implements OnInit {
  isAddExpenseModalOpen = false;
  vehicles: Vehicle[] = [];
  fuelLogs: FuelLog[] = [];
  selectedVehicleId = '';
  isLoading = false;
  totalFuelCost = 0;

  constructor(
    private vehiclesService: VehiclesApiService,
    private fuelService: FuelApiService,
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles = res.items || [];
        if (this.vehicles.length > 0) {
          this.selectedVehicleId = this.vehicles[0].id;
          this.loadFuelLogs();
        }
      },
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  loadFuelLogs() {
    if (!this.selectedVehicleId) return;
    this.isLoading = true;
    this.fuelService.getFuelLogsByVehicle(this.selectedVehicleId).subscribe({
      next: (logs) => {
        this.fuelLogs = logs || [];
        this.totalFuelCost = this.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load fuel logs', err);
        this.isLoading = false;
      },
    });
  }

  onVehicleChange() {
    this.loadFuelLogs();
  }

  getVehicleName(vehicleId: string): string {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : vehicleId.substring(0, 8);
  }

  toggleModal() {
    this.isAddExpenseModalOpen = !this.isAddExpenseModalOpen;
  }

  onExpenseCreated() {
    this.loadFuelLogs();
  }
}
