import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchableSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: SearchableSelectOption[] = [];
  @Input() placeholder = 'Select';
  @Input() searchPlaceholder = 'Type to search...';
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() dropup = false;

  @Output() valueChange = new EventEmitter<any>();

  value: any = '';
  searchTerm = '';
  isOpen = false;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get displayLabel(): string {
    if (this.multiple && Array.isArray(this.value)) {
      if (this.value.length === 0) return this.placeholder;
      if (this.value.length === 1) {
        return this.options.find((o) => o.value === this.value[0])?.label || this.placeholder;
      }
      return `${this.value.length} items selected`;
    }
    const opt = this.options.find((o) => o.value === this.value);
    return opt ? opt.label : this.placeholder;
  }

  get filteredOptions(): SearchableSelectOption[] {
    if (!this.searchTerm.trim()) return this.options;
    const normalizedTerm = this.searchTerm.toLowerCase();
    return this.options.filter((option) => option.label.toLowerCase().includes(normalizedTerm));
  }

  @ViewChild('searchInput') private searchInputRef?: ElementRef<HTMLInputElement>;

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    } else {
      // Auto-focus the search box after the dropdown renders
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    }
  }

  isSelected(optionValue: string): boolean {
    if (this.multiple && Array.isArray(this.value)) {
      return this.value.includes(optionValue);
    }
    return this.value === optionValue;
  }

  selectOption(val: string): void {
    if (this.multiple) {
      let currentVal = Array.isArray(this.value) ? [...this.value] : this.value ? [this.value] : [];
      const idx = currentVal.indexOf(val);
      if (idx >= 0) {
        currentVal.splice(idx, 1);
      } else {
        currentVal.push(val);
      }
      this.value = currentVal;
      this.onChange(currentVal);
      this.onTouched();
      this.valueChange.emit(currentVal);
    } else {
      this.value = val;
      this.searchTerm = '';
      this.isOpen = false;
      this.onChange(val);
      this.onTouched();
      this.valueChange.emit(val);
    }
  }

  writeValue(value: any): void {
    if (this.multiple && value && !Array.isArray(value)) {
      this.value = [value];
    } else {
      this.value = value ?? (this.multiple ? [] : '');
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
      this.searchTerm = '';
      this.onTouched();
    }
  }
}
