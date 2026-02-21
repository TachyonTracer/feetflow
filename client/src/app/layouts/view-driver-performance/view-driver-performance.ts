import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Driver, CreateDriverRequest } from '../../core/models/driver.model';

@Component({
  selector: 'app-view-driver-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './view-driver-performance.html',
  styleUrl: './view-driver-performance.scss',
})
export class ViewDriverPerformance implements OnInit {
  drivers = signal<Driver[]>([]);
  filteredDrivers = signal<Driver[]>([]);
  isLoading = signal(true);
  searchTerm = '';

  showCreateModal = signal(false);
  isSubmitting = signal(false);
  formError = signal('');

  newDriver: CreateDriverRequest = {
    fullName: '',
    licenseNumber: '',
    licenseCategory: '',
    licenseExpiry: '',
  };

  constructor(private driversApiService: DriversApiService) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.isLoading.set(true);
    this.driversApiService.getDrivers().subscribe({
      next: (data) => {
        this.drivers.set(data);
        this.filteredDrivers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load drivers', err);
        this.isLoading.set(false);
      },
    });
  }

  filterDrivers(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredDrivers.set(this.drivers());
      return;
    }
    this.filteredDrivers.set(
      this.drivers().filter(
        (d) =>
          d.fullName.toLowerCase().includes(term) || d.licenseNumber.toLowerCase().includes(term),
      ),
    );
  }

  isLicenseExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays > 0;
  }

  isLicenseExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
  }

  suspendDriver(driverId: string): void {
    if (!confirm('Are you sure you want to suspend this driver?')) return;
    this.driversApiService.suspendDriver(driverId).subscribe({
      next: () => this.loadDrivers(),
      error: (err) => {
        console.error('Failed to suspend driver', err);
        alert(err.error?.errorMessage || 'Failed to suspend driver.');
      },
    });
  }

  openCreateModal(): void {
    this.newDriver = { fullName: '', licenseNumber: '', licenseCategory: '', licenseExpiry: '' };
    this.formError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitNewDriver(): void {
    if (
      !this.newDriver.fullName ||
      !this.newDriver.licenseNumber ||
      !this.newDriver.licenseCategory ||
      !this.newDriver.licenseExpiry
    ) {
      this.formError.set('All fields are required.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set('');

    this.driversApiService.createDriver(this.newDriver).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showCreateModal.set(false);
        this.loadDrivers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(err.error?.errorMessage || 'Failed to create driver.');
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OnDuty':
        return 'badge-emerald';
      case 'OnTrip':
        return 'badge-blue';
      case 'OffDuty':
        return 'badge-amber';
      case 'Suspended':
        return 'badge-rose';
      default:
        return 'badge-amber';
    }
  }
}
