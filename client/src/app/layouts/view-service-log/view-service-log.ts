import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceApiService } from '../../services/controllers/maintenance-api.service';
import { MaintenanceLog } from '../../core/models/maintenance.model';

@Component({
  selector: 'app-view-service-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-service-log.html',
  styleUrl: './view-service-log.scss',
})
export class ViewServiceLog implements OnInit {
  logs: MaintenanceLog[] = [];
  isLoading = true;

  searchTerm: string = '';
  currentStatus: string = '';
  sortBy: string = '';

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

  get filteredLogs(): MaintenanceLog[] {
    let filtered = this.logs;

    if (this.currentStatus) {
      const isClosedMatches = this.currentStatus === 'Completed';
      filtered = filtered.filter((l) => Boolean(l.isClosed) === isClosedMatches);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.maintenance_id.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          (l.vehicleName && l.vehicleName.toLowerCase().includes(term)),
      );
    }

    if (this.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'date-desc') {
          return new Date(b.serviceDate || 0).getTime() - new Date(a.serviceDate || 0).getTime();
        } else if (this.sortBy === 'date-asc') {
          return new Date(a.serviceDate || 0).getTime() - new Date(b.serviceDate || 0).getTime();
        } else if (this.sortBy === 'cost-desc') {
          return (b.cost || 0) - (a.cost || 0);
        } else if (this.sortBy === 'cost-asc') {
          return (a.cost || 0) - (b.cost || 0);
        }
        return 0;
      });
    }

    return filtered;
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
