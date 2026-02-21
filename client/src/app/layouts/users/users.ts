import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersApiService } from '../../services/controllers/users-api.service';
import { User, UpdateUserRequest } from '../../core/models/user.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SearchableSelectComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  public users = signal<User[]>([]);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public editingUserId = signal<string | null>(null);
  public userForm = signal<UpdateUserRequest>({ fullName: '', role: 'Manager' });

  public searchTerm = '';
  public currentRole = '';
  public sortBy = '';

  public pageNumber = 1;
  public pageSize = 10;
  public totalCount = 0;
  public totalPages = 1;

  readonly roleOptions: SearchableSelectOption[] = [
    { value: '', label: 'All Roles' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Dispatcher', label: 'Dispatcher' },
    { value: 'SafetyOfficer', label: 'Safety Officer' },
    { value: 'FinancialAnalyst', label: 'Financial Analyst' },
  ];

  readonly sortOptions: SearchableSelectOption[] = [
    { value: '', label: 'Sort By' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'joinedDate', label: 'Joined Date' },
  ];

  readonly pageSizeOptions: SearchableSelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
  ];

  constructor(private usersApiService: UsersApiService) {}

  public ngOnInit(): void {
    this.fetchUsers();
  }

  public fetchUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersApiService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users.set(data);
        this.recalculatePagination();
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.errorMessage.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  get filteredUsers(): User[] {
    let list = this.users();
    const searchTerm = this.searchTerm.toLowerCase().trim();

    if (this.currentRole) {
      list = list.filter((user) => user.role === this.currentRole);
    }

    if (searchTerm) {
      list = list.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.role.toLowerCase().includes(searchTerm),
      );
    }

    if (this.sortBy) {
      list = [...list].sort((leftUser, rightUser) => {
        if (this.sortBy === 'name') return leftUser.fullName.localeCompare(rightUser.fullName);
        if (this.sortBy === 'email') return leftUser.email.localeCompare(rightUser.email);
        if (this.sortBy === 'role') return leftUser.role.localeCompare(rightUser.role);
        if (this.sortBy === 'joinedDate') {
          return new Date(rightUser.createdAt).getTime() - new Date(leftUser.createdAt).getTime();
        }
        return 0;
      });
    }

    return list;
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  get startRecord(): number {
    if (this.totalCount === 0) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  public onFiltersChanged(): void {
    this.pageNumber = 1;
    this.recalculatePagination();
  }

  public onPageSizeChanged(pageSize: string): void {
    const parsedPageSize = Number(pageSize);
    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) return;
    this.pageSize = parsedPageSize;
    this.pageNumber = 1;
    this.recalculatePagination();
  }

  public changePage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) return;
    this.pageNumber = pageNumber;
  }

  public getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, this.pageNumber - 2);
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  private recalculatePagination(): void {
    this.totalCount = this.filteredUsers.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }
  }

  public cancelForm(): void {
    this.editingUserId.set(null);
  }

  public openEditForm(user: User): void {
    this.userForm.set({ fullName: user.fullName, role: user.role });
    this.editingUserId.set(user.userId);
  }

  public saveEditedUser(): void {
    const userId = this.editingUserId();
    if (!userId) return;

    if (!this.userForm().fullName.trim()) {
      this.errorMessage.set('Name is required');
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.updateUser(userId, this.userForm()).subscribe({
      next: (updatedUser: User) => {
        this.users.update((currentUsers) =>
          currentUsers.map((user) => (user.userId === userId ? updatedUser : user)),
        );
        this.recalculatePagination();
        this.cancelForm();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.errorMessage.set('Failed to update user.');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  public deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.deleteUser(userId).subscribe({
      next: () => {
        this.users.update((currentUsers) => currentUsers.filter((user) => user.userId !== userId));
        this.recalculatePagination();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage.set('Failed to delete user.');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
