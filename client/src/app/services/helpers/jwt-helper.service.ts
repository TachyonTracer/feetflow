import { Injectable } from '@angular/core';

// Missing CookieService, jwtDecode, pako
// Replacing with simple localstorage fallback or stub since we are stripping down UI/auth libs
import { AppConfigService } from '../shared/app-config.service';

export interface GetUserResponseModel {
  [key: string]: any;
}

export interface GetUser {
  result: any[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class JwtHelperService {
  // These keys are set by identity on serve side.
  public static JWT_TOKEN_ROLES_KEY =
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
  public static JWT_TOKEN_USERNAME_KEY =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
  public static JWT_TOKEN_EMAIL_KEY =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

  constructor(public appConfigService: AppConfigService) {}

  /**
   * saveJWTToken
   */
  public setJWTToken(tokenString: string, expiresInSeconds: number = -1) {
    try {
      const tokenType = 'bearer';

      let expireDateTime: Date = new Date();
      if (expiresInSeconds < 0) {
        expireDateTime = new Date(+this.decodeJwtToken(tokenString).exp * 1000);
      } else {
        expireDateTime.setSeconds(expireDateTime.getSeconds() + expiresInSeconds);
      }

      // Removing old token if exists
      this.clearJWTToken();

      const setvalue = tokenString.split('.', 3);

      // Adding token to cookie storage
      if (setvalue.length === 3) {
        document.cookie = `AuthorizationHeaderSignature=${tokenType} ${setvalue[0]}..${setvalue[2]}; expires=${expireDateTime.toUTCString()}; path=/; ${window.location.protocol === 'https:' ? 'secure;' : ''}`;
        document.cookie = `ExpireTime=${expireDateTime.getTime().toString()}; expires=${expireDateTime.toUTCString()}; path=/; ${window.location.protocol === 'https:' ? 'secure;' : ''}`;
        localStorage.setItem('payload', setvalue[1].toString());
        localStorage.setItem('raw_jwt_token', tokenString);
      }
    } catch (error) {
      console.error(error);
    }
  }

  public getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  }

  public getExpireTime(): string {
    return this.getCookie('ExpireTime');
  }

  /**
   * getJWTPayload
   */
  public getJWTPayload() {
    // decode the token to get its payload
    const jwtPayload = this.getAuthorizationHeaderValue();

    return this.decodeJwtToken(jwtPayload);
  }

  public decodeJwtToken(jwtToken: string): any {
    try {
      if (!jwtToken) return undefined;
      const base64Url = jwtToken.split('.')[1];
      if (!base64Url) return undefined;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('invalid token format', error);
      return undefined;
    }
  }

  // Save Auth Token (Claims)
  public setAuthToken(tokenString: string) {
    if (tokenString) {
      localStorage.setItem('x-auth-token', tokenString);
    }
  }

  // Get Auth Token
  public getAuthToken(): string {
    let tokenString = localStorage.getItem('x-auth-token');
    if (tokenString) {
      return `bearer ${tokenString}`;
    } else {
      return '';
    }
  }

  // Save Features Token
  public setFeaturesToken(tokenString: string) {
    // let tokenPayloadData = tokenString ? tokenString.split('.', 3) : [];
    if (tokenString) {
      localStorage.setItem('x-features-token', tokenString);
    }
  }

  // Get Features Token
  public getFeaturesFromToken(): Array<string> {
    let tokenString = localStorage.getItem('x-features-token');
    if (tokenString) {
      let decodedFeaturesToken = this.decodeJwtToken(tokenString);
      if (decodedFeaturesToken && decodedFeaturesToken.features) {
        return decodedFeaturesToken.features;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  /**
   * clearJWTToken
   */
  public clearJWTToken(): void {
    document.cookie =
      'AuthorizationHeaderSignature=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'ExpireTime=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('payload');
  }

  /**
   * returns token String
   */
  public getAuthorizationHeaderValue(): string {
    let tokenString: string = this.getAuthorizationHeaderSignature();

    if (tokenString === undefined || tokenString === null || tokenString.length < 1) {
      return '';
    } else {
      const payload = localStorage.getItem('payload');
      if (payload !== null && payload !== undefined && payload.length > 1) {
        tokenString = tokenString.replace('..', '.' + payload + '.');
      }
    }
    return tokenString;
  }

  /**
   * Check if isZipRequest is true then convert  authorization header into zip and pass to API.
   */
  public getAuthorizationHeaderValueForUploadFile() {
    let tokenString = this.getAuthorizationHeaderValue();
    let uploadHeaders = {
      Authorization: tokenString,
      'X-AUTH-TOKEN': this.getAuthToken(),
    };
    return uploadHeaders;
  }

  /**
   * Provides the HeaderSignature String separated by two dots
   * @returns string of header and signature
   */
  public getAuthorizationHeaderSignature(): string {
    return this.getCookie('AuthorizationHeaderSignature');
  }

  /**
   * setUserDetails
   */
  public setUserDetails(getUserResponseBody: GetUser) {
    localStorage.setItem('user_details', JSON.stringify(getUserResponseBody));
    if (getUserResponseBody.result && getUserResponseBody.result.length > 0) {
      localStorage.setItem('user_uuid', getUserResponseBody.result[0].user_uuid);
    }
    localStorage.setItem('jwt_token', JSON.stringify(this.getJWTPayload()));
  }

  public setApplicationUserDetails(userDetails: GetUserResponseModel) {
    localStorage.setItem('application_user_details', JSON.stringify(userDetails));
    localStorage.setItem('jwt_token', JSON.stringify(this.getJWTPayload()));
  }

  public getApplicationUserDetails(): GetUserResponseModel | undefined {
    const applicationUserDetails = localStorage.getItem('application_user_details');
    if (!applicationUserDetails || applicationUserDetails.length < 1) {
      return undefined;
    } else {
      return JSON.parse(applicationUserDetails) as GetUserResponseModel;
    }
  }

  /**
   * getUserDetails
   */
  public getUserDetails(): GetUser | undefined {
    const userDetails = localStorage.getItem('user_details');
    if (!userDetails || userDetails.length < 1) {
      return undefined;
    } else {
      return JSON.parse(userDetails) as GetUser;
    }
  }

  /**
   * @returns true false if token has role
   * @param roleName role name in string
   */
  public isInRole(roleName: string): boolean {
    const roles = this.getJWTPayload()[JwtHelperService.JWT_TOKEN_ROLES_KEY];

    if (roles instanceof Array) {
      return roles.includes(roleName);
    } else if (roles instanceof String) {
      if (roles.toLowerCase() === roleName.toLowerCase()) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * getRoles
   * @returns either array of string of multiple roles or single string of single role
   */
  public getRoles(): Array<string> {
    const roles = this.getJWTPayload()[JwtHelperService.JWT_TOKEN_ROLES_KEY];
    if (roles instanceof Array) {
      return roles;
    } else {
      return [roles];
    }
  }

  /**
   * get claim value
   * @returns string value or boolean if value is true or false in string
   * @param claimType claim type name
   */
  public getClaimValue(claimType: string): string | boolean {
    try {
      const claimValue = this.getJWTPayload()[claimType];
      if (claimValue === null || claimValue === undefined) {
        return false;
      }
      if (claimValue.toLowerCase() === 'true') {
        return true;
      } else if (claimValue.toLowerCase() === 'false') {
        return false;
      } else {
        return claimValue;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public isFeatureExistsInToken(featureName: string): boolean {
    return this.getFeaturesFromToken().includes(featureName);
  }

  public isFeatureExistsInTokenList(features: Array<string>): boolean {
    const tokenFeatures = this.getFeaturesFromToken();
    for (let index = 0; index < features.length; index++) {
      if (!tokenFeatures.includes(features[index])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks where the user is logged in or not.
   */
  public isLoginCheck(): boolean {
    const tokenValue = this.getAuthorizationHeaderValue();
    if (tokenValue === undefined || tokenValue === null || tokenValue.length < 1) {
      return false;
    } else {
      return true;
    }
  }
}
