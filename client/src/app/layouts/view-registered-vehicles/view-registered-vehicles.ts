import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddNewVehicle } from './add-new-vehicle/add-new-vehicle';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, AddNewVehicle],
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

  constructor(private vehiclesService: VehiclesApiService) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.isLoading = true;
    this.vehiclesService.getVehicles(this.pageNumber, this.pageSize).subscribe({
      next: (res) => {
        this.vehicles = res.items || [];
        this.totalCount = res.totalCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
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
