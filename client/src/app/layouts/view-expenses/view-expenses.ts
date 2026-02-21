import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AddExpenses } from '../add-expenses/add-expenses';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { FuelLog } from '../../core/models/fuel.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-view-expenses',
  imports: [
    CommonModule,
    FormsModule,
    AddExpenses,
    HeaderComponent,
    SearchableSelectComponent,
    InrCurrencyPipe,
  ],
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

  fuelPageNumber = 1;
  fuelPageSize = 10;
  fuelTotalCount = 0;
  fuelTotalPages = 1;

  readonly pageSizeOptions: SearchableSelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
  ];

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles = res.items ?? [];
        if (this.vehicles.length > 0 && !this.selectedVehicleId) {
          this.selectedVehicleId = this.vehicles[0].id;
        }
        if (this.selectedVehicleId) this.loadFuelLogs();
      },
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  loadFuelLogs() {
    if (!this.selectedVehicleId) return;
    this.isLoading = true;
    this.fuelService.getFuelLogsByVehicle(this.selectedVehicleId, this.fuelPageNumber, this.fuelPageSize).subscribe({
      next: (res) => {
        this.fuelLogs = res.items ?? [];
        this.fuelTotalCount = res.totalCount ?? 0;
        this.fuelTotalPages = (res.totalPages ?? Math.ceil(this.fuelTotalCount / this.fuelPageSize)) || 1;
        this.fuelPageNumber = res.pageNumber || this.fuelPageNumber;
        this.fuelPageSize = res.pageSize || this.fuelPageSize;
        this.totalFuelCost = this.fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load fuel logs', err);
        this.isLoading = false;
      },
    });
  }

  onVehicleChange() {
    this.fuelPageNumber = 1;
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

  get vehicleOptions(): SearchableSelectOption[] {
    return this.vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.name} - ${vehicle.licensePlate}`,
    }));
  }

  get startRecord(): number {
    if (this.fuelTotalCount === 0) return 0;
    return (this.fuelPageNumber - 1) * this.fuelPageSize + 1;
  }

  get endRecord(): number {
    if (this.fuelTotalCount === 0) return 0;
    return Math.min(this.fuelPageNumber * this.fuelPageSize, this.fuelTotalCount);
  }

  changeFuelPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.fuelTotalPages) return;
    this.fuelPageNumber = pageNumber;
    this.loadFuelLogs();
  }

  onFuelPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.fuelPageSize = parsedPageSize;
    this.fuelPageNumber = 1;
    this.loadFuelLogs();
  }
}
