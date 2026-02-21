import { Component, Input, Output, EventEmitter, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Footer } from '../footer/footer';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../searchable-select/searchable-select.component';
import { CustomCellDirective } from '../../directives/custom-cell.directive';

export interface TableColumn {
  key: string; // Property to bind to
  title: string; // Table Header Text
  align?: 'left' | 'center' | 'right'; // Flex alignment
  type?: 'string' | 'currency' | 'date' | 'custom' | 'actions';
}

@Component({
  selector: 'app-data-page-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, Footer, SearchableSelectComponent],
  templateUrl: './data-page-layout.html',
  styleUrl: './data-page-layout.scss',
})
export class DataPageLayout {
  // -- Page Header --
  @Input() pageTitle = '';
  @Input() pageSubtitle = '';

  // -- Search --
  @Input() searchPlaceholder = 'Search...';
  @Input() searchTerm = '';
  @Output() searchTermChange = new EventEmitter<string>();

  // -- Filters --
  @Input() filterOptions: SearchableSelectOption[] = [];
  @Input() filterValue: any = '';
  @Input() filterMultiple = false;
  @Output() filterChange = new EventEmitter<any>();

  @Input() secondaryFilterOptions: SearchableSelectOption[] = [];
  @Input() secondaryFilterValue: any = '';
  @Input() secondaryFilterMultiple = false;
  @Output() secondaryFilterChange = new EventEmitter<any>();

  @Input() tertiaryFilterOptions: SearchableSelectOption[] = [];
  @Input() tertiaryFilterValue: any = '';
  @Input() tertiaryFilterMultiple = false;
  @Output() tertiaryFilterChange = new EventEmitter<any>();

  @Input() sortOptions: SearchableSelectOption[] = [];
  @Input() sortValue = '';
  @Output() sortChange = new EventEmitter<string>();

  // -- Action Button --
  @Input() actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() actionClick = new EventEmitter<void>();

  @Input() secondaryActionLabel = '';
  @Input() secondaryActionIcon = '';
  @Output() secondaryActionClick = new EventEmitter<void>();

  // -- Smart Table Render --
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() emptyMessage = 'No records found.';
  @ContentChild(CustomCellDirective) customCellDirective?: CustomCellDirective;

  // -- Pagination --
  @Input() pageSizeOptions: SearchableSelectOption[] = [];
  @Input() isLoading = false;
  @Input() totalCount = 0;
  @Input() pageNumber = 1;
  @Input() pageSize = 10;
  @Input() totalPages = 1;
  @Input() recordLabel = 'records';
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<string>();

  get startRecord(): number {
    if (this.totalCount === 0) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
  }

  onFilterChanged(value: any): void {
    this.filterValue = value;
    this.filterChange.emit(value);
  }

  onSecondaryFilterChanged(value: any): void {
    this.secondaryFilterValue = value;
    this.secondaryFilterChange.emit(value);
  }

  onTertiaryFilterChanged(value: any): void {
    this.tertiaryFilterValue = value;
    this.tertiaryFilterChange.emit(value);
  }

  onSortChanged(value: string): void {
    this.sortValue = value;
    this.sortChange.emit(value);
  }

  onActionClick(): void {
    this.actionClick.emit();
  }

  onSecondaryActionClick(): void {
    this.secondaryActionClick.emit();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }

  onPageSizeChanged(size: string): void {
    this.pageSizeChange.emit(size);
  }
}
