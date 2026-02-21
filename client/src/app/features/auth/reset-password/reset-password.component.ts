import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AppConfigService } from '../../../services/shared/app-config.service';
import { ApiService } from '../../../services/api/api.service';
import { API } from '../../../core/config/api.config';

class ResetPasswordNgModel {
  public password?: string;
  public confirmPassword?: string;
}

@Component({
  selector: 'nb-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./reset-password.component.scss'],
  templateUrl: './reset-password.component.html',
})
export class CustomResetPasswordComponent implements OnInit {
  public submitted = false;
  public errors: string[] = [];
  public resetPasswordNgModel: ResetPasswordNgModel = new ResetPasswordNgModel();

  public email = '';
  private token?: string;
  public mode: 'request' | 'reset' = 'request';
  public feedback = '';

  constructor(
    private appConfigService: AppConfigService,
    protected router: Router,
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  public ngOnInit(): void {
    this.resetPasswordNgModel = new ResetPasswordNgModel();

    this.activatedRoute.queryParams.subscribe((params) => {
      this.token = params['token'];
      if (this.token) {
        this.mode = 'reset';
      }
    });
  }

  public async submit(): Promise<void> {
    this.errors = [];
    this.feedback = '';
    this.submitted = true;

    if (this.mode === 'request') {
      if (!this.email) {
        this.errors.push('Email is required.');
        this.submitted = false;
        return;
      }

      try {
        await this.apiService
          .post(API.auth.forgotPassword, { email: this.email }, { rawResponse: true })
          .toPromise();
        this.feedback =
          'If an account with that email exists, you will receive a reset link shortly. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      } catch (err) {
        this.errors.push('Unable to send reset email. Please try again later.');
      } finally {
        this.submitted = false;
      }
      return;
    }

    // reset mode
    if (this.resetPasswordNgModel.password !== this.resetPasswordNgModel.confirmPassword) {
      this.errors.push('Passwords do not match.');
      this.submitted = false;
      return;
    }
    if (!this.token) {
      this.errors.push('Invalid reset token.');
      this.submitted = false;
      return;
    }
    if (this.resetPasswordNgModel.password && this.resetPasswordNgModel.password.length < 8) {
      this.errors.push('Password must be at least 8 characters long.');
      this.submitted = false;
      return;
    }

    try {
      await this.apiService
        .post(
          API.auth.resetPassword,
          { token: this.token, newPassword: this.resetPasswordNgModel.password },
          { rawResponse: true },
        )
        .toPromise();
      this.feedback = 'Password has been reset successfully! Redirecting to login...';
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    } catch (err: any) {
      if (err.error?.errorMessage) {
        this.errors.push(err.error.errorMessage);
      } else {
        this.errors.push('Unable to reset password. Token may be invalid or expired.');
      }
    } finally {
      this.submitted = false;
    }
  }
}
