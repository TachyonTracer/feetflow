import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/shared/alert.service';
import { AddNewTrip } from './add-new-trip/add-new-trip';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { DriversApiService } from '../../services/controllers/drivers-api.service';
import { Trip, CreateTripRequest, TripStatus } from '../../core/models/trip.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { Driver } from '../../core/models/driver.model';
import { SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { COMMON_PAGE_SIZE_OPTIONS, TRIP_SORT_OPTIONS } from '../../core/constants/ui.constants';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import {
  EntityDetailModalComponent,
  DetailSection,
} from '../../shared/components/entity-detail-modal/entity-detail-modal.component';

@Component({
  selector: 'app-vehicle-trip-dispatcher',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataPageLayout,
    InrCurrencyPipe,
    AddNewTrip,
    EntityDetailModalComponent,
    CustomCellDirective,
  ],
  templateUrl: './vehicle-trip-dispatcher.html',
  styleUrl: './vehicle-trip-dispatcher.scss',
})
export class VehicleTripDispatcher implements OnInit {
  isAddTripModalOpen = false;

  trips: Trip[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];

  isLoadingLogs = false;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  readonly sortOptions = TRIP_SORT_OPTIONS;

  readonly pageSizeOptions = COMMON_PAGE_SIZE_OPTIONS;

  completeTripId = '';
  completeEndOdometer = 0;
  completeRevenue = 0;
  showCompleteModal = false;

  // Detail modal
  selectedTrip: Trip | null = null;
  showTripDetail = false;

