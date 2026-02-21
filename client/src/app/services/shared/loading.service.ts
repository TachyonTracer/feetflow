import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly activeRequestCount = signal(0);
  public readonly isLoading = computed(() => this.activeRequestCount() > 0);

  public startLoading(): void {
    this.activeRequestCount.update((count) => count + 1);
  }

  public stopLoading(): void {
    this.activeRequestCount.update((count) => Math.max(0, count - 1));
  }
}
