import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  public getAppConfig() {
    return environment;
  }

  /** @deprecated Use environment import directly instead */
  public static get staticAppConfig() {
    return environment;
  }
}