  columns: TableColumn[] = [
    { key: 'tripId', title: 'Trip ID', align: 'center', type: 'custom' },
    { key: 'vehicleName', title: 'Vehicle', align: 'left', type: 'custom' },
    { key: 'driverName', title: 'Driver', align: 'left', type: 'custom' },
    { key: 'cargoWeightKg', title: 'Cargo (kg)', align: 'center', type: 'custom' },
    { key: 'route', title: 'Route', align: 'center', type: 'custom' },
    { key: 'revenue', title: 'Revenue', align: 'left', type: 'custom' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
    { key: 'actions', title: 'Actions', align: 'center', type: 'actions' },
  ];

  constructor(
    private tripsService: TripsApiService,
    private vehiclesService: VehiclesApiService,
    private driversService: DriversApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.loadActiveTrips();
    this.loadDropdownData();
  }

  get filteredTrips(): Trip[] {
    let filtered = this.trips;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(term) ||
          (t.vehicleName && t.vehicleName.toLowerCase().includes(term)) ||
          (t.driverName && t.driverName.toLowerCase().includes(term)) ||
          (t.destinationState && t.destinationState.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'status') return a.status.localeCompare(b.status);
        if (this.sortBy === 'id') return a.id.localeCompare(b.id);
        if (this.sortBy === 'cargoWeightKg') return (b.cargoWeightKg ?? 0) - (a.cargoWeightKg ?? 0);
        if (this.sortBy === 'revenue') return (b.revenue ?? 0) - (a.revenue ?? 0);
        return 0;
      });
    }

    return filtered;
  }

  tripPageNumber = 1;
  tripPageSize = 10;
  tripTotalCount = 0;
  tripTotalPages = 1;

  get startRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return (this.tripPageNumber - 1) * this.tripPageSize + 1;
  }

  get endRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return Math.min(this.tripPageNumber * this.tripPageSize, this.tripTotalCount);
  }

  loadActiveTrips() {
    this.isLoadingLogs = true;
    const statusFilter = this.currentStatus ? (this.currentStatus as TripStatus) : undefined;

    this.tripsService.getTrips(this.tripPageNumber, this.tripPageSize, statusFilter).subscribe({
      next: (res) => {
        this.trips = res.items ?? [];
        this.tripTotalCount = res.totalCount ?? 0;
        this.tripTotalPages = res.totalPages || 1;
        this.tripPageNumber = res.pageNumber || this.tripPageNumber;
        this.tripPageSize = res.pageSize || this.tripPageSize;
        this.isLoadingLogs = false;
      },
      error: (err) => {
        this.alertService.showApiError(err);
        this.isLoadingLogs = false;
      },
    });
  }

  loadDropdownData() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles = res.items ?? [];
      },
      error: (err) => {
        console.error('Failed to load vehicles', err);
      },
    });

    this.driversService.getDrivers(1, 100).subscribe({
      next: (res) => {
        this.drivers = res.items ?? [];
      },
      error: (err) => {
        console.error('Failed to load drivers', err);
      },
    });
  }

  changeTripPage(page: number) {
    if (page < 1 || page > this.tripTotalPages) return;
    this.tripPageNumber = page;
    this.loadActiveTrips();
  }

  onFilterChanged(): void {
    this.tripPageNumber = 1;
    this.loadActiveTrips();
  }

  onSortChanged(): void {
    this.loadActiveTrips();
  }

  onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.tripPageSize = parsedPageSize;
    this.tripPageNumber = 1;
    this.loadActiveTrips();
  }

  getVehicleOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Select a fleet unit' },
      ...this.vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} - ${vehicle.licensePlate}`,
      })),
    ];
  }

  getDriverOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'Assign a driver' },
      ...this.drivers
        .filter((d) => d.status === 'OnDuty') // only available drivers
        .map((driver) => ({
          value: driver.id,
          label: `${driver.fullName} (${driver.licenseNumber})`,
        })),
    ];
  }

  openTripDetail(trip: Trip): void {
    this.selectedTrip = trip;
    this.showTripDetail = true;
  }

  closeTripDetail(): void {
    this.showTripDetail = false;
    this.selectedTrip = null;
  }

  buildTripSections(trip: Trip): DetailSection[] {
    const statusClasses: Record<string, string> = {
      Draft: 'status-draft',
      Dispatched: 'status-dispatched',
      Completed: 'status-completed',
      Cancelled: 'status-cancelled',
    };
    return [
      {
        title: 'Trip Overview',
        fields: [
          { label: 'Trip ID', value: trip.id.toUpperCase() },
          {
            label: 'Status',
            value: trip.status,
            type: 'badge',
            badgeClass: statusClasses[trip.status] ?? '',
          },
          {
            label: 'Route',
            type: 'route',
            value: '',
            routeOrigin: trip.originState,
            routeDest: trip.destinationState,
          },
          { label: 'Cargo Weight', value: `${trip.cargoWeightKg} kg` },
        ],
      },
      {
        title: 'Assignment',
        fields: [
          { label: 'Vehicle', value: trip.vehicleName ?? this.getVehicleName(trip.vehicleId) },
          { label: 'Driver', value: trip.driverName ?? this.getDriverName(trip.driverId) },
        ],
      },
      {
        title: 'Financials & Odometer',
        fields: [
          { label: 'Revenue', value: trip.revenue ?? null, type: 'currency' },
          {
            label: 'Start Odometer',
            value: trip.startOdometer != null ? `${trip.startOdometer} km` : null,
          },
          {
            label: 'End Odometer',
            value: trip.endOdometer != null ? `${trip.endOdometer} km` : null,
          },
          {
            label: 'Completed At',
            value: trip.completedAt ? new Date(trip.completedAt).toLocaleDateString('en-IN') : null,
          },
        ],
      },
    ];
  }

  openAddTripModal(): void {
    this.isAddTripModalOpen = true;
  }

  closeAddTripModal(): void {
    this.isAddTripModalOpen = false;
  }

  onTripCreated(): void {
    this.loadActiveTrips();
  }

  dispatchTrip(tripId: string) {
    this.alertService
      .confirm({
        title: 'Dispatch Trip?',
        text: 'Are you sure you want to dispatch this trip now?',
        confirmButtonText: 'Yes, dispatch',
        cancelButtonText: 'No',
        confirmButtonColor: '#1e3fae',
      })
      .then((result: any) => {
        if (!result.isConfirmed) return;

        this.tripsService.dispatchTrip(tripId).subscribe({
          next: () => {
            this.alertService.success('Dispatched!', 'Trip has been successfully dispatched.');
            this.loadActiveTrips();
          },
          error: (err) => {
            this.alertService.showApiError(err);
          },
        });
      });
  }

  openCompleteModal(tripId: string) {
    this.completeTripId = tripId;
    this.completeEndOdometer = 0;
    this.completeRevenue = 0;
    this.showCompleteModal = true;
  }

  confirmCompleteTrip() {
    if (this.completeEndOdometer <= 0 || this.completeRevenue < 0) {
      this.alertService.warning(
        'Invalid Values',
        'Please enter valid end odometer and revenue values.',
      );
      return;
    }
    this.tripsService
      .completeTrip(this.completeTripId, {
        endOdometer: this.completeEndOdometer,
        revenue: this.completeRevenue,
      })
      .subscribe({
        next: () => {
          this.showCompleteModal = false;
          this.loadActiveTrips();
        },
        error: (err) => {
          console.error('Failed to complete trip', err);
        },
      });
  }

  cancelTrip(tripId: string) {
    this.alertService
      .confirm({
        title: 'Cancel Trip?',
        text: 'Are you sure you want to cancel this trip? This action cannot be undone.',
        confirmButtonText: 'Yes, cancel it',
        cancelButtonText: 'No',
        confirmButtonColor: '#dc2626',
      })
      .then((result: any) => {
        if (!result.isConfirmed) return;

        this.tripsService.cancelTrip(tripId).subscribe({
          next: () => {
            this.alertService.success('Cancelled!', 'Trip has been successfully cancelled.');
            this.loadActiveTrips();
          },
          error: (err) => {
            this.alertService.showApiError(err);
          },
        });
      });
  }

  getVehicleName(vehicleId: string): string {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.name}` : `Vehicle ${vehicleId.substring(0, 5)}`;
  }

  getDriverName(driverId: string): string {
    const driver = this.drivers.find((d) => d.id === driverId);
    return driver ? driver.fullName : `Driver ${driverId.substring(0, 5)}`;
  }
}
