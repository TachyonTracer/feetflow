import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AddNewVehicle } from './add-new-vehicle/add-new-vehicle';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { Vehicle, VehicleStatus } from '../../core/models/vehicle.model';
import { PAGE_SIZE_OPTIONS, normalizePageSize } from '../../core/models/paged-result.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddNewVehicle,
    HeaderComponent,
    SearchableSelectComponent,
    InrCurrencyPipe,
  ],
  templateUrl: './view-registered-vehicles.html',
  styleUrl: './view-registered-vehicles.scss',
})
export class VehicleRegister implements OnInit {
  isModalOpen = false;
  vehicles: Vehicle[] = [];
  isLoading = true;
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  searchTerm = '';
  currentStatus: string = '';
  sortBy: string = '';
  pageSizeModel = this.pageSize.toString();

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'InShop', label: 'In Shop' },
    { value: 'OnTrip', label: 'On Trip' },
    { value: 'Retired', label: 'Retired' },
  ];

  readonly sortOptions: SearchableSelectOption[] = [
    { value: '', label: 'Sort By' },
    { value: 'capacity', label: 'Capacity (High to Low)' },
    { value: 'odometer', label: 'Odometer (High to Low)' },
    { value: 'acquisitionCost', label: 'Acquisition Cost (High to Low)' },
  ];

  get pageSizeOptionsForSelect(): SearchableSelectOption[] {
    return this.pageSizeOptions.map((option) => ({
      value: option.toString(),
      label: `${option} per page`,
    }));
  }

  constructor(private vehiclesService: VehiclesApiService) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    const statusFilter = this.currentStatus ? (this.currentStatus as VehicleStatus) : undefined;
    this.vehiclesService
      .getVehicles(this.pageNumber, this.pageSize, statusFilter, false)
      .subscribe({
        next: (res) => {
          this.vehicles = res.items ?? [];
          this.totalCount = res.totalCount ?? 0;
          this.totalPages = (res.totalPages ?? Math.ceil(this.totalCount / this.pageSize)) || 1;
          this.pageNumber = res.pageNumber || this.pageNumber;
          this.pageSize = res.pageSize || this.pageSize;
          this.pageSizeModel = this.pageSize.toString();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.isLoading = false;
        },
      });
  }

  get filteredVehicles(): Vehicle[] {
    if (!this.searchTerm.trim()) return this.vehicles;
    const term = this.searchTerm.toLowerCase();
    return this.vehicles.filter(
      (v) =>
        v.id.toLowerCase().includes(term) ||
        v.name?.toLowerCase().includes(term) ||
        v.licensePlate?.toLowerCase().includes(term),
    );
  }

  get displayVehicles(): Vehicle[] {
    return this.sortBy ? this.sortedVehicles : this.filteredVehicles;
  }

  get sortedVehicles(): Vehicle[] {
    const list = [...this.filteredVehicles];
    if (this.sortBy === 'capacity') list.sort((a, b) => (b.maxCapacityKg ?? 0) - (a.maxCapacityKg ?? 0));
    else if (this.sortBy === 'odometer') list.sort((a, b) => (b.odometerKm ?? 0) - (a.odometerKm ?? 0));
    else if (this.sortBy === 'acquisitionCost')
      list.sort((a, b) => (b.acquisitionCost ?? 0) - (a.acquisitionCost ?? 0));
    return list;
  }

  get endCount(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  retireVehicle(vehicleId: string): void {
    if (!confirm('Are you sure you want to retire this vehicle?')) return;
    this.vehiclesService.retireVehicle(vehicleId).subscribe({
      next: () => this.loadVehicles(),
      error: (err) => {
        console.error('Failed to retire vehicle', err);
        alert('Failed to retire vehicle. It may be currently on a trip.');
      },
    });
  }

  deleteVehicle(vehicleId: string): void {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    this.vehiclesService.deleteVehicle(vehicleId).subscribe({
      next: () => this.loadVehicles(),
      error: (err) => {
        console.error('Failed to delete vehicle', err);
        alert('Failed to delete vehicle.');
      },
    });
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.pageNumber = newPage;
    this.loadVehicles();
  }

  onPageSizeChange(newSize: number | string): void {
    this.pageSize = normalizePageSize(Number(newSize));
    this.pageSizeModel = this.pageSize.toString();
    this.pageNumber = 1;
    this.loadVehicles();
  }

  onFiltersChanged(): void {
    this.pageNumber = 1;
    this.loadVehicles();
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  toggleModal(): void {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) this.loadVehicles();
  }
}
