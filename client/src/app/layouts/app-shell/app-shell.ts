import { Component, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { JwtHelperService } from '../../services/helpers/jwt-helper.service';
import { UserContextService } from '../../core/services/user-context.service';
import { SidebarService } from '../../core/services/sidebar.service';

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
export class AppShell implements OnInit {
  sidebarCollapsed = computed(() => this.sidebarService.collapsed());

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Vehicles', icon: 'local_shipping', route: '/register-vehicles' },
    { label: 'Trips', icon: 'route', route: '/view-trips' },
    { label: 'Maintenance', icon: 'build', route: '/service-log' },
    { label: 'Fuel & Expenses', icon: 'local_gas_station', route: '/expenses' },
    { label: 'Drivers Performance', icon: 'group', route: '/drivers' },
    { label: 'Analytics', icon: 'analytics', route: '/financials' },
    { label: 'Users', icon: 'manage_accounts', route: '/users' },
  ];

  constructor(
    private jwtHelper: JwtHelperService,
    public userContext: UserContextService,
    private sidebarService: SidebarService,
  ) {}

  ngOnInit(): void {
    this.userContext.loadCurrentUser();
    // Start with sidebar collapsed on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.sidebarService.close();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    this.userContext.clearUser();
    this.jwtHelper.clearJWTToken();
    localStorage.removeItem('x-auth-token');
    localStorage.removeItem('user_details');
    localStorage.removeItem('application_user_details');
    localStorage.removeItem('current_user_name');
    localStorage.removeItem('current_user_role');
    window.location.href = '/auth/login';
  }
}
