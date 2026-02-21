import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/shared/alert.service';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { MaintenanceApiService } from '../../services/controllers/maintenance-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { MaintenanceLog, CreateMaintenanceRequest } from '../../core/models/maintenance.model';
import { Vehicle } from '../../core/models/vehicle.model';
import {
  COMMON_PAGE_SIZE_OPTIONS,
  MAINTENANCE_SORT_OPTIONS,
} from '../../core/constants/ui.constants';
import {
  EntityDetailModalComponent,
  DetailSection,
} from '../../shared/components/entity-detail-modal/entity-detail-modal.component';

@Component({
  selector: 'app-view-service-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataPageLayout,
    EntityDetailModalComponent,
    SearchableSelectComponent,
    CustomCellDirective,
  ],
  templateUrl: './view-service-log.html',
  styleUrl: './view-service-log.scss',
})
export class ViewServiceLog implements OnInit {
  logs: MaintenanceLog[] = [];
  isLoading = true;

  // Detail modal
  selectedLog: MaintenanceLog | null = null;
  showLogDetail = false;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'In Progress', label: 'In Progress' },
  ];

  readonly sortOptions = MAINTENANCE_SORT_OPTIONS;

  readonly pageSizeOptions = COMMON_PAGE_SIZE_OPTIONS;

  onFiltersChanged(): void {
    this.pageNumber = 1;
    // If the backend supported filtering, we would pass these to loadLogs.
    // However, the current component applies filtering client-side on the paginated result list:
    // This is retained from the original behavior.
  }

  onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.pageSize = parsedPageSize;
    this.pageNumber = 1;
    this.loadLogs();
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

  columns: TableColumn[] = [
    { key: 'maintenanceId', title: 'Log ID', align: 'center', type: 'custom' },
    { key: 'vehicleInfo', title: 'Vehicle', align: 'left', type: 'custom' },
    { key: 'description', title: 'Issue/Service', align: 'left', type: 'string' },
    { key: 'serviceDate', title: 'Date', align: 'center', type: 'date' },
    { key: 'cost', title: 'Cost', align: 'right', type: 'currency' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
    { key: 'actions', title: 'ACTIONS', align: 'center', type: 'actions' },
  ];

  constructor(
    private maintenanceService: MaintenanceApiService,
    private vehiclesService: VehiclesApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.loadLogs();
    this.loadVehicles();
  }

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;

  getVehicleOptions(): SearchableSelectOption[] {
    return this.vehicles().map((v) => ({
      value: v.id,
      label: `${v.name} (${v.licensePlate})`,
    }));
  }
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

  async closeLog(id: string) {
    const confirmed = await this.alertService.confirm({
      title: 'Complete Maintenance?',
      text: 'Are you sure you want to mark this maintenance log as completed?',
      confirmButtonText: 'Yes, complete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1e3fae',
    });
    if (!confirmed.isConfirmed) return;

    this.maintenanceService.closeMaintenance(id).subscribe({
      next: () => {
        this.alertService.success('Success', 'Maintenance log closed successfully.');
        this.loadLogs();
      },
      error: (err) => {
        this.alertService.showApiError(err);
      },
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
        this.alertService.success('Success', 'Maintenance log created successfully.');
        this.loadLogs();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(err.error?.errorMessage || 'Failed to create maintenance log.');
      },
    });
  }

  openLogDetail(log: MaintenanceLog): void {
    this.selectedLog = log;
    this.showLogDetail = true;
  }

  closeLogDetail(): void {
    this.showLogDetail = false;
    this.selectedLog = null;
  }

  buildLogSections(log: MaintenanceLog): DetailSection[] {
    return [
      {
        title: 'Service Details',
        fields: [
          { label: 'Log ID', value: log.maintenanceId.substring(0, 8).toUpperCase() },
          {
            label: 'Status',
            value: log.isClosed ? 'Completed' : 'In Progress',
            type: 'badge',
            badgeClass: log.isClosed ? 'status-completed' : 'status-progress',
          },
          { label: 'Description', value: log.description },
          { label: 'Service Date', value: new Date(log.serviceDate).toLocaleDateString('en-IN') },
        ],
      },
      {
        title: 'Vehicle & Cost',
        fields: [
          {
            label: 'Vehicle',
            value: log.vehicleName || log.vehicleId.substring(0, 8).toUpperCase(),
          },
          { label: 'License Plate', value: log.licensePlate },
          { label: 'Cost', value: log.cost, type: 'currency' },
          { label: 'Logged At', value: new Date(log.createdAt).toLocaleDateString('en-IN') },
        ],
      },
    ];
  }
}
