import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appCustomCell]',
  standalone: true,
})
export class CustomCellDirective {
  constructor(public template: TemplateRef<any>) {}
}
