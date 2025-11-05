import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Mail, 
  Printer, 
  Eye, 
  FileText,
  MapPin,
  Calendar,
  Truck,
  DollarSign,
  Building2,
  User,
  Hash
} from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Invoice, Job, User, FleetAccount, Transaction } from "@shared/schema";

interface InvoiceTemplateProps {
  invoice: Invoice;
  job: Job;
  customer: User;
  fleetAccount?: FleetAccount;
  contractor?: any;
  transactions?: Transaction[];
  onDownload?: () => void;
  onEmail?: () => void;
  onPrint?: () => void;
}

export function InvoiceTemplate({
  invoice,
  job,
  customer,
  fleetAccount,
  contractor,
  transactions,
  onDownload,
  onEmail,
  onPrint,
}: InvoiceTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Generate PDF from HTML
  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 25.4;
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${invoiceRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    if (onPrint) onPrint();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      overdue: "bg-red-500",
      cancelled: "bg-red-700",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods: Record<string, string> = {
      credit_card: "Credit Card",
      efs_check: "EFS Check",
      comdata_check: "Comdata Check",
      fleet_account: "Fleet Account",
      cash: "Cash",
    };
    return methods[method] || method;
  };

  const vehicleInfo = job.vehicleInfo as any;
  const laborHours = (job.actualDuration || job.estimatedDuration || 60) / 60;
  const laborRate = 125;
  const taxRate = 0.0825;
  const fleetDiscountRate = fleetAccount?.pricingTier === "gold" ? 0.1 : 
                           fleetAccount?.pricingTier === "silver" ? 0.05 : 
                           fleetAccount?.pricingTier === "platinum" ? 0.15 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-end no-print">
        <Button
          variant="outline"
          onClick={() => window.print()}
          disabled={isGenerating}
          data-testid="button-print"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button
          variant="outline"
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          data-testid="button-download-pdf"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
        {onEmail && (
          <Button
            variant="outline"
            onClick={onEmail}
            disabled={isGenerating}
            data-testid="button-email"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Invoice
          </Button>
        )}
      </div>

      {/* Invoice Template */}
      <Card className="bg-white" ref={invoiceRef}>
        {/* Header */}
        <div className="bg-blue-900 text-white p-8 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">TruckFixGo</h1>
              <p className="text-blue-100 mt-1">Professional Truck Repair Services</p>
              <div className="mt-4 text-sm text-blue-100">
                <p>123 Highway Service Rd</p>
                <p>Dallas, TX 75201</p>
                <p>1-800-TRUCKFIX | invoices@truckfixgo.com</p>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                className={`${job.jobType === "emergency" ? "bg-orange-500" : "bg-blue-600"} text-white px-4 py-1`}
              >
                {job.jobType === "emergency" ? "EMERGENCY" : "SCHEDULED"}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* Invoice Title and Details */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
          </div>

          {/* Invoice Info Box */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">Invoice Number:</span>
                  <span className="text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">Job ID:</span>
                  <span className="text-gray-900 font-mono text-sm">{job.id}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="font-semibold text-gray-700">Invoice Date: </span>
                  <span className="text-gray-900">{format(invoice.issueDate, "MMM dd, yyyy")}</span>
                </div>
                {invoice.dueDate && (
                  <div className="mb-2">
                    <span className="font-semibold text-gray-700">Due Date: </span>
                    <span className="text-gray-900">{format(invoice.dueDate, "MMM dd, yyyy")}</span>
                  </div>
                )}
                <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bill To and Service Location */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-100 px-4 py-2 rounded-t-lg">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bill To
                </h3>
              </div>
              <div className="border border-t-0 border-gray-200 rounded-b-lg p-4">
                <p className="font-semibold text-gray-900">
                  {fleetAccount ? fleetAccount.companyName : 
                   `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Guest Customer"}
                </p>
                {fleetAccount && fleetAccount.primaryContactName && (
                  <p className="text-gray-600 text-sm mt-1">Contact: {fleetAccount.primaryContactName}</p>
                )}
                {fleetAccount?.address && (
                  <p className="text-gray-600 text-sm mt-1">{fleetAccount.address}</p>
                )}
                {fleetAccount?.city && (
                  <p className="text-gray-600 text-sm">
                    {fleetAccount.city}, {fleetAccount.state} {fleetAccount.zip}
                  </p>
                )}
                {!fleetAccount && customer.email && (
                  <p className="text-gray-600 text-sm mt-1">{customer.email}</p>
                )}
                {!fleetAccount && customer.phone && (
                  <p className="text-gray-600 text-sm">{customer.phone}</p>
                )}
              </div>
            </div>

            <div>
              <div className="bg-gray-100 px-4 py-2 rounded-t-lg">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Location
                </h3>
              </div>
              <div className="border border-t-0 border-gray-200 rounded-b-lg p-4">
                <p className="text-gray-900">{job.serviceLocation || "On-site service"}</p>
                {vehicleInfo && (
                  <>
                    {vehicleInfo.make && vehicleInfo.model && (
                      <p className="text-gray-600 text-sm mt-2">
                        <Truck className="h-3 w-3 inline mr-1" />
                        {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      </p>
                    )}
                    {vehicleInfo.vin && (
                      <p className="text-gray-600 text-sm font-mono">VIN: {vehicleInfo.vin}</p>
                    )}
                    {vehicleInfo.unitNumber && (
                      <p className="text-gray-600 text-sm">Unit #: {vehicleInfo.unitNumber}</p>
                    )}
                  </>
                )}
                <p className="text-gray-600 text-sm mt-2">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {format(job.scheduledTime || job.createdAt, "MMM dd, yyyy h:mm a")}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Services Table */}
          <div>
            <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg">
              <h3 className="font-semibold">Service Details</h3>
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Qty</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-900">
                      {job.jobType === "emergency" ? "Emergency" : "Scheduled"} Service - {job.issueDescription || "Truck Repair"}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-900">1</td>
                    <td className="text-right px-4 py-3 text-gray-900">${job.quotedPrice?.toFixed(2)}</td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-900">${job.quotedPrice?.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Labor</td>
                    <td className="text-right px-4 py-3 text-gray-900">{laborHours.toFixed(1)} hrs</td>
                    <td className="text-right px-4 py-3 text-gray-900">${laborRate.toFixed(2)}</td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-900">
                      ${(laborHours * laborRate).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <Separator />
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {fleetDiscountRate > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Fleet Discount ({(fleetDiscountRate * 100).toFixed(0)}%):</span>
                  <span className="font-semibold">-${(invoice.subtotal * fleetDiscountRate).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                <span className="font-semibold">${(invoice.subtotal * taxRate).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between bg-gray-800 text-white p-3 rounded-lg">
                <span className="text-lg font-semibold">Total Due:</span>
                <span className="text-xl font-bold">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Information
            </h3>
            {invoice.status === "paid" ? (
              <div className="space-y-1 text-sm text-gray-600">
                <p>Payment received on {invoice.paidDate ? format(invoice.paidDate, "MMM dd, yyyy") : "N/A"}</p>
                {transactions && transactions.length > 0 && (
                  <>
                    <p>Payment Method: {getPaymentMethodDisplay(transactions[0].paymentMethodType)}</p>
                    <p>Transaction ID: {transactions[0].stripePaymentIntentId || transactions[0].id}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-sm text-gray-600">
                <p>Payment Terms: Net 30</p>
                <p>Accepted Payment Methods: Credit Card, Fleet Check, Cash</p>
                {fleetAccount && (
                  <>
                    <p>Fleet Account: {fleetAccount.companyName}</p>
                    <p>Account Tier: {fleetAccount.pricingTier.toUpperCase()}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="border-t pt-4 mt-8">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Terms & Conditions: Payment is due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.</p>
              <p>All services performed in accordance with TruckFixGo service agreement. Warranty: 90 days on parts, 30 days on labor.</p>
              <p>For questions about this invoice, contact our billing department at invoices@truckfixgo.com or 1-800-TRUCKFIX.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}