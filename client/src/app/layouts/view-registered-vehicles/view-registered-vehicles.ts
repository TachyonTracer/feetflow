import { Component, OnInit } from '@angular/core';
import { AlertService } from '../../services/shared/alert.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddNewVehicle } from './add-new-vehicle/add-new-vehicle';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { Vehicle, VehicleStatus, UpdateVehicleRequest } from '../../core/models/vehicle.model';
import { VehicleRoi } from '../../core/models/analytics.model';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { PAGE_SIZE_OPTIONS, normalizePageSize } from '../../core/models/paged-result.model';
import { SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { COMMON_PAGE_SIZE_OPTIONS, VEHICLE_SORT_OPTIONS } from '../../core/constants/ui.constants';
import {
  EntityDetailModalComponent,
  DetailSection,
} from '../../shared/components/entity-detail-modal/entity-detail-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddNewVehicle,
    DataPageLayout,
    InrCurrencyPipe,
    EntityDetailModalComponent,
    CustomCellDirective,
  ],
  templateUrl: './view-registered-vehicles.html',
  styleUrl: './view-registered-vehicles.scss',
})
export class VehicleRegister implements OnInit {
  isModalOpen = false;
  vehicles: Vehicle[] = [];
  isLoading = true;

  // Detail modal
  selectedVehicle: Vehicle | null = null;
  selectedVehicleRoi: VehicleRoi | null = null;
  showVehicleDetail = false;
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Edit modal
  showEditModal = false;
  editingVehicle: Vehicle | null = null;
  editForm: UpdateVehicleRequest = {
    name: '',
    licensePlate: '',
    vehicleType: '',
    maxCapacityKg: 0,
    odometerKm: 0,
    acquisitionCost: 0,
    xmin: 0,
  };
  isUpdating = false;
  editError = '';

  readonly pageSizeOptions = COMMON_PAGE_SIZE_OPTIONS;
  searchTerm = '';
  currentStatus: string = '';
  sortBy: string = '';
  pageSizeModel = this.pageSize.toString();

