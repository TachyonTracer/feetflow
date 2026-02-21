import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/shared/alert.service';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Driver, CreateDriverRequest, UpdateDriverRequest } from '../../core/models/driver.model';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';
import { COMMON_PAGE_SIZE_OPTIONS, DRIVER_SORT_OPTIONS } from '../../core/constants/ui.constants';

@Component({
  selector: 'app-view-driver-performance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataPageLayout,
    SearchableSelectComponent,
    CustomCellDirective,
  ],
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

  showEditModal = signal(false);
  isSubmittingEdit = signal(false);
  editFormError = signal('');

  editingDriverId: string | null = null;
  editingDriverXmin = 0;
  editingDriverData: UpdateDriverRequest = {
    fullName: '',
    licenseNumber: '',
    licenseCategory: '',
    licenseExpiry: '',
    completionRate: 0,
    safetyScore: 0,
    complaints: 0,
    xmin: 0,
  };

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'OnDuty', label: 'On Duty' },
    { value: 'OnTrip', label: 'On Trip' },
    { value: 'OffDuty', label: 'Off Duty' },
    { value: 'Suspended', label: 'Suspended' },
  ];

  readonly licenseCategoryOptions: SearchableSelectOption[] = [
    { value: '', label: 'Select Category' },
    { value: 'Light', label: 'Light Vehicle' },
    { value: 'Medium', label: 'Medium Vehicle' },
    { value: 'Heavy', label: 'Heavy Vehicle' },
    { value: 'Motorcycle', label: 'Motorcycle' },
  ];

  readonly sortOptions = DRIVER_SORT_OPTIONS;

  readonly pageSizeOptions = COMMON_PAGE_SIZE_OPTIONS;

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

  columns: TableColumn[] = [
    { key: 'driverInfo', title: 'Driver Name', align: 'left', type: 'custom' },
    { key: 'licenseExpiry', title: 'License Expiry', align: 'left', type: 'custom' },
    { key: 'completionRate', title: 'Completion Rate', align: 'left', type: 'custom' },
    { key: 'safetyScore', title: 'Safety Score', align: 'left', type: 'custom' },
    { key: 'complaints', title: 'Complaints', align: 'left', type: 'string' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
    { key: 'actions', title: 'Actions', align: 'center', type: 'actions' },
  ];

  constructor(
    private driversApiService: DriversApiService,
    private alertService: AlertService,
  ) {}

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
            new Date(leftDriver.licenseExpiry).getTime() -
            new Date(rightDriver.licenseExpiry).getTime()
          );
        }
        if (this.sortBy === 'createdAt') {
          return (
            new Date(rightDriver.createdAt).getTime() - new Date(leftDriver.createdAt).getTime()
          );
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
    this.alertService
      .confirm({
        title: 'Suspend Driver?',
        text: 'Are you sure you want to suspend this driver? They will not be eligible for new trips.',
        confirmButtonText: 'Yes, suspend',
        cancelButtonText: 'No',
        confirmButtonColor: '#dc2626',
      })
      .then((result: any) => {
        if (result.isConfirmed) {
          this.driversApiService.suspendDriver(driverId).subscribe({
            next: () => {
              this.alertService.success('Suspended!', 'The driver has been suspended.');
              this.loadDrivers();
            },
            error: (err) => this.alertService.showApiError(err),
          });
        }
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

  openEditModal(driver: Driver): void {
    this.editingDriverId = driver.id;
    this.editingDriverXmin = driver.xmin;
    this.editingDriverData = {
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry,
      completionRate: driver.completionRate,
      safetyScore: driver.safetyScore,
      complaints: driver.complaints,
      xmin: driver.xmin,
    };
    this.editFormError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingDriverId = null;
  }

  submitEditDriver(): void {
    if (
      !this.editingDriverData.fullName ||
      !this.editingDriverData.licenseNumber ||
      !this.editingDriverData.licenseCategory ||
      !this.editingDriverData.licenseExpiry ||
      !this.editingDriverId
    ) {
      this.editFormError.set('All fields are required.');
      return;
    }

    this.isSubmittingEdit.set(true);
    this.editFormError.set('');

    this.driversApiService.updateDriver(this.editingDriverId, this.editingDriverData).subscribe({
      next: () => {
        this.isSubmittingEdit.set(false);
        this.showEditModal.set(false);
        this.loadDrivers();
        this.alertService.success('Success', 'Driver updated successfully.');
      },
      error: (err) => {
        this.isSubmittingEdit.set(false);
        this.editFormError.set(err.error?.errorMessage || 'Failed to update driver.');
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OnDuty':
        return 'status-active';
      case 'OnTrip':
        return 'status-ontrip';
      case 'OffDuty':
        return 'status-inactive';
      case 'Suspended':
        return 'status-cancelled';
      default:
        return 'status-inactive';
    }
  }
}
