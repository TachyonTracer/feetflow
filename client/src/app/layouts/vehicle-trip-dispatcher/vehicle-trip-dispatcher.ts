import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle-trip-dispatcher',
  imports: [CommonModule],
  templateUrl: './vehicle-trip-dispatcher.html',
  styleUrl: './vehicle-trip-dispatcher.scss',
})
export class VehicleTripDispatcher {
  activeTab: 'log' | 'add' = 'log';
}