  columns: TableColumn[] = [
    { key: 'srNo', title: 'Sr.No', align: 'left', type: 'custom' },
    { key: 'licensePlate', title: 'Plate', align: 'left', type: 'string' },
    { key: 'name', title: 'Model', align: 'left', type: 'string' },
    { key: 'vehicleType', title: 'Type', align: 'left', type: 'custom' },
    { key: 'maxCapacityKg', title: 'Capacity', align: 'left', type: 'custom' },
    { key: 'odometerKm', title: 'Odometer', align: 'left', type: 'custom' },
    { key: 'acquisitionCost', title: 'Acquisition Cost', align: 'left', type: 'custom' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
    { key: 'actions', title: 'Actions', align: 'center', type: 'actions' },
  ];

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'InShop', label: 'In Shop' },
    { value: 'OnTrip', label: 'On Trip' },
    { value: 'Retired', label: 'Retired' },
  ];

  readonly sortOptions = VEHICLE_SORT_OPTIONS;

  get pageSizeOptionsForSelect(): SearchableSelectOption[] {
    return this.pageSizeOptions;
  }

  constructor(
    private vehiclesService: VehiclesApiService,
    private analyticsApiService: AnalyticsApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    const statusFilter = this.currentStatus ? (this.currentStatus as VehicleStatus) : undefined;
    this.vehiclesService
      .getVehicles(this.pageNumber, this.pageSize, statusFilter, false)
      .subscribe({
        next: (res: any) => {
          this.vehicles = res.items ?? [];
          this.totalCount = res.totalCount ?? 0;
          this.totalPages = (res.totalPages ?? Math.ceil(this.totalCount / this.pageSize)) || 1;
          this.pageNumber = res.pageNumber || this.pageNumber;
          this.pageSize = res.pageSize || this.pageSize;
          this.pageSizeModel = this.pageSize.toString();
          this.isLoading = false;
        },
        error: (err: any) => {
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
        v.licensePlate?.toLowerCase().includes(term) ||
        v.vehicleType?.toLowerCase().includes(term),
    );
  }

  get displayVehicles(): Vehicle[] {
    return this.sortBy ? this.sortedVehicles : this.filteredVehicles;
  }

  get sortedVehicles(): Vehicle[] {
    const list = [...this.filteredVehicles];
    if (this.sortBy === 'capacity')
      list.sort((a, b) => (b.maxCapacityKg ?? 0) - (a.maxCapacityKg ?? 0));
    else if (this.sortBy === 'odometer')
      list.sort((a, b) => (b.odometerKm ?? 0) - (a.odometerKm ?? 0));
    else if (this.sortBy === 'acquisitionCost')
      list.sort((a, b) => (b.acquisitionCost ?? 0) - (a.acquisitionCost ?? 0));
    return list;
  }

  get endCount(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  retireVehicle(vehicleId: string): void {
    this.alertService
      .confirm({
        title: 'Retire Vehicle?',
        text: 'Are you sure you want to retire this vehicle?',
        confirmButtonText: 'Yes, retire it!',
        confirmButtonColor: '#d33',
      })
      .then((result: any) => {
        if (result.isConfirmed) {
          this.vehiclesService.retireVehicle(vehicleId).subscribe({
            next: () => {
              this.alertService.success('Retired!', 'The vehicle has been successfully retired.');
              this.loadVehicles();
            },
            error: (err: any) => {
              console.error('Failed to retire vehicle', err);
            },
          });
        }
      });
  }

  deleteVehicle(vehicleId: string): void {
    this.alertService
      .confirmDelete('Delete Vehicle?', "You won't be able to revert this! Are you sure?")
      .then((result: any) => {
        if (result.isConfirmed) {
          this.vehiclesService.deleteVehicle(vehicleId).subscribe({
            next: () => {
              this.alertService.success('Deleted!', 'The vehicle has been permanently deleted.');
              this.loadVehicles();
            },
            error: (err: any) => {
              this.alertService.showApiError(err);
            },
          });
        }
      });
  }

  openEditModal(vehicle: Vehicle): void {
    this.editingVehicle = vehicle;
    this.editForm = {
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      maxCapacityKg: vehicle.maxCapacityKg,
      odometerKm: vehicle.odometerKm,
      acquisitionCost: vehicle.acquisitionCost,
      xmin: vehicle.xmin,
    };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingVehicle = null;
  }

  saveEditedVehicle(): void {
    if (!this.editingVehicle) return;
    if (!this.editForm.name || !this.editForm.licensePlate) {
      this.editError = 'Name and license plate are required.';
      return;
    }

    this.isUpdating = true;
    this.vehiclesService.updateVehicle(this.editingVehicle.id, this.editForm).subscribe({
      next: () => {
        this.alertService.success('Updated!', 'Vehicle details have been updated.');
        this.isUpdating = false;
        this.closeEditModal();
        this.loadVehicles();
      },
      error: (err: any) => {
        this.alertService.showApiError(err);
        this.isUpdating = false;
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

  openVehicleDetail(vehicle: Vehicle): void {
    this.vehiclesService.getVehicleById(vehicle.id).subscribe({
      next: (fullVehicle: any) => {
        this.selectedVehicle = fullVehicle;
        this.fetchRoiAndOpenModal(vehicle.id);
      },
      error: (err: any) => {
        console.error('Failed to load vehicle details', err);
        // Fallback to basic data if detail fetch fails
        this.selectedVehicle = vehicle;
        this.fetchRoiAndOpenModal(vehicle.id);
      },
    });
  }

  private fetchRoiAndOpenModal(vehicleId: string): void {
    this.analyticsApiService.getVehicleRoi(vehicleId).subscribe({
      next: (roi) => {
        this.selectedVehicleRoi = roi;
        this.showVehicleDetail = true;
      },
      error: (err) => {
        console.error('Failed to fetch ROI', err);
        this.selectedVehicleRoi = null;
        this.showVehicleDetail = true;
      },
    });
  }

  closeVehicleDetail(): void {
    this.showVehicleDetail = false;
    this.selectedVehicle = null;
    this.selectedVehicleRoi = null;
  }

  buildVehicleSections(v: Vehicle): DetailSection[] {
    const statusClasses: Record<string, string> = {
      Available: 'status-active',
      OnTrip: 'status-dispatched',
      InShop: 'status-maintenance',
      InMaintenance: 'status-maintenance',
      Retired: 'status-inactive',
    };
    return [
      {
        title: 'Identification',
        fields: [
          { label: 'Vehicle ID', value: v.id.substring(0, 8).toUpperCase() },
          { label: 'License Plate', value: v.licensePlate },
          { label: 'Model / Name', value: v.name },
          { label: 'Type', value: v.vehicleType },
          {
            label: 'Status',
            value: v.status,
            type: 'badge',
            badgeClass: statusClasses[v.status] ?? '',
          },
        ],
      },
      {
        title: 'Specifications',
        fields: [
          { label: 'Max Capacity', value: `${v.maxCapacityKg} kg` },
          { label: 'Odometer', value: `${v.odometerKm.toLocaleString()} km` },
          { label: 'Acquisition Cost', value: v.acquisitionCost, type: 'currency' },
        ],
      },
      {
        title: 'Operational Costs',
        fields: [
          { label: 'Fuel Expenses', value: v.totalFuelCost ?? 0, type: 'currency' },
          { label: 'Maintenance Bills', value: v.totalMaintenanceCost ?? 0, type: 'currency' },
          { label: 'Misc. Expenses', value: v.totalMiscExpense ?? 0, type: 'currency' },
          {
            label: 'Total Operational Cost',
            value: v.totalOperationalCost ?? 0,
            type: 'currency',
            badgeClass: 'status-active',
          },
        ],
      },
      ...(v.activeTripOriginState || v.activeTripDestinationState
        ? [
            {
              title: 'Active Trip',
              fields: [
                {
                  label: 'Route',
                  type: 'route' as const,
                  value: '',
                  routeOrigin: v.activeTripOriginState,
                  routeDest: v.activeTripDestinationState,
                },
              ],
            },
          ]
        : []),
      ...(this.selectedVehicleRoi
        ? [
            {
              title: 'Return on Investment',
              fields: [
                {
                  label: 'Total Revenue',
                  value: this.selectedVehicleRoi.totalRevenue,
                  type: 'currency' as const,
                },
                {
                  label: 'Fuel/Maintenance',
                  value:
                    this.selectedVehicleRoi.totalFuelCost +
                    this.selectedVehicleRoi.totalMaintenanceCost,
                  type: 'currency' as const,
                },
                {
                  label: 'ROI %',
                  value: `${(this.selectedVehicleRoi.roi * 100).toFixed(1)}%`,
                  type: 'badge' as const,
                  badgeClass:
                    this.selectedVehicleRoi.roi >= 0 ? 'status-active' : 'status-inactive',
                },
              ],
            },
          ]
        : []),
    ];
  }
}
