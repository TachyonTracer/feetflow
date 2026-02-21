import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-expenses',
  standalone: true,
  imports: [],
  templateUrl: './add-expenses.html',
  styleUrl: './add-expenses.scss',
})
export class AddExpenses {
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
