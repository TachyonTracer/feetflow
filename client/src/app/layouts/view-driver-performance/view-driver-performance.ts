import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Driver, CreateDriverRequest } from '../../core/models/driver.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-view-driver-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SearchableSelectComponent],
  templateUrl: './view-driver-performance.html',
  styleUrl: './view-driver-performance.scss',
})
export class ViewDriverPerformance implements OnInit {
  drivers = signal<Driver[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  currentStatus = '';
  sortBy = '';

  showCreateModal = signal(false);
  isSubmitting = signal(false);
  formError = signal('');

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'OnDuty', label: 'On Duty' },
    { value: 'OnTrip', label: 'On Trip' },
    { value: 'OffDuty', label: 'Off Duty' },
    { value: 'Suspended', label: 'Suspended' },
  ];

  readonly sortOptions: SearchableSelectOption[] = [
    { value: '', label: 'Sort By' },
    { value: 'name', label: 'Name' },
    { value: 'licenseExpiry', label: 'License Expiry' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Created Date' },
  ];

  readonly pageSizeOptions: SearchableSelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
  ];

  newDriver: CreateDriverRequest = {
    fullName: '',
    licenseNumber: '',
    licenseCategory: '',
    licenseExpiry: '',
  };

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(private driversApiService: DriversApiService) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.isLoading.set(true);
    this.driversApiService.getDrivers(1, 500).subscribe({
      next: (res) => {
        this.drivers.set(res.items ?? []);
        this.recalculatePagination();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load drivers', err);
        this.isLoading.set(false);
      },
    });
  }

  get filteredDrivers(): Driver[] {
    const searchTerm = this.searchTerm.toLowerCase().trim();
    let list = this.drivers();

    if (this.currentStatus) {
      list = list.filter((driver) => driver.status === this.currentStatus);
    }

    if (searchTerm) {
      list = list.filter(
        (driver) =>
          driver.fullName.toLowerCase().includes(searchTerm) ||
          driver.licenseNumber.toLowerCase().includes(searchTerm) ||
          driver.licenseCategory.toLowerCase().includes(searchTerm),
      );
    }

    if (this.sortBy) {
      list = [...list].sort((leftDriver, rightDriver) => {
        if (this.sortBy === 'name') return leftDriver.fullName.localeCompare(rightDriver.fullName);
        if (this.sortBy === 'status') return leftDriver.status.localeCompare(rightDriver.status);
        if (this.sortBy === 'licenseExpiry') {
          return (
            new Date(leftDriver.licenseExpiry).getTime() - new Date(rightDriver.licenseExpiry).getTime()
          );
        }
        if (this.sortBy === 'createdAt') {
          return new Date(rightDriver.createdAt).getTime() - new Date(leftDriver.createdAt).getTime();
        }
        return 0;
      });
    }

    return list;
  }

  get paginatedDrivers(): Driver[] {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    return this.filteredDrivers.slice(startIndex, startIndex + this.pageSize);
  }

  get startRecord(): number {
    if (this.totalCount === 0) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
  }

  onFiltersChanged(): void {
    this.pageNumber = 1;
    this.recalculatePagination();
  }

  onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.pageSize = parsedPageSize;
    this.pageNumber = 1;
    this.recalculatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, this.pageNumber - 2);
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  private recalculatePagination(): void {
    this.totalCount = this.filteredDrivers.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }
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
