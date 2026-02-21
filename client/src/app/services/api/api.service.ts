import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, finalize, shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiOptions {
  routeParams?: { [key: string]: string | number };
  queryParams?: { [key: string]: string | number | boolean };
  headers?: { [key: string]: string };
  retryCount?: number;
  retryDelay?: number;
  cache?: boolean;
  rawResponse?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private cache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  /**
   * Resolves the full URL by prepending apiBasePath from environment config
   * for relative paths (starting with '/'). Absolute URLs are left unchanged.
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return environment.apiBasePath + url;
  }

  private buildUrl(url: string, options?: ApiOptions): string {
    let finalUrl = this.resolveUrl(url);
    if (options?.routeParams) {
      for (const [key, value] of Object.entries(options.routeParams)) {
        finalUrl = finalUrl.replace(`{${key}}`, String(value));
      }
    }
    return finalUrl;
  }

  private buildOptions(options?: ApiOptions): { headers: HttpHeaders; params: HttpParams } {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers = headers.set(key, value);
      }
    }

    let params = new HttpParams();
    if (options?.queryParams) {
      for (const [key, value] of Object.entries(options.queryParams)) {
        params = params.set(key, String(value));
      }
    }

    return { headers, params };
  }

  private unwrapApiResponse<T>(response: any): T {
    if (
      response &&
      typeof response === 'object' &&
      'result' in response &&
      'status' in response &&
      'timestamp' in response
    ) {
      return response.result as T;
    }
    return response as T;
  }

  private handleObservables<T>(
    req: Observable<T>,
    options?: ApiOptions,
    cacheKey?: string,
  ): Observable<T> {
    const retryCount = options?.retryCount ?? 0;
    const retryDelay = options?.retryDelay ?? 1000;

    let obs = req;

    if (!options?.rawResponse) {
      obs = obs.pipe(map((response: any) => this.unwrapApiResponse<T>(response)));
    }

    if (retryCount > 0) {
      obs = obs.pipe(retry({ count: retryCount, delay: retryDelay }));
    }

    if (options?.cache && cacheKey) {
      obs = obs.pipe(
        shareReplay(1),
        finalize(() => this.cache.delete(cacheKey)),
      );
      this.cache.set(cacheKey, obs);
    }

    return obs;
  }

  get<T>(url: string, options?: ApiOptions): Observable<T> {
    const finalUrl = this.buildUrl(url, options);
    const cacheKey = `GET_${finalUrl}_${JSON.stringify(options?.queryParams || {})}`;

    if (options?.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as Observable<T>;
    }

    const httpOptions = this.buildOptions(options);
    const req = this.http.get<T>(finalUrl, httpOptions);

    return this.handleObservables(req, options, cacheKey);
  }

  post<T>(url: string, body: any, options?: ApiOptions): Observable<T> {
    const finalUrl = this.buildUrl(url, options);
    const httpOptions = this.buildOptions(options);
    const req = this.http.post<T>(finalUrl, body, httpOptions);
    return this.handleObservables(req, options);
  }

  put<T>(url: string, body: any, options?: ApiOptions): Observable<T> {
    const finalUrl = this.buildUrl(url, options);
    const httpOptions = this.buildOptions(options);
    const req = this.http.put<T>(finalUrl, body, httpOptions);
    return this.handleObservables(req, options);
  }

  patch<T>(url: string, body: any, options?: ApiOptions): Observable<T> {
    const finalUrl = this.buildUrl(url, options);
    const httpOptions = this.buildOptions(options);
    const req = this.http.patch<T>(finalUrl, body, httpOptions);
    return this.handleObservables(req, options);
  }

  delete<T>(url: string, options?: ApiOptions): Observable<T> {
    const finalUrl = this.buildUrl(url, options);
    const httpOptions = this.buildOptions(options);
    const req = this.http.delete<T>(finalUrl, httpOptions);
    return this.handleObservables(req, options);
  }
}
