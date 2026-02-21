import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  public appConfig!: AppConfig;
  public static staticAppConfig: AppConfig;

  constructor(public httpClient: HttpClient) {}

  public async loadAppConfig() {
    try {
      this.appConfig = await firstValueFrom(this.httpClient.get<AppConfig>('/app_config.json'));
      AppConfigService.staticAppConfig = this.appConfig;
    } catch (error: any) {
      console.error(error);
    }
  }

  public getAppConfig(): AppConfig {
    if (!this.appConfig) {
      console.warn('App config not loaded yet. Make sure to call loadAppConfig() first.');
      return {} as AppConfig;
    }
    return this.appConfig;
  }
}

export class AppConfig {
  public siteName!: string;
  public siteVersion!: string;
  public defaultErrorTitle!: string;
  public defaultErrorMessage!: string;
  public refreshTokenIntervalInMinutes!: number;
  public privateKey!: string;
  public organisationNames!: string[];
  public licenceExpiryDate!: string;
  public api!: {
    AuthController: {
      login: {
        apiPath: string;
      };
      getAccessToken: {
        apiPath: string;
      };
      resetPassword: {
        apiPath: string;
      };
    };
    UsersController: {
      getAll: {
        apiPath: string;
      };
      getById: {
        apiPath: string;
      };
      create: {
        apiPath: string;
      };
      update: {
        apiPath: string;
      };
      delete: {
        apiPath: string;
      };
    };
  };
}
