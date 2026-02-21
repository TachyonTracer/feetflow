import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';

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
  public redirectDelay = 0;
  public showMessages: any = {};
  public strategy = '';
  public submitted = false;
  public errors: string[] = [];
  public messages: string[] = [];
  public resetPasswordNgModel: ResetPasswordNgModel = new ResetPasswordNgModel();
  public userName: any;

  constructor(
    private appConfigService: AppConfigService,
    protected router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.redirectDelay = 0;
    this.showMessages = {};
    this.strategy = '';
  }

  public ngOnInit(): void {
    this.resetPasswordNgModel = new ResetPasswordNgModel();

    this.activatedRoute.queryParams.subscribe(async (params) => {
      this.userName = params['userName'];
    });
  }

  public async resetPass(): Promise<void> {
    this.errors = this.messages = [];
    this.submitted = true;
    this.errors = [];
    this.messages = ['Sending reset password'];

    if (this.resetPasswordNgModel.password !== this.resetPasswordNgModel.confirmPassword) {
      this.submitted = false;
      return;
    }
    console.log('Skipping forgotpassword processing relative to missing service.');
    this.submitted = false;
  }

  public async resetPassword(): Promise<void> {
    console.log('Skipping resetpassword processing relative to missing service.');
  }

  public getConfigValue(key: string): any {
    return null;
  }
}
