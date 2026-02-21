import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MaintenanceApiService } from '../../services/controllers/maintenance-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { MaintenanceLog, CreateMaintenanceRequest } from '../../core/models/maintenance.model';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-view-service-log',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './view-service-log.html',
  styleUrl: './view-service-log.scss',
})
export class ViewServiceLog implements OnInit {
  logs: MaintenanceLog[] = [];
  isLoading = true;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  isStatusDropdownOpen = signal(false);
  isSortDropdownOpen = signal(false);

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'In Progress', label: 'In Progress' }
  ];

  sortOptions = [
    { value: '', label: 'Sort By...' },
    { value: 'date-desc', label: 'Date (Newest First)' },
    { value: 'date-asc', label: 'Date (Oldest First)' },
    { value: 'cost-desc', label: 'Cost (High to Low)' },
    { value: 'cost-asc', label: 'Cost (Low to High)' }
  ];

  get currentStatusLabel(): string {
    return this.statusOptions.find(o => o.value === this.currentStatus)?.label || 'All Statuses';
  }

  get currentSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.sortBy)?.label || 'Sort By...';
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.isSortDropdownOpen.set(false);
    this.isStatusDropdownOpen.set(!this.isStatusDropdownOpen());
  }

  toggleSortDropdown(event: Event) {
    event.stopPropagation();
    this.isStatusDropdownOpen.set(false);
    this.isSortDropdownOpen.set(!this.isSortDropdownOpen());
  }

  selectStatus(value: string) {
    this.currentStatus = value;
    this.isStatusDropdownOpen.set(false);
  }

  selectSort(value: string) {
    this.sortBy = value;
    this.isSortDropdownOpen.set(false);
  }

  checkClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.isStatusDropdownOpen.set(false);
      this.isSortDropdownOpen.set(false);
    }
  }

  get filteredLogs(): MaintenanceLog[] {
    let filtered = this.logs;

    if (this.currentStatus) {
      const isClosed = this.currentStatus === 'Completed';
      filtered = filtered.filter((l) => l.isClosed === isClosed);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.maintenanceId && l.maintenanceId.toLowerCase().includes(term)) ||
          (l.vehicleName && l.vehicleName.toLowerCase().includes(term)) ||
          (l.description && l.description.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'date-desc')
          return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
        if (this.sortBy === 'date-asc')
          return new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
        if (this.sortBy === 'cost-desc') return b.cost - a.cost;
        if (this.sortBy === 'cost-asc') return a.cost - b.cost;
        return 0;
      });
    }

    return filtered;
  }

  showCreateModal = signal(false);
  isSubmitting = signal(false);
  formError = signal('');
  vehicles = signal<Vehicle[]>([]);

  newLog: CreateMaintenanceRequest = {
    vehicleId: '',
    description: '',
    cost: 0,
    serviceDate: '',
  };

  constructor(
    private maintenanceService: MaintenanceApiService,
    private vehiclesService: VehiclesApiService,
  ) { }

  ngOnInit() {
    this.loadLogs();
    this.loadVehicles();
    document.addEventListener('click', this.checkClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.checkClickOutside.bind(this));
  }

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  loadLogs() {
    this.isLoading = true;
    this.maintenanceService.getMaintenanceLogs(this.pageNumber, this.pageSize).subscribe({
      next: (res) => {
        this.logs = res.items ?? [];
        this.totalCount = res.totalCount ?? 0;
        this.totalPages = (res.totalPages ?? Math.ceil(this.totalCount / this.pageSize)) || 1;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load logs', err);
        this.isLoading = false;
      },
    });
  }

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => this.vehicles.set(res.items ?? []),
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadLogs();
  }

  closeLog(id: string) {
    this.maintenanceService.closeMaintenance(id).subscribe({
      next: () => this.loadLogs(),
      error: (err) => console.error('Failed to close log', err),
    });
  }

  openCreateModal() {
    this.newLog = { vehicleId: '', description: '', cost: 0, serviceDate: '' };
    this.formError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitNewLog() {
    if (!this.newLog.vehicleId || !this.newLog.description || !this.newLog.serviceDate) {
      this.formError.set('Please fill in all required fields.');
      return;
    }
    this.isSubmitting.set(true);
    this.formError.set('');
    this.maintenanceService.createMaintenance(this.newLog).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showCreateModal.set(false);
        this.loadLogs();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(err.error?.errorMessage || 'Failed to create maintenance log.');
      },
    });
  }
}
