import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
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

  @Output() valueChange = new EventEmitter<string>();

  value = '';
  searchTerm = '';
  isOpen = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get selectedOption(): SearchableSelectOption | undefined {
    return this.options.find((option) => option.value === this.value);
  }

  get filteredOptions(): SearchableSelectOption[] {
    if (!this.searchTerm.trim()) return this.options;
    const normalizedTerm = this.searchTerm.toLowerCase();
    return this.options.filter((option) => option.label.toLowerCase().includes(normalizedTerm));
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.searchTerm = '';
  }

  selectOption(value: string): void {
    this.value = value;
    this.searchTerm = '';
    this.isOpen = false;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
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
