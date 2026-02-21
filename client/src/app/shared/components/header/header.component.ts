import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../../core/services/user-context.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor(
    public userContext: UserContextService,
    public sidebarService: SidebarService,
  ) {}

  ngOnInit(): void {
    // Only load if not already loaded — the AppShell already calls this once.
    // Re-calling on every route change causes redundant API calls that
    // can 401 if the token has expired, booting the user to login.
    if (!this.userContext.isLoaded() && !this.userContext.isLoading()) {
      this.userContext.loadCurrentUser();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  get displayName(): string {
    return this.userContext.user()?.fullName || 'Guest User';
  }

  get displayRole(): string {
    return this.userContext.user()?.role || 'Guest';
  }

  get initials(): string {
    const fullName = this.displayName.trim();
    if (!fullName) return 'GU';
    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((namePart) => namePart[0]?.toUpperCase() ?? '')
      .join('');
  }
}
