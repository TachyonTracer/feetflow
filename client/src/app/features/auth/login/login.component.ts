import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { JwtHelperService } from '../../../services/helpers/jwt-helper.service';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'nb-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class CustomLoginComponent implements OnInit {
  public user: any = {};
  public tenantsList: any;
  public loginRequestProcessing = false;
  public isTenantSuccess = -1;

  constructor(
    private appConfigService: AppConfigService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    if (this.jwtHelper.isLoginCheck()) {
      this.navigateToFirstMenuRouteLink();
    }
    this.GetPlayRecordingValue();
  }

  public GetPlayRecordingValue() {
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

  public login() {
    if (this.jwtHelper.isLoginCheck()) {
      window.location.reload();
      return;
    }
    this.loginRequestProcessing = true;
    console.log('Login logic skipped due to missing identity service.');
    this.loginRequestProcessing = false;
  }

  public getUserDetailsAndStoreToLocalStorage() {
    console.log('Get user details logic skipped relative to missing service.');
  }

  public navigateToFirstMenuRouteLink() {
    console.log('Navigation to first menu route skipped.');
  }

  public getApplicationUserDetails(tenantList: any[]) {
    console.log('Get application user details logic skipped.', tenantList);
  }
}
