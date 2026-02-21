import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inrCurrency',
  standalone: true,
})
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return `₹ ${safeValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
