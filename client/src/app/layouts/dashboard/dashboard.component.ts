import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { DashboardMetrics } from '../../core/models/analytics.model';
import { Trip } from '../../core/models/trip.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
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
    this.tripsService.getTrips(1, 50).subscribe({
      next: (res) => {
        this.trips = res.items;
        this.isLoadingTrips = false;
      },
      error: (err) => {
        console.error('Failed to load trips', err);
        this.isLoadingTrips = false;
      },
    });
  }

  get filteredTrips(): Trip[] {
    let filtered = this.trips;

    if (this.currentStatus) {
      filtered = filtered.filter((t) => t.status === this.currentStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.trip_id.toLowerCase().includes(term) ||
          (t.vehicleName && t.vehicleName.toLowerCase().includes(term)) ||
          (t.driverName && t.driverName.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'status') return a.status.localeCompare(b.status);
        if (this.sortBy === 'id') return a.trip_id.localeCompare(b.trip_id);
        return 0;
      });
    }

    return filtered.slice(0, 5); // dashboard typically shows only the top few
  }
}
