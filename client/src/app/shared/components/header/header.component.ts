import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../../core/services/user-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor(public userContext: UserContextService) {}

  ngOnInit(): void {
    if (!this.userContext.isLoaded() && !this.userContext.isLoading()) {
      this.userContext.loadCurrentUser();
    }
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
