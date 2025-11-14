import { Readable } from "stream";

/**
 * CSV Service for generating CSV exports with proper formatting and security
 */
export class CsvService {
  private static BOM = '\ufeff'; // Byte Order Mark for Excel compatibility

  /**
   * Escape special characters in CSV values to prevent injection
   */
  private static escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Remove any formula injection attempts
    if (stringValue.match(/^[=+\-@]/)) {
      stringValue = "'" + stringValue;
    }

    // Escape quotes and wrap in quotes if contains special characters
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
      stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  /**
   * Format date consistently as MM/DD/YYYY
   */
  private static formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}/${day}/${year}`;
  }

  /**
   * Format currency with proper decimal places
   */
  private static formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0.00';
    return amount.toFixed(2);
  }

  /**
   * Format boolean values for better readability
   */
  private static formatBoolean(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  }

  /**
   * Generate CSV string from data with custom column mapping
   */
  static generateCsv(
    data: any[],
    columns: { 
      key: string; 
      header: string; 
      formatter?: (value: any, row?: any) => string;
    }[],
    options: {
      includeBOM?: boolean;
      dateColumns?: string[];
      currencyColumns?: string[];
      booleanColumns?: string[];
    } = {}
  ): string {
    const { 
      includeBOM = true,
      dateColumns = [],
      currencyColumns = [],
      booleanColumns = []
    } = options;

    // Generate headers
    const headers = columns.map(col => this.escapeValue(col.header));
    
    // Generate rows
    const rows = data.map(row => {
      return columns.map(col => {
        let value = this.getNestedValue(row, col.key);

        // Apply custom formatter if provided
        if (col.formatter) {
          value = col.formatter(value, row);
        } else {
          // Apply default formatters based on column type
          if (dateColumns.includes(col.key)) {
            value = this.formatDate(value);
          } else if (currencyColumns.includes(col.key)) {
            value = this.formatCurrency(value);
          } else if (booleanColumns.includes(col.key)) {
            value = this.formatBoolean(value);
          }
        }

        return this.escapeValue(value);
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\r\n');
    
    // Add BOM for Excel compatibility if requested
    return includeBOM ? this.BOM + csvContent : csvContent;
  }

  /**
   * Generate CSV stream for large datasets
   */
  static generateCsvStream(
    dataStream: Readable,
    columns: { 
      key: string; 
      header: string; 
      formatter?: (value: any, row?: any) => string;
    }[],
    options: {
      includeBOM?: boolean;
      dateColumns?: string[];
      currencyColumns?: string[];
      booleanColumns?: string[];
    } = {}
  ): Readable {
    const { 
      includeBOM = true,
      dateColumns = [],
      currencyColumns = [],
      booleanColumns = []
    } = options;

    const csvStream = new Readable({
      read() {}
    });

    // Write BOM if needed
    if (includeBOM) {
      csvStream.push(this.BOM);
    }

    // Write headers
    const headers = columns.map(col => this.escapeValue(col.header));
    csvStream.push(headers.join(',') + '\r\n');

    // Process data stream
    dataStream.on('data', (row) => {
      const csvRow = columns.map(col => {
        let value = this.getNestedValue(row, col.key);

        // Apply custom formatter if provided
        if (col.formatter) {
          value = col.formatter(value, row);
        } else {
          // Apply default formatters based on column type
          if (dateColumns.includes(col.key)) {
            value = this.formatDate(value);
          } else if (currencyColumns.includes(col.key)) {
            value = this.formatCurrency(value);
          } else if (booleanColumns.includes(col.key)) {
            value = this.formatBoolean(value);
          }
        }

        return this.escapeValue(value);
      }).join(',');

      csvStream.push(csvRow + '\r\n');
    });

    dataStream.on('end', () => {
      csvStream.push(null); // Signal end of stream
    });

    dataStream.on('error', (error) => {
      csvStream.destroy(error);
    });

    return csvStream;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix: string, extension: string = 'csv'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.${extension}`;
  }

  /**
   * Sanitize data to remove sensitive fields
   */
  static sanitizeData(
    data: any[],
    sensitiveFields: string[] = ['password', 'passwordHash', 'apiKey', 'secret', 'token', 'ssn']
  ): any[] {
    return data.map(item => {
      const sanitized = { ...item };
      sensitiveFields.forEach(field => {
        this.removeSensitiveField(sanitized, field);
      });
      return sanitized;
    });
  }

  /**
   * Remove sensitive fields recursively
   */
  private static removeSensitiveField(obj: any, field: string): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        this.removeSensitiveField(obj[key], field);
      }
    }
  }

  /**
   * Column definitions for common exports
   */
  static readonly COLUMN_DEFINITIONS = {
    FLEET_VEHICLES: [
      { key: 'unitNumber', header: 'Unit Number' },
      { key: 'vin', header: 'VIN' },
      { key: 'year', header: 'Year' },
      { key: 'make', header: 'Make' },
      { key: 'model', header: 'Model' },
      { key: 'vehicleType', header: 'Type' },
      { key: 'licensePlate', header: 'License Plate' },
      { key: 'currentOdometer', header: 'Odometer' },
      { key: 'lastServiceDate', header: 'Last Service' },
      { key: 'nextServiceDue', header: 'Next Service' },
      { key: 'isActive', header: 'Active' },
      { key: 'notes', header: 'Notes' },
    ],
    
    FLEET_JOBS: [
      { key: 'jobNumber', header: 'Job Number' },
      { key: 'createdAt', header: 'Date' },
      { key: 'serviceType', header: 'Service Type' },
      { key: 'vehicleId', header: 'Vehicle' },
      { key: 'description', header: 'Description' },
      { key: 'status', header: 'Status' },
      { key: 'estimatedCost', header: 'Estimated Cost' },
      { key: 'actualCost', header: 'Actual Cost' },
      { key: 'contractorName', header: 'Contractor' },
      { key: 'completedAt', header: 'Completion Date' },
    ],

    USERS: [
      { key: 'id', header: 'User ID' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role' },
      { key: 'isActive', header: 'Active' },
      { key: 'createdAt', header: 'Created Date' },
      { key: 'lastLogin', header: 'Last Login' },
    ],

    CONTRACTORS: [
      { key: 'id', header: 'Contractor ID' },
      { key: 'businessName', header: 'Business Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'status', header: 'Status' },
      { key: 'performanceTier', header: 'Performance Tier' },
      { key: 'rating', header: 'Rating' },
      { key: 'completedJobs', header: 'Completed Jobs' },
      { key: 'totalEarnings', header: 'Total Earnings' },
      { key: 'serviceAreas', header: 'Service Areas' },
      { key: 'joinedDate', header: 'Joined Date' },
    ],

    BILLING: [
      { key: 'id', header: 'Transaction ID' },
      { key: 'date', header: 'Date' },
      { key: 'type', header: 'Type' },
      { key: 'fleetAccount', header: 'Fleet Account' },
      { key: 'description', header: 'Description' },
      { key: 'amount', header: 'Amount' },
      { key: 'status', header: 'Status' },
      { key: 'paymentMethod', header: 'Payment Method' },
      { key: 'invoiceNumber', header: 'Invoice Number' },
    ],

    ANALYTICS: [
      { key: 'date', header: 'Date' },
      { key: 'metric', header: 'Metric' },
      { key: 'value', header: 'Value' },
      { key: 'category', header: 'Category' },
      { key: 'trend', header: 'Trend' },
      { key: 'comparison', header: 'vs Previous Period' },
    ],
  };
}

export default CsvService;