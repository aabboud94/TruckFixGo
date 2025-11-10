import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import type {
  Job,
  Transaction,
  User,
  ContractorProfile,
  FleetAccount,
  Invoice,
  ServiceType,
} from "@shared/schema";

export interface InvoiceData {
  invoice: Invoice;
  job: Job;
  customer: User;
  contractor?: ContractorProfile & { user: User };
  fleetAccount?: FleetAccount;
  transactions: Transaction[];
  serviceTypes?: ServiceType[];
  laborHours?: number;
  partsUsed?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  taxRate?: number;
  fleetDiscount?: number;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

class PDFInvoiceService {
  private readonly companyInfo = {
    name: "TruckFixGo",
    tagline: "Professional Truck Repair Services",
    address: "123 Highway Service Rd",
    city: "Dallas, TX 75201",
    phone: "1-800-TRUCKFIX",
    email: "invoices@truckfixgo.com",
    website: "www.truckfixgo.com",
    taxId: "XX-XXXXXXX",
  };

  private readonly colors = {
    fleetBlue: "#1E3A8A",
    safetyOrange: "#F97316",
    darkGray: "#374151",
    mediumGray: "#6B7280",
    lightGray: "#E5E7EB",
    successGreen: "#059669",
  };

  async generateInvoice(data: InvoiceData): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set default font
    doc.setFont("helvetica");
    
    // Add header
    await this.addHeader(doc, data);
    
    // Add invoice details
    this.addInvoiceDetails(doc, data);
    
    // Add customer and service information
    this.addCustomerInfo(doc, data);
    
    // Add itemized services
    this.addItemizedServices(doc, data);
    
    // Add totals
    this.addTotals(doc, data);
    
    // Add payment information
    this.addPaymentInfo(doc, data);
    
    // Add footer
    this.addFooter(doc, data);
    
    // Add QR code for payment (if applicable)
    if (data.invoice.status === "pending" && data.invoice.amountDue > 0) {
      await this.addPaymentQRCode(doc, data);
    }
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  }

