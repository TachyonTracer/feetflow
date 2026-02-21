import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddNewVehicle } from './add-new-vehicle/add-new-vehicle';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, AddNewVehicle],
  templateUrl: './view-registered-vehicles.html',
  styleUrl: './view-registered-vehicles.scss',
})
export class VehicleRegister {
  isModalOpen = false;

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
  }
}
