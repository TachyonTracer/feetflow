import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AddExpenses } from '../add-expenses/add-expenses';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { FuelLog } from '../../core/models/fuel.model';

@Component({
  selector: 'app-view-expenses',
  imports: [CommonModule, FormsModule, AddExpenses, HeaderComponent],
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
  isDropdownOpen = signal(false);
  searchTerm = signal('');

  get filteredVehicles(): Vehicle[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.vehicles;
    return this.vehicles.filter(v =>
      v.name.toLowerCase().includes(term) ||
      v.licensePlate.toLowerCase().includes(term)
    );
  }

  get selectedVehicleName(): string {
    if (!this.selectedVehicleId) return 'Search and select a vehicle...';
    const vehicle = this.vehicles.find(v => v.id === this.selectedVehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Select a vehicle...';
  }

  toggleDropdown() {
    this.isDropdownOpen.set(!this.isDropdownOpen());
    if (this.isDropdownOpen()) {
      this.searchTerm.set('');
      // Add tiny timeout to ensure DOM updating has completed rendering the input
      setTimeout(() => {
        const searchInput = document.querySelector('.view-expenses .search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      }, 10);
    }
  }

  selectVehicle(id: string) {
    this.selectedVehicleId = id;
    this.isDropdownOpen.set(false);
    this.onVehicleChange();
  }

  // Close dropdown when clicking outside
  checkClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.isDropdownOpen.set(false);
    }
  }

  constructor(
    private vehiclesService: VehiclesApiService,
    private fuelService: FuelApiService,
  ) { }

  ngOnInit() {
    this.loadVehicles();
    document.addEventListener('click', this.checkClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.checkClickOutside.bind(this));
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
