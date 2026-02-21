import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  /** true = sidebar is collapsed/hidden */
  collapsed = signal(false);

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  open(): void {
    this.collapsed.set(false);
  }

  close(): void {
    this.collapsed.set(true);
  }
}
