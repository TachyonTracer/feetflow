import { Component, OnInit, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AnalyticsApiService } from '../../services/controllers/analytics-api.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { Footer } from '../../shared/components/footer/footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FleetFinancialSummary,
  FuelEfficiencyTrendItem,
  TopCostliestVehicleItem,
  MonthlyFinancialData,
} from '../../core/models/analytics.model';

import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-view-financial-reports',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    HeaderComponent,
    Footer,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './view-financial-reports.html',
  styleUrl: './view-financial-reports.scss',
})
export class ViewFinancialReports implements OnInit {
  @ViewChild('analyticsPage') analyticsPage!: ElementRef;
  isLoading = signal(true);
  isExporting = signal(false);

  summaryData = signal<FleetFinancialSummary | null>(null);
  trendData = signal<FuelEfficiencyTrendItem[]>([]);
  costliestData = signal<TopCostliestVehicleItem[]>([]);

  // Date Range Selection
  range = new FormGroup({
    start: new FormControl<Date | null>(new Date(new Date().getFullYear(), 3, 1)), // April 1st current year
    end: new FormControl<Date | null>(new Date(new Date().getFullYear() + 1, 2, 31)), // March 31st next year
  });

  // Chart Properties
  lineChartType: ChartType = 'line';
  barChartType: ChartType = 'bar';

  // Computed Chart Datas
  lineChartData = computed<ChartConfiguration['data']>(() => {
    const data = this.trendData();
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          data: data.map((d) => d.kmL),
          label: 'Avg km/L',
          backgroundColor: 'rgba(30, 63, 174, 0.2)',
          borderColor: '#1e3fae',
          pointBackgroundColor: '#1e3fae',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#1e3fae',
          fill: 'origin',
          tension: 0.3,
        },
      ],
    };
  });

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const yVal = context.parsed.y;
            return yVal !== null && yVal !== undefined ? `${yVal.toFixed(2)} km/L` : 'N/A';
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
      },
    },
  };

  barChartData = computed<ChartConfiguration['data']>(() => {
    const data = this.costliestData();
    return {
      labels: data.map((d) => d.licensePlate),
      datasets: [
        {
          data: data.map((d) => d.totalCost),
          label: 'Maintenance + Fuel Cost (₹)',
          backgroundColor: '#f43f5e',
          borderRadius: 4,
        },
      ],
    };
  });

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
      },
    },
  };

  constructor(private analyticsApiService: AnalyticsApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    const start = this.range.value.start;
    const end = this.range.value.end;

    const startStr = start ? start.toISOString() : undefined;
    const endStr = end ? end.toISOString() : undefined;

    this.analyticsApiService.getFleetFinancialSummary(startStr, endStr).subscribe({
      next: (res) => this.summaryData.set(res),
      error: (err) => console.error(err),
    });

    this.analyticsApiService.getFuelEfficiencyTrend(startStr, endStr).subscribe({
      next: (res) => {
        this.trendData.set(res);
      },
      error: (err) => console.error(err),
    });

    this.analyticsApiService.getTopCostliestVehicles(startStr, endStr).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.costliestData.set(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      },
    });
  }

  onDateChange(): void {
    if (this.range.value.start && this.range.value.end) {
      this.loadData();
    }
  }

  exportCsv(): void {
    const summary = this.summaryData();
    if (!summary || !summary.monthlyData?.length) return;

    // Calculate totals for the footer
    const totalRevenue = summary.monthlyData.reduce((sum, d) => sum + d.revenue, 0);
    const totalFuel = summary.monthlyData.reduce((sum, d) => sum + d.fuelCost, 0);
    const totalMaint = summary.monthlyData.reduce((sum, d) => sum + d.maintenance, 0);
    const totalNet = summary.monthlyData.reduce((sum, d) => sum + d.netProfit, 0);

    const titleRow = ['Operational Analytics & Financial Reports - Monthly Extract'];
    const dateRow = [`Exported on: ${new Date().toLocaleDateString()}`];

    const headers = [
      'Month',
      'Revenue (INR)',
      'Fuel Cost (INR)',
      'Maintenance (INR)',
      'Net Profit (INR)',
    ];
    const rows = summary.monthlyData.map((d) => [
      d.month,
      d.revenue.toString(),
      d.fuelCost.toString(),
      d.maintenance.toString(),
      d.netProfit.toString(),
    ]);

    const footer = [
      'TOTAL',
      totalRevenue.toString(),
      totalFuel.toString(),
      totalMaint.toString(),
      totalNet.toString(),
    ];

    // Construct the CSV string
    const csvContent =
      titleRow.join(',') +
      '\n' +
      dateRow.join(',') +
      '\n\n' +
      headers.join(',') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n') +
      '\n\n' +
      footer.join(',');

    const fileName = `fleet_financial_summary_${new Date().toISOString().split('T')[0]}.csv`;

    // Add BOM for Excel UTF-8 compatibility
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Explicitly append to body and trigger click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Give it time to start before cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  async exportPdf(): Promise<void> {
    if (!this.analyticsPage) return;

    this.isExporting.set(true);

    try {
      const element = this.analyticsPage.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f6f6f8', // Match app background
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fleet_financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      this.isExporting.set(false);
    }
  }
}
