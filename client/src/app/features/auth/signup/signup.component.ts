import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../../services/navigation.service';
import { ApiService } from '../../../services/api/api.service';
import { API } from '../../../core/config/api.config';
import { AppConfigService } from '../../../services/app-config.service';
import {
  LoginRole,
  RoleOption,
  SignupFormData,
  RegisterRequest,
  AVAILABLE_ROLES,
  mapRoleToApiRole,
} from '../../../core/models/auth.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class CustomSignupComponent {
  public readonly availableRoles: RoleOption[] = AVAILABLE_ROLES;

  public user: SignupFormData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'manager',
  };

  public signupRequestProcessing = false;
  public signupError = '';
  public signupSuccess = false;
  public showPassword = false;
  public showConfirmPassword = false;

  constructor(
    private navigationService: NavigationService,
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}

  public get selectedRoleLabel(): string {
    return this.getRoleDetails(this.user.role).label;
  }

  public get selectedRoleIcon(): string {
    return this.getRoleDetails(this.user.role).icon;
  }

  public get profileInitials(): string {
    const fallbackInitials = this.selectedRoleLabel.slice(0, 2).toUpperCase();
    const name = this.user.fullName?.trim();

    if (!name) {
      return fallbackInitials;
    }

    const segments = name.split(/\s+/).filter(Boolean);

    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[1][0]}`.toUpperCase();
    }

    if (segments.length === 1 && segments[0].length >= 2) {
      return segments[0].slice(0, 2).toUpperCase();
    }

    return fallbackInitials;
  }

  public get passwordsMatch(): boolean {
    return this.user.password === this.user.confirmPassword;
  }

  public setRole(role: LoginRole): void {
    this.user.role = role;
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  public signup(): void {
    this.signupRequestProcessing = true;
    this.signupError = '';
    this.signupSuccess = false;

    if (!this.passwordsMatch) {
      this.signupRequestProcessing = false;
      this.signupError = 'Password and confirm password must match.';
      return;
    }

    const payload: RegisterRequest = {
      fullName: this.user.fullName,
      email: this.user.email,
      password: this.user.password,
      role: mapRoleToApiRole(this.user.role),
    };

    this.apiService.post<ApiResponse>(API.auth.signup, payload, { rawResponse: true }).subscribe({
      next: (response: ApiResponse) => {
        if (response.errorMessage) {
          this.signupRequestProcessing = false;
          this.signupError = response.errorMessage;
          return;
        }

        this.signupRequestProcessing = false;
        this.signupSuccess = true;
        this.navigationService.navigateToLogin();
      },
      error: (error) => {
        this.signupRequestProcessing = false;

        const apiError = error.error as ApiResponse | undefined;

        if (apiError?.errorMessage) {
          this.signupError = apiError.errorMessage;
        } else if (error.status === 409) {
          this.signupError = 'An account with this email already exists.';
        } else if (error.status === 0) {
          this.signupError = 'Unable to connect to the server. Please try again.';
        } else {
          this.signupError =
            this.appConfigService.getAppConfig().defaultErrorMessage ||
            'Something went wrong. Please try again.';
        }
      },
    });
  }

  private getRoleDetails(role: string): RoleOption {
    return (
      this.availableRoles.find((roleOption) => roleOption.value === role) ?? this.availableRoles[0]
    );
  }
}
