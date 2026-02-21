import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly defaultPopupClass = 'swal-popup';

  /**
   * Show a success notification
   */
  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      customClass: { popup: this.defaultPopupClass },
    });
  }

  /**
   * Show an error notification
   */
  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      customClass: { popup: this.defaultPopupClass },
    });
  }

  /**
   * Show an error notification from an API response.
   *
   * Handles backend responses with shape:
   *   { status, errorMessage, result?: { [field]: string[] }, timestamp }
   */
  showApiError(err: any): Promise<SweetAlertResult> {
    const body = err.error;

    // Determine title based on HTTP status
    let title: string;
    if (err.status === 400) {
      title = 'Validation Error';
    } else if (err.status === 500) {
      title = 'Internal Server Error';
    } else if (err.status === 404) {
      title = 'Not Found';
    } else if (err.status === 409) {
      title = 'Conflict';
    } else {
      title = 'Error';
    }

    // Try to build a helpful message from the result object (validation errors)
    let text: string;
    if (body?.result && typeof body.result === 'object') {
      const messages: string[] = [];
      for (const field of Object.values(body.result) as string[][]) {
        messages.push(...field);
      }
      text = messages.length > 0 ? messages.join('\n') : body.errorMessage || 'Validation failed';
    } else {
      text = body?.errorMessage || body?.message || 'Something went wrong';
    }

    return this.error(title, text);
  }

  /**
   * Show a warning notification
   */
  warning(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      customClass: { popup: this.defaultPopupClass },
    });
  }

  /**
   * Show an info notification
   */
  info(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      customClass: { popup: this.defaultPopupClass },
    });
  }

  /**
   * Show a confirmation dialog
   */
  confirm(options: {
    title: string;
    text: string;
    icon?: SweetAlertIcon;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
  }): Promise<SweetAlertResult> {
    return Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.icon || 'warning',
      showCancelButton: true,
      confirmButtonColor: options.confirmButtonColor || '#1e3fae',
      cancelButtonColor: options.cancelButtonColor || '#64748b',
      confirmButtonText: options.confirmButtonText || 'Confirm',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      customClass: { popup: this.defaultPopupClass },
    });
  }

  /**
   * Show a dangerous confirmation dialog (e.g., delete)
   */
  confirmDelete(title: string, text: string): Promise<SweetAlertResult> {
    return this.confirm({
      title,
      text,
      icon: 'warning',
      confirmButtonText: 'Yes, delete it!',
      confirmButtonColor: '#dc2626',
    });
  }
}