  private async addHeader(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Company header background
    doc.setFillColor(30, 58, 138); // Fleet Blue
    doc.rect(0, 0, pageWidth, 35, "F");
    
    // Company name and tagline
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(this.companyInfo.name, 15, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(this.companyInfo.tagline, 15, 22);
    
    // Invoice type badge
    const invoiceType = data.job.jobType === "emergency" ? "EMERGENCY" : "SCHEDULED";
    const badgeColor = data.job.jobType === "emergency" ? this.colors.safetyOrange : this.colors.fleetBlue;
    
    doc.setFillColor(...this.hexToRgb(badgeColor));
    doc.roundedRect(pageWidth - 50, 10, 35, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceType, pageWidth - 32.5, 16, { align: "center" });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }

  private addInvoiceDetails(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 45;
    
    // Invoice title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    
    // Invoice details box
    doc.setDrawColor(...this.hexToRgb(this.colors.lightGray));
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, pageWidth - 30, 25, "S");
    
    // Invoice number
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Number:", 20, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.text(data.invoice.invoiceNumber, 55, yPos + 8);
    
    // Job ID
    doc.setFont("helvetica", "bold");
    doc.text("Job ID:", 20, yPos + 15);
    doc.setFont("helvetica", "normal");
    doc.text(data.job.id, 55, yPos + 15);
    
    // Date
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Date:", 120, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.text(format(data.invoice.issueDate, "MMM dd, yyyy"), 150, yPos + 8);
    
    // Due date
    if (data.invoice.dueDate) {
      doc.setFont("helvetica", "bold");
      doc.text("Due Date:", 120, yPos + 15);
      doc.setFont("helvetica", "normal");
      doc.text(format(data.invoice.dueDate, "MMM dd, yyyy"), 150, yPos + 15);
    }
    
    // Status
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 120, yPos + 22);
    this.addStatusBadge(doc, 150, yPos + 19, data.invoice.status);
  }

  private addCustomerInfo(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 85;
    
    // Bill To section
    doc.setFillColor(...this.hexToRgb(this.colors.lightGray));
    doc.rect(15, yPos, (pageWidth - 40) / 2, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", 20, yPos + 5.5);
    
    // Service Location section
    doc.rect(pageWidth / 2 + 5, yPos, (pageWidth - 40) / 2, 8, "F");
    doc.text("Service Location", pageWidth / 2 + 10, yPos + 5.5);
    
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Customer details
    const customerName = data.fleetAccount
      ? data.fleetAccount.companyName
      : `${data.customer.firstName || ""} ${data.customer.lastName || ""}`.trim() || "Guest Customer";
    
    doc.text(customerName, 20, yPos);
    yPos += 5;
    
    if (data.fleetAccount) {
      doc.text(`Contact: ${data.fleetAccount.primaryContactName || "N/A"}`, 20, yPos);
      yPos += 5;
      if (data.fleetAccount.address) {
        doc.text(data.fleetAccount.address, 20, yPos);
        yPos += 5;
      }
      if (data.fleetAccount.city && data.fleetAccount.state) {
        doc.text(`${data.fleetAccount.city}, ${data.fleetAccount.state} ${data.fleetAccount.zip || ""}`, 20, yPos);
        yPos += 5;
      }
    } else {
      if (data.customer.email) {
        doc.text(data.customer.email, 20, yPos);
        yPos += 5;
      }
      if (data.customer.phone) {
        doc.text(data.customer.phone, 20, yPos);
        yPos += 5;
      }
    }
    
    // Service location details
    yPos = 97;
    doc.text(data.job.serviceLocation || "On-site service", pageWidth / 2 + 10, yPos);
    yPos += 5;
    
    if (data.job.vehicleInfo) {
      const vehicleInfo = data.job.vehicleInfo as any;
      if (vehicleInfo.make && vehicleInfo.model) {
        doc.text(`${vehicleInfo.year || ""} ${vehicleInfo.make} ${vehicleInfo.model}`.trim(), pageWidth / 2 + 10, yPos);
        yPos += 5;
      }
      if (vehicleInfo.vin) {
        doc.text(`VIN: ${vehicleInfo.vin}`, pageWidth / 2 + 10, yPos);
        yPos += 5;
      }
      if (vehicleInfo.unitNumber) {
        doc.text(`Unit #: ${vehicleInfo.unitNumber}`, pageWidth / 2 + 10, yPos);
        yPos += 5;
      }
    }
    
    doc.text(`Service Date: ${format(data.job.scheduledTime || data.job.createdAt, "MMM dd, yyyy h:mm a")}`, pageWidth / 2 + 10, yPos);
  }

  private addItemizedServices(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 135;
    
    // Table header
    doc.setFillColor(...this.hexToRgb(this.colors.darkGray));
    doc.rect(15, yPos, pageWidth - 30, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, yPos + 5.5);
    doc.text("Qty", pageWidth - 70, yPos + 5.5, { align: "right" });
    doc.text("Unit Price", pageWidth - 45, yPos + 5.5, { align: "right" });
    doc.text("Total", pageWidth - 20, yPos + 5.5, { align: "right" });
    
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    
    const lineItems: InvoiceLineItem[] = [];
    
    // Use line items from database if available
    if (data.invoice.lineItems && data.invoice.lineItems.length > 0) {
      // Sort by sortOrder if available
      const sortedItems = [...data.invoice.lineItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      for (const item of sortedItems) {
        lineItems.push({
          description: item.description,
          quantity: parseFloat(item.quantity?.toString() || '1'),
          unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
          total: parseFloat(item.totalPrice?.toString() || '0'),
        });
      }
    } else {
      // Fallback to legacy behavior if no line items in database
      // Add service charge
      if (data.job.quotedPrice) {
        lineItems.push({
          description: `${data.job.jobType === "emergency" ? "Emergency" : "Scheduled"} Service - ${data.job.issueDescription || "Truck Repair"}`,
          quantity: 1,
          unitPrice: parseFloat(data.job.quotedPrice.toString()),
          total: parseFloat(data.job.quotedPrice.toString()),
        });
      }
      
      // Add labor if specified
      if (data.laborHours && data.laborHours > 0) {
        const laborRate = 125; // Default hourly rate
        lineItems.push({
          description: "Labor",
          quantity: data.laborHours,
          unitPrice: laborRate,
          total: data.laborHours * laborRate,
        });
      }
    }
    
    // Add parts if specified (legacy support)
    if (data.partsUsed && data.partsUsed.length > 0) {
      data.partsUsed.forEach(part => {
        lineItems.push({
          description: `Part: ${part.name}`,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          total: part.total,
        });
      });
    }
    
    // Draw line items
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    lineItems.forEach(item => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Draw alternating row background
      if (lineItems.indexOf(item) % 2 === 0) {
        doc.setFillColor(...this.hexToRgb("#F9FAFB"));
        doc.rect(15, yPos - 3, pageWidth - 30, 7, "F");
      }
      
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), pageWidth - 70, yPos, { align: "right" });
      doc.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - 45, yPos, { align: "right" });
      doc.text(`$${item.total.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
      
      yPos += 7;
    });
    
    // Store the final y position for totals section
    return yPos;
  }

  private addTotals(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 200; // Adjust based on itemized services
    
    // Draw separator line
    doc.setDrawColor(...this.hexToRgb(this.colors.lightGray));
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2, yPos, pageWidth - 15, yPos);
    
    yPos += 5;
    doc.setFontSize(10);
    
    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", pageWidth - 50, yPos);
    doc.text(`$${data.invoice.subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    
    yPos += 6;
    
    // Fleet discount if applicable
    if (data.fleetDiscount && data.fleetDiscount > 0) {
      doc.text(`Fleet Discount (${(data.fleetDiscount * 100).toFixed(0)}%):`, pageWidth - 50, yPos);
      doc.text(`-$${(data.invoice.subtotal * data.fleetDiscount).toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
      yPos += 6;
    }
    
    // Tax
    const taxRate = data.taxRate || 0.0825; // Default 8.25% tax rate
    const taxAmount = data.invoice.subtotal * taxRate;
    doc.text(`Tax (${(taxRate * 100).toFixed(2)}%):`, pageWidth - 50, yPos);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    
    yPos += 8;
    
    // Total
    doc.setFillColor(...this.hexToRgb(this.colors.darkGray));
    doc.rect(pageWidth / 2, yPos - 4, (pageWidth / 2) - 15, 10, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Due:", pageWidth - 50, yPos + 2);
    doc.text(`$${data.invoice.totalAmount.toFixed(2)}`, pageWidth - 20, yPos + 2, { align: "right" });
    
    doc.setTextColor(0, 0, 0);
  }

  private addPaymentInfo(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 225;
    
    // Payment information header
    doc.setFillColor(...this.hexToRgb(this.colors.lightGray));
    doc.rect(15, yPos, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Information", 20, yPos + 5.5);
    
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    if (data.invoice.status === "paid") {
      doc.text(`Payment received on ${format(data.invoice.paidDate!, "MMM dd, yyyy")}`, 20, yPos);
      yPos += 5;
      
      if (data.transactions && data.transactions.length > 0) {
        const lastTransaction = data.transactions[data.transactions.length - 1];
        doc.text(`Payment Method: ${this.formatPaymentMethod(lastTransaction.paymentMethodType)}`, 20, yPos);
        yPos += 5;
        doc.text(`Transaction ID: ${lastTransaction.stripePaymentIntentId || lastTransaction.id}`, 20, yPos);
      }
    } else if (data.invoice.status === "pending") {
      doc.text("Payment Terms: Net 30", 20, yPos);
      yPos += 5;
      doc.text("Accepted Payment Methods: Credit Card, Fleet Check, Cash", 20, yPos);
      yPos += 5;
      
      if (data.fleetAccount) {
        doc.text(`Fleet Account: ${data.fleetAccount.companyName}`, 20, yPos);
        yPos += 5;
        doc.text(`Account Terms: ${this.getFleetTerms(data.fleetAccount.pricingTier)}`, 20, yPos);
      }
    }
  }

  private addFooter(doc: jsPDF, data: InvoiceData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = pageHeight - 30;
    
    // Terms and conditions
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.hexToRgb(this.colors.mediumGray));
    
    const terms = [
      "Terms & Conditions: Payment is due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.",
      "All services performed in accordance with TruckFixGo service agreement. Warranty: 90 days on parts, 30 days on labor.",
      "For questions about this invoice, contact our billing department at invoices@truckfixgo.com or 1-800-TRUCKFIX.",
    ];
    
    terms.forEach(term => {
      doc.text(term, pageWidth / 2, yPos, { align: "center", maxWidth: pageWidth - 40 });
      yPos += 4;
    });
    
    // Footer line
    doc.setDrawColor(...this.hexToRgb(this.colors.lightGray));
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Company info
    doc.setFontSize(9);
    doc.text(
      `${this.companyInfo.name} | ${this.companyInfo.address}, ${this.companyInfo.city} | ${this.companyInfo.phone} | ${this.companyInfo.website}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  private async addPaymentQRCode(doc: jsPDF, data: InvoiceData) {
    try {
      const paymentUrl = `https://truckfixgo.com/pay/${data.invoice.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 150,
        margin: 1,
      });
      
      // Add QR code to the right side
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(qrCodeDataUrl, "PNG", pageWidth - 45, 240, 30, 30);
      
      doc.setFontSize(8);
      doc.text("Scan to pay", pageWidth - 30, 273, { align: "center" });
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  }

  private addStatusBadge(doc: jsPDF, x: number, y: number, status: string) {
    const statusColors: Record<string, string> = {
      draft: this.colors.mediumGray,
      pending: this.colors.safetyOrange,
      paid: this.colors.successGreen,
      overdue: "#DC2626",
      cancelled: "#991B1B",
    };
    
    const color = statusColors[status] || this.colors.mediumGray;
    doc.setFillColor(...this.hexToRgb(color));
    doc.roundedRect(x, y, 25, 6, 1, 1, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(status.toUpperCase(), x + 12.5, y + 4, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
  }

  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      credit_card: "Credit Card",
      efs_check: "EFS Check",
      comdata_check: "Comdata Check",
      fleet_account: "Fleet Account",
      cash: "Cash",
    };
    return methodMap[method] || method;
  }

  private getFleetTerms(tier: string): string {
    const termsMap: Record<string, string> = {
      standard: "Net 30",
      silver: "Net 45, 5% discount",
      gold: "Net 60, 10% discount",
      platinum: "Net 90, 15% discount",
    };
    return termsMap[tier] || "Net 30";
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  // Generate unique invoice number
  generateInvoiceNumber(prefix: string = "INV"): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${year}${month}-${random}`;
  }

  // Create earnings statement for contractors
  async generateContractorEarningsStatement(
    contractorId: string,
    fromDate: Date,
    toDate: Date,
    earnings: any[]
  ): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Similar structure but focused on earnings
    // Implementation details would follow similar pattern
    
    return Buffer.from(doc.output("arraybuffer"));
  }

  // Generate fleet consolidated invoice
  async generateFleetConsolidatedInvoice(
    fleetId: string,
    month: Date,
    jobs: Job[],
    totalAmount: number
  ): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Implementation for consolidated fleet invoices
    // Would include all jobs for the month, vehicle breakdown, etc.
    
    return Buffer.from(doc.output("arraybuffer"));
  }
}

export default new PDFInvoiceService();