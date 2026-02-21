import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtHelperService } from '../helpers/jwt-helper.service';
import { AppConfigService } from '../shared/app-config.service';
@Injectable({
  providedIn: 'root',
})
export class ApiServiceService {
  public static CONTENT_TYPE = {
    CONTENT_TYPE_KEY: 'Content-type',
    CONTENT_TYPE_VALUES: {
      CONTENT_TYPE_APPLICATION_JSON: 'application/json',
      CONTENT_TYPE_APPLICATION_X_WWW_FORM_URLENCONDED: 'application/x-www-form-urlencoded',
      CONTENT_TYPE_MULIPART_FORM_DATA: 'multipart/form-data;',
      CONTENT_TYPE_OCTECT_STREAM: 'application/octet-stream',
    },
  };
  public static CONTENT_ENCODING = {
    CONTENT_ENCODING_KEY: 'Content-Encoding',
    CONTENT_ENCODING_VALUES: {
      CONTENT_ENCODING_GZIP: 'gzip',
    },
  };

  constructor(
    public httpClient: HttpClient,
    public jwtHelper: JwtHelperService,
    public appConfigService: AppConfigService,
  ) {}

  /**
   * Returns default http headers
   */
  public getHttpHeaders(contentType?: string): HttpHeaders {
    let httpHeaders = new HttpHeaders({
      Authorization: this.jwtHelper.getAuthorizationHeaderValue(),
      'X-AUTH-TOKEN': this.jwtHelper.getAuthToken(),
    });
    if (contentType) {
      httpHeaders = httpHeaders.append('Content-Type', contentType);
    }
    return httpHeaders;
  }
  // REQUESTS

  public postApplicationJson(
    apiUrl: string,
    body: object = {},
    requestParams: HttpParams = new HttpParams(),
  ): Observable<any> {
    return this.httpClient.post(apiUrl, JSON.stringify(body), {
      headers: this.getHttpHeaders(
        ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
      ),
      observe: 'response',
      params: requestParams,
    });
  }

  public postFormData(apiUrl: string, body: FormData): Observable<any> {
    return this.httpClient.post(apiUrl, body, {
      headers: new HttpHeaders(this.jwtHelper.getAuthorizationHeaderValueForUploadFile() as any),
      observe: 'response',
      reportProgress: true,
    });
  }

  /**
   * @deprecated use less method - do not use
   */
  public httpRequest(requestMethod: string, apiUrl: string, body: FormData): Observable<any> {
    const req = new HttpRequest(requestMethod, apiUrl, body, {
      headers: this.getHttpHeaders(
        ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_MULIPART_FORM_DATA,
      ),
      // observe: 'response',
      reportProgress: true,
    });
    return this.httpClient.request(req);
  }

  public postWithQueryString(apiUrl: string, queryString: string): Observable<any> {
    return this.httpClient.post(apiUrl + '?' + queryString, {
      headers: this.getHttpHeaders(
        ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
      ),
      observe: 'response',
    });
  }

  /* *
   * postXWwwFormUrlEncoded
   * */
  public postXWwwFormUrlEncoded(apiUrl: string, body: Map<string, string>): Observable<any> {
    let xbody = '';

    for (const key of body.keys()) {
      const value = body.get(key) || '';
      xbody = xbody + key + '=' + encodeURIComponent(value);
      xbody = xbody + '&';
    }

    if (xbody.charAt(xbody.length - 1) === '&') {
      xbody = xbody.substr(0, xbody.length - 1);
    }

    return this.httpClient.post(apiUrl, xbody, {
      headers: this.getHttpHeaders(
        ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES
          .CONTENT_TYPE_APPLICATION_X_WWW_FORM_URLENCONDED,
      ),
      observe: 'response',
    });
  }

  public get(apiUrl: string, requestParams: HttpParams = new HttpParams()): Observable<any> {
    const data = this.httpClient
      .get(apiUrl, {
        headers: this.getHttpHeaders(
          ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
        ),
        observe: 'response',
        params: requestParams,
      })
      .pipe();
    return data;
  }

  public put(
    apiUrl: string,
    body: object = {},
    requestParams: HttpParams = new HttpParams(),
  ): Observable<any> {
    return this.httpClient
      .put(apiUrl, JSON.stringify(body), {
        headers: this.getHttpHeaders(
          ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
        ),
        observe: 'response',
        params: requestParams,
      })
      .pipe();
  }

  public patch(
    apiUrl: string,
    body: object = {},
    requestParams: HttpParams = new HttpParams(),
  ): Observable<any> {
    return this.httpClient
      .patch(apiUrl, JSON.stringify(body), {
        headers: this.getHttpHeaders(
          ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
        ),
        observe: 'response',
        params: requestParams,
      })
      .pipe();
  }

  public delete(
    apiUrl: string,
    requestParams: HttpParams = new HttpParams(),
    body: object = {},
  ): Observable<any> {
    if (requestParams === null) {
      requestParams = new HttpParams();
    }
    return this.httpClient
      .delete(apiUrl, {
        headers: this.getHttpHeaders(
          ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON,
        ),
        observe: 'response',
        params: requestParams,
        body: JSON.stringify(body),
      })
      .pipe();
  }

  // REQUESTS

  public getWithZip(apiUrl: string, requestParams: HttpParams = new HttpParams()): Observable<any> {
    const data = this.httpClient
      .get(apiUrl, {
        headers: this.getHttpHeaders(
          ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_OCTECT_STREAM,
        ),
        observe: 'response',
        params: requestParams,
      })
      .pipe();
    return data;
  }

  public getBLOB(
    apiUrl: string,
    requestParams: HttpParams = new HttpParams(),
    responseType: 'json' | 'blob' = 'blob',
  ): Observable<any> {
    const contentType =
      responseType === 'blob'
        ? ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_OCTECT_STREAM
        : ApiServiceService.CONTENT_TYPE.CONTENT_TYPE_VALUES.CONTENT_TYPE_APPLICATION_JSON;

    const data = this.httpClient
      .get(apiUrl, {
        headers: this.getHttpHeaders(contentType),
        observe: 'response',
        params: requestParams,
        responseType: responseType as any,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // When responseType is 'blob', error.error is a Blob - convert it to JSON for proper error handling
          if (responseType === 'blob' && error.error instanceof Blob) {
            return new Observable((observer) => {
              // Use Blob.text() instead of FileReader.readAsText
              error.error
                .text()
                .then((text: string) => {
                  try {
                    const errorJson = JSON.parse(text);
                    const newError = new HttpErrorResponse({
                      error: errorJson,
                      headers: error.headers,
                      status: error.status,
                      statusText: error.statusText,
                      url: error.url || undefined,
                    });
                    observer.error(newError);
                  } catch (error_) {
                    // If parsing fails, propagate original error and log parsing failure
                    // eslint-disable-next-line no-console
                    console.debug('Failed to parse blob to JSON:', error_);
                    observer.error(error);
                  } finally {
                    observer.complete();
                  }
                })
                .catch(() => observer.error(error));
            });
          }
          return throwError(() => error);
        }),
      );
    return data;
  }
}
