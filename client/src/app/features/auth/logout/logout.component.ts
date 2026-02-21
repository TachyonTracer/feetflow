import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JwtHelperService } from '../../../services/helpers/jwt-helper.service';

@Component({
  selector: 'nb-logout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './logout.component.html',
})
export class CustomLogoutComponent implements OnInit {
  constructor(
    private router: Router,
    private jwtHelper: JwtHelperService,
  ) {}

  public ngOnInit(): void {
    this.logout();
  }

  public logout(): void {
    this.jwtHelper.clearJWTToken();
    localStorage.removeItem('x-auth-token');
    localStorage.removeItem('x-features-token');
    localStorage.removeItem('user_details');
    localStorage.removeItem('user_uuid');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('application_user_details');
    localStorage.removeItem('payload');

    this.router.navigate(['/auth/login']);
  }
}
