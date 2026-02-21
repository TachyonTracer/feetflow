import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Vehicles', icon: 'local_shipping', route: '/register' },
    { label: 'Trips', icon: 'route', route: '/dispatcher' },
    { label: 'Drivers', icon: 'group', route: '/drivers' },
    { label: 'Maintenance', icon: 'build', route: '/service-log' },
    { label: 'Fuel & Expenses', icon: 'local_gas_station', route: '/expenses' },
    { label: 'Analytics', icon: 'analytics', route: '/financials' },
    { label: 'Users', icon: 'manage_accounts', route: '/users' },
  ];

  constructor(private jwtHelper: JwtHelperService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  logout(): void {
    this.jwtHelper.clearJWTToken();
    localStorage.removeItem('x-auth-token');
    localStorage.removeItem('user_details');
    localStorage.removeItem('application_user_details');
    window.location.href = '/auth/login';
  }
}
