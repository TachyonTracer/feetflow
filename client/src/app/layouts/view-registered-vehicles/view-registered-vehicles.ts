import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AddNewVehicle } from './add-new-vehicle/add-new-vehicle';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, AddNewVehicle, HeaderComponent],
  templateUrl: './view-registered-vehicles.html',
  styleUrl: './view-registered-vehicles.scss',
})
export class VehicleRegister implements OnInit {
  isModalOpen = false;
  vehicles: Vehicle[] = [];
  isLoading = true;
  pageNumber = 1;
  pageSize = 10;

  // Filter & Sort States
  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  constructor(private vehiclesService: VehiclesApiService) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.isLoading = true;
    // Fetch a larger set for client-side filtering
    this.vehiclesService.getVehicles(1, 200).subscribe({
      next: (res) => {
        this.vehicles = res.items || [];

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load vehicles', err);
        this.isLoading = false;
      },
    });
  }

  retireVehicle(vehicleId: string) {
    if (!confirm('Are you sure you want to retire this vehicle?')) return;
    this.vehiclesService.retireVehicle(vehicleId).subscribe({
      next: () => this.loadVehicles(),
      error: (err) => {
        console.error('Failed to retire vehicle', err);
        alert('Failed to retire vehicle. It may be currently on a trip.');
      },
    });
  }

  deleteVehicle(vehicleId: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    this.vehiclesService.deleteVehicle(vehicleId).subscribe({
      next: () => this.loadVehicles(),
      error: (err) => {
        console.error('Failed to delete vehicle', err);
        alert('Failed to delete vehicle.');
      },
    });
  }
  get filteredVehicles(): Vehicle[] {
    let filtered = this.vehicles;

    if (this.currentStatus) {
      filtered = filtered.filter((v) => v.status === this.currentStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.id.toLowerCase().includes(term) ||
          v.name.toLowerCase().includes(term) ||
          (v.licensePlate && v.licensePlate.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'capacity') {
          return (b.maxCapacityKg || 0) - (a.maxCapacityKg || 0);
        } else if (this.sortBy === 'odometer') {
          return (b.odometerKm || 0) - (a.odometerKm || 0);
        }
        return 0;
      });
    }

    return filtered;
  }

  get paginatedVehicles(): Vehicle[] {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    return this.filteredVehicles.slice(startIndex, startIndex + this.pageSize);
  }

  get totalCount(): number {
    return this.filteredVehicles.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get endCount(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.pageNumber = newPage;
      this.loadVehicles();
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) {
      this.loadVehicles();
    }
  }
}
