import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly DASHBOARD_ROUTE = '/dashboard';
  private readonly LOGIN_ROUTE = '/auth/login';

  constructor(private router: Router) {}

  /**
   * Navigate to the main dashboard after successful authentication.
   */
  public navigateToDashboard(): void {
    this.router.navigate([this.DASHBOARD_ROUTE]);
  }

  /**
   * Navigate to the login page.
   */
  public navigateToLogin(): void {
    this.router.navigate([this.LOGIN_ROUTE]);
  }

  /**
   * Navigate to a custom route.
   */
  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
