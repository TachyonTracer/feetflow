import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersApiService } from '../../services/controllers/users-api.service';
import { User, CreateUserRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  // --- Reactive State Setup using Angular Signals ---
  public users = signal<User[]>([]);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  // Form State
  public isAddingUser = signal<boolean>(false);
  public editingUserId = signal<string | null>(null);
  public userForm = signal<CreateUserRequest>({ name: '', description: '' });

  constructor(private usersApiService: UsersApiService) {}

  public ngOnInit(): void {
    this.fetchUsers();
  }

  // ==========================================
  // READ DATA
  // ==========================================

  /**
   * Fetches all users from the API and updates the signal state.
   */
  public fetchUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersApiService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users.set(data);
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

  // ==========================================
  // CREATE DATA
  // ==========================================

  public openAddForm(): void {
    this.userForm.set({ name: '', description: '' });
    this.isAddingUser.set(true);
    this.editingUserId.set(null);
  }

  public cancelForm(): void {
    this.isAddingUser.set(false);
    this.editingUserId.set(null);
  }

  public saveNewUser(): void {
    if (!this.userForm().name.trim()) {
      this.errorMessage.set('Name is required');
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.createUser(this.userForm()).subscribe({
      next: (newUser: User) => {
        // Optimistically add to the list
        this.users.update((currentUsers) => [...currentUsers, newUser]);
        this.cancelForm();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.errorMessage.set('Failed to create user.');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ==========================================
  // UPDATE DATA
  // ==========================================

  public openEditForm(user: User): void {
    this.userForm.set({ name: user.name, description: user.description || '' });
    this.editingUserId.set(user.userId);
    this.isAddingUser.set(false);
  }

  public saveEditedUser(): void {
    const userId = this.editingUserId();
    if (!userId) return;

    if (!this.userForm().name.trim()) {
      this.errorMessage.set('Name is required');
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.updateUser(userId, this.userForm()).subscribe({
      next: (updatedUser: User) => {
        // Optimistically update the list
        this.users.update((currentUsers) =>
          currentUsers.map((u) => (u.userId === userId ? updatedUser : u)),
        );
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

  // ==========================================
  // DELETE DATA
  // ==========================================

  public deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.deleteUser(userId).subscribe({
      next: () => {
        // Optimistically remove from list
        this.users.update((currentUsers) => currentUsers.filter((u) => u.userId !== userId));
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
