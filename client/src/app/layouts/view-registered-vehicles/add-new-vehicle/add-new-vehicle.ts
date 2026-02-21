import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-new-vehicle',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-new-vehicle.html',
  styleUrl: './add-new-vehicle.scss',
})
export class AddNewVehicle {
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
