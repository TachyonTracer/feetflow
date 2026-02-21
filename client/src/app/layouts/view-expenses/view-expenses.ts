import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddExpenses } from '../add-expenses/add-expenses';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-expenses',
  imports: [CommonModule, AddExpenses],
  templateUrl: './view-expenses.html',
  styleUrl: './view-expenses.scss',
})
export class ViewExpenses {
  isAddExpenseModalOpen = false;

  toggleModal() {
    this.isAddExpenseModalOpen = !this.isAddExpenseModalOpen;
  }
}
