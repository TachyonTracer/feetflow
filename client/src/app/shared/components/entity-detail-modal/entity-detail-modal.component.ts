import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DetailField {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'badge' | 'currency' | 'route';
  badgeClass?: string;
  /** For route type: origin → destination */
  routeOrigin?: string;
  routeDest?: string;
}

export interface DetailSection {
  title?: string;
  fields: DetailField[];
}

@Component({
  selector: 'app-entity-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entity-detail-modal.component.html',
  styleUrl: './entity-detail-modal.component.scss',
})
export class EntityDetailModalComponent {
  @Input() title = 'Details';
  @Input() subtitle = '';
  @Input() sections: DetailSection[] = [];
  @Input() isLoading = false;

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal();
  }

  formatValue(field: DetailField): string {
    if (field.value === null || field.value === undefined || field.value === '') return '—';
    return String(field.value);
  }
}
