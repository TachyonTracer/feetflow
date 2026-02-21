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
  public redirectDelay = 0;
  public strategy = '';

  constructor(
    protected router: Router,
    private jwtHelper: JwtHelperService,
  ) {}

  public ngOnInit(): void {
    this.logout();
  }

  public syncWait = (ms: number) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      continue;
    }
  };

  public async logout() {
    let logoutApi = 10;
    let logoutClear = 20;
    let socketDisconnecting = 30;
    let redirectLogin = 40;

    await this.syncWait(logoutApi);
    if (this.jwtHelper.isLoginCheck()) {
      console.log('Skipping API logout due to missing service');
    }

    await this.syncWait(logoutClear);
    console.log('Skipping global logout clear due to missing service');

    await this.syncWait(socketDisconnecting);
    console.log('Skipping socket disconnect due to missing service');

    await this.syncWait(redirectLogin);
    console.log('Skipping login redirect due to missing service');
  }
}
