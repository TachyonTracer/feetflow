import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersApiService } from '../../services/controllers/users-api.service';
import { User, UpdateUserRequest } from '../../core/models/user.model';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  public users = signal<User[]>([]);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public editingUserId = signal<string | null>(null);
  public userForm = signal<UpdateUserRequest>({ fullName: '', role: 'Manager' });

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

  public deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.isLoading.set(true);
    this.usersApiService.deleteUser(userId).subscribe({
      next: () => {
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
