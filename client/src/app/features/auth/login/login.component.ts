import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavigationService } from '../../../services/navigation.service';
import { JwtHelperService } from '../../../services/helpers/jwt-helper.service';
import { AppConfigService } from '../../../services/app-config.service';
import { ApiService } from '../../../services/api/api.service';
import { API } from '../../../core/config/api.config';
import {
  LoginRole,
  RoleOption,
  LoginCredentials,
  LoginRequest,
  LoginResponse,
} from '../../../core/models/auth.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'nb-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class CustomLoginComponent implements OnInit {
  public readonly availableRoles: RoleOption[] = [
    { value: 'manager', label: 'Manager', icon: 'manage_accounts' },
    { value: 'dispatcher', label: 'Dispatcher', icon: 'hub' },
    { value: 'analyst', label: 'Analyst', icon: 'analytics' },
    { value: 'safety_officer', label: 'Safety Officer', icon: 'health_and_safety' },
  ];

  public user: LoginCredentials = {
    username: '',
    password: '',
    role: 'manager',
    rememberMe: false,
  };

  public loginRequestProcessing = false;
  public showPassword = false;
  public loginError = '';

  constructor(
    private appConfigService: AppConfigService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
    private apiService: ApiService,
  ) {}

  public get selectedRoleLabel(): string {
    return this.getRoleDetails(this.user.role).label;
  }

  public get selectedRoleIcon(): string {
    return this.getRoleDetails(this.user.role).icon;
  }

  public get profileInitials(): string {
    const fallbackInitials = this.selectedRoleLabel.slice(0, 2).toUpperCase();
    const username = this.user.username?.trim();

    if (!username) {
      return fallbackInitials;
    }

    const localPart = username.includes('@') ? username.split('@')[0] : username;
    const segments = localPart.split(/[\s._-]+/).filter(Boolean);

    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[1][0]}`.toUpperCase();
    }

    if (segments.length === 1 && segments[0].length >= 2) {
      return segments[0].slice(0, 2).toUpperCase();
    }

    if (segments.length === 1 && segments[0].length === 1) {
      return `${segments[0][0]}${fallbackInitials[0]}`.toUpperCase();
    }

    return fallbackInitials;
  }

  public ngOnInit(): void {
    if (this.jwtHelper.isLoginCheck()) {
      this.navigateToFirstMenuRouteLink();
    }
    this.GetPlayRecordingValue();
  }

  public setRole(role: LoginRole): void {
    this.user.role = role;
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public GetPlayRecordingValue(): void {
    sessionStorage.removeItem('fileName');
    sessionStorage.removeItem('tenant');
    const fileName = this.route.snapshot.queryParamMap.get('name');
    const tenant = this.route.snapshot.queryParamMap.get('tenant');
    if (fileName && tenant) {
      sessionStorage.setItem('fileName', fileName);
      sessionStorage.setItem('tenant', tenant);
    }
    history.replaceState(null, '', window.location.pathname);
  }

  public login(): void {
    if (this.jwtHelper.isLoginCheck()) {
      this.navigateToFirstMenuRouteLink();
      return;
    }

    this.loginRequestProcessing = true;
    this.loginError = '';

    const payload: LoginRequest = {
      username: this.user.username,
      password: this.user.password,
      role: this.user.role,
    };

    this.apiService.post<ApiResponse>(API.auth.login, payload).subscribe({
      next: (response: ApiResponse) => {
        // Check for server-side error
        if (response.errorMessage) {
          this.loginRequestProcessing = false;
          this.loginError = response.errorMessage;
          return;
        }

        const data = response.result as LoginResponse;

        // Store access token
        if (data.accessToken) {
          this.jwtHelper.setJWTToken(data.accessToken, data.expiresIn ?? -1);
        }

        // Store refresh token if present
        if (data.refreshToken) {
          this.jwtHelper.setAuthToken(data.refreshToken);
        }

        this.loginRequestProcessing = false;
        this.navigateToFirstMenuRouteLink();
      },
      error: (error) => {
        this.loginRequestProcessing = false;

        // Try to parse the global error response shape
        const apiError = error.error as ApiResponse | undefined;

        if (apiError?.errorMessage) {
          this.loginError = apiError.errorMessage;
        } else if (error.status === 401) {
          this.loginError = 'Invalid username or password.';
        } else if (error.status === 403) {
          this.loginError = 'Access denied for the selected role.';
        } else if (error.status === 0) {
          this.loginError = 'Unable to connect to the server. Please try again.';
        } else {
          this.loginError =
            this.appConfigService.getAppConfig().defaultErrorMessage ||
            'Something went wrong. Please try again.';
        }
      },
    });
  }

  public navigateToFirstMenuRouteLink(): void {
    this.navigationService.navigateToDashboard();
  }

  private getRoleDetails(role: string): RoleOption {
    return (
      this.availableRoles.find((roleOption) => roleOption.value === role) ?? this.availableRoles[0]
    );
  }
}
