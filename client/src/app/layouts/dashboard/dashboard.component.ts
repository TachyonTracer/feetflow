import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { DashboardMetrics } from '../../core/models/analytics.model';
import { Trip, TripStatus } from '../../core/models/trip.model';
import { Observable } from 'rxjs';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, HeaderComponent, SearchableSelectComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class Dashboard implements OnInit {
  metrics$?: Observable<DashboardMetrics>;
  trips: Trip[] = [];
  isLoadingTrips = true;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

  tripPageNumber = 1;
  tripPageSize = 5;
  tripTotalCount = 0;
  tripTotalPages = 1;

  readonly statusOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  readonly sortOptions: SearchableSelectOption[] = [
    { value: '', label: 'Sort By' },
    { value: 'status', label: 'Status' },
    { value: 'id', label: 'Trip ID' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'driver', label: 'Driver' },
  ];

  readonly pageSizeOptions: SearchableSelectOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
  ];

  constructor(
    private analyticsService: AnalyticsApiService,
    private tripsService: TripsApiService,
  ) {}

  ngOnInit() {
    this.metrics$ = this.analyticsService.getDashboard();
    this.loadRecentTrips();
  }

  loadRecentTrips() {
    this.isLoadingTrips = true;
    const statusFilter = this.currentStatus ? (this.currentStatus as TripStatus) : undefined;

    this.tripsService.getTrips(this.tripPageNumber, this.tripPageSize, statusFilter).subscribe({
      next: (res) => {
        this.trips = res.items ?? [];
        this.tripTotalCount = res.totalCount ?? 0;
        this.tripTotalPages = res.totalPages || 1;
        this.tripPageNumber = res.pageNumber || this.tripPageNumber;
        this.tripPageSize = res.pageSize || this.tripPageSize;
        this.isLoadingTrips = false;
      },
      error: (err) => {
        console.error('Failed to load trips', err);
        this.isLoadingTrips = false;
      },
    });
  }

  get displayTrips(): Trip[] {
    let filtered = this.trips;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(term) ||
          (t.vehicleName && t.vehicleName.toLowerCase().includes(term)) ||
          (t.driverName && t.driverName.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'status') return a.status.localeCompare(b.status);
        if (this.sortBy === 'id') return a.id.localeCompare(b.id);
        if (this.sortBy === 'vehicle')
          return (a.vehicleName || '').localeCompare(b.vehicleName || '');
        if (this.sortBy === 'driver') return (a.driverName || '').localeCompare(b.driverName || '');
        return 0;
      });
    }

    return filtered;
  }

  get startRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return (this.tripPageNumber - 1) * this.tripPageSize + 1;
  }

  get endRecord(): number {
    if (this.tripTotalCount === 0) return 0;
    return Math.min(this.tripPageNumber * this.tripPageSize, this.tripTotalCount);
  }

  changeTripPage(newPage: number): void {
    if (newPage < 1 || newPage > this.tripTotalPages || newPage === this.tripPageNumber) return;
    this.tripPageNumber = newPage;
    this.loadRecentTrips();
  }

  onStatusChanged(status: string): void {
    this.currentStatus = status;
    this.tripPageNumber = 1;
    this.loadRecentTrips();
  }

  onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.tripPageSize = parsedPageSize;
    this.tripPageNumber = 1;
    this.loadRecentTrips();
  }
}
