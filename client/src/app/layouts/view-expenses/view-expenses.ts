import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddExpenses } from '../add-expenses/add-expenses';
import { VehiclesApiService } from '../../services/controllers/vehicles-api.service';
import { FuelApiService } from '../../services/controllers/fuel-api.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { FuelLog } from '../../core/models/fuel.model';
import { SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import {
  DataPageLayout,
  TableColumn,
} from '../../shared/components/data-page-layout/data-page-layout';
import { CustomCellDirective } from '../../shared/directives/custom-cell.directive';
import { COMMON_PAGE_SIZE_OPTIONS, EXPENSE_SORT_OPTIONS } from '../../core/constants/ui.constants';

@Component({
  selector: 'app-view-expenses',
  imports: [
    CommonModule,
    FormsModule,
    AddExpenses,
    DataPageLayout,
    InrCurrencyPipe,
    CustomCellDirective,
  ],
  templateUrl: './view-expenses.html',
  styleUrl: './view-expenses.scss',
})
export class ViewExpenses implements OnInit {
  isAddExpenseModalOpen = false;
  vehicles: Vehicle[] = [];
  fuelLogs: FuelLog[] = [];
  selectedVehicleId = '';
  isLoading = false;
  totalFuelCost = 0;
  totalMiscExpense = 0;
  tripsCount = 0;
  editingLog: FuelLog | null = null;

  columns: TableColumn[] = [
    { key: 'tripId', title: 'Trip ID', align: 'center', type: 'custom' },
    { key: 'driverName', title: 'Driver', align: 'left', type: 'custom' },
    { key: 'vehicleName', title: 'Vehicle', align: 'left', type: 'custom' },
    { key: 'distance', title: 'Distance', align: 'right', type: 'custom' },
    { key: 'cost', title: 'Fuel Expense', align: 'right', type: 'custom' },
    { key: 'miscExpense', title: 'Misc Expense', align: 'right', type: 'custom' },
    { key: 'status', title: 'Status', align: 'center', type: 'custom' },
    { key: 'actions', title: 'Actions', align: 'center', type: 'actions' },
  ];

  readonly vehicleFilterOptions: SearchableSelectOption[] = [];

  readonly sortOptions = EXPENSE_SORT_OPTIONS;

  readonly pageSizeOptions = COMMON_PAGE_SIZE_OPTIONS;

  searchTerm = '';
  sortBy = '';

  fuelPageNumber = 1;
  fuelPageSize = 10;
  fuelTotalCount = 0;
  fuelTotalPages = 1;

  constructor(
    private vehiclesService: VehiclesApiService,
    private fuelService: FuelApiService,
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  get vehicleOptions(): SearchableSelectOption[] {
    return [
      { value: '', label: 'All Vehicles' },
      ...this.vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} - ${vehicle.licensePlate}`,
      })),
    ];
  }

  loadVehicles() {
    this.vehiclesService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles = res.items ?? [];
        this.loadFuelLogs();
      },
      error: (err) => console.error('Failed to load vehicles', err),
    });
  }

  loadFuelLogs() {
    this.isLoading = true;
    const vid = this.selectedVehicleId || undefined;
    this.fuelService.getFuelLogsByVehicle(vid, this.fuelPageNumber, this.fuelPageSize).subscribe({
      next: (res: any) => {
        const pagedRes = res.pagedResult;
        this.fuelLogs = pagedRes.items ?? [];
        this.fuelTotalCount = pagedRes.totalCount ?? 0;
        this.fuelTotalPages =
          (pagedRes.totalPages ?? Math.ceil(this.fuelTotalCount / this.fuelPageSize)) || 1;
        this.fuelPageNumber = pagedRes.pageNumber || this.fuelPageNumber;
        this.fuelPageSize = pagedRes.pageSize || this.fuelPageSize;

        this.totalFuelCost = res.totalFuelCost || 0;
        this.totalMiscExpense = res.totalMiscExpense || 0;
        this.tripsCount = res.tripsCount || 0;

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load fuel logs', err);
        this.isLoading = false;
      },
    });
  }

  get filteredLogs(): FuelLog[] {
    let list = this.fuelLogs;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(
        (log) =>
          log.id.toLowerCase().includes(term) ||
          this.getVehicleName(log.vehicleId).toLowerCase().includes(term),
      );
    }

    if (this.sortBy) {
      list = [...list].sort((a, b) => {
        if (this.sortBy === 'date')
          return new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime();
        if (this.sortBy === 'cost') return Number(b.cost) - Number(a.cost);
        if (this.sortBy === 'liters') return Number(b.liters) - Number(a.liters);
        return 0;
      });
    }

    return list;
  }

  onVehicleChange(vehicleId: string) {
    this.selectedVehicleId = vehicleId;
    this.fuelPageNumber = 1;
    this.loadFuelLogs();
  }

  getVehicleName(vehicleId: string): string {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : vehicleId.substring(0, 8);
  }

  getDriverName(log: FuelLog): string {
    if (log.driverName) return log.driverName;
    return 'Unassigned';
  }

  toggleModal() {
    if (this.isAddExpenseModalOpen) {
      this.editingLog = null;
    }
    this.isAddExpenseModalOpen = !this.isAddExpenseModalOpen;
  }

  openEditModal(log: FuelLog) {
    this.editingLog = log;
    this.isAddExpenseModalOpen = true;
  }

  onExpenseCreated() {
    this.editingLog = null;
    this.loadFuelLogs();
  }

  onFiltersChanged() {
    // Re-filtering is handled by the getter
  }

  changeFuelPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.fuelTotalPages) return;
    this.fuelPageNumber = pageNumber;
    this.loadFuelLogs();
  }

  onFuelPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.fuelPageSize = parsedPageSize;
    this.fuelPageNumber = 1;
    this.loadFuelLogs();
  }
}
