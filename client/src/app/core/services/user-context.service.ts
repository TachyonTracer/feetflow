import { Injectable, signal, computed } from '@angular/core';
import { UsersApiService } from '../../services/controllers/users-api.service';
import { User } from '../models/user.model';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly currentUser = signal<User | null>(null);
  private readonly loading = signal(false);
  private readonly loaded = signal(false);

  readonly user = this.currentUser.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor(
    private usersApiService: UsersApiService,
    private jwtHelper: JwtHelperService,
  ) {}

  loadCurrentUser(): void {
    if (!this.jwtHelper.isLoginCheck()) {
      this.currentUser.set(null);
      this.loaded.set(true);
      return;
    }
    if (this.loading()) return;
    this.loading.set(true);
    this.usersApiService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.currentUser.set(null);
        this.loaded.set(true);
        this.loading.set(false);
      },
    });
  }

  clearUser(): void {
    this.currentUser.set(null);
    this.loaded.set(false);
  }
}
