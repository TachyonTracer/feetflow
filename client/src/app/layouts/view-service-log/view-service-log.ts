import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceApiService } from '../../services/controllers/maintenance-api.service';
import { MaintenanceLog } from '../../core/models/maintenance.model';

@Component({
  selector: 'app-view-service-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-service-log.html',
  styleUrl: './view-service-log.scss',
})
export class ViewServiceLog implements OnInit {
  logs: MaintenanceLog[] = [];
  isLoading = true;

  constructor(private maintenanceService: MaintenanceApiService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.maintenanceService.getMaintenanceLogs().subscribe({
      next: (res: any) => {
        this.logs = res.items || res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load logs', err);
        this.isLoading = false;
      },
    });
  }

  closeLog(id: string) {
    this.maintenanceService.closeMaintenance(id).subscribe({
      next: () => {
        this.loadLogs();
      },
      error: (err) => {
        console.error('Failed to close log', err);
      },
    });
  }
}
