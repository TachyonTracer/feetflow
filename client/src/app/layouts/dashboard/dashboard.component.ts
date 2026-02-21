import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { TripsApiService } from '../../services/controllers/trips-api.service';
import { DashboardMetrics } from '../../core/models/analytics.model';
import { Trip } from '../../core/models/trip.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class Dashboard implements OnInit {
  metrics$?: Observable<DashboardMetrics>;
  trips: Trip[] = [];
  isLoadingTrips = true;

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
    this.tripsService.getTrips(1, 5).subscribe({
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
}
