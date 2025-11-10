import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Send, Edit, Mail, MessageSquare, CheckCircle,
  User, Phone, MapPin, Calendar, FileText, DollarSign,
  Printer, Share2, Clock, AlertCircle, Truck
} from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceData {
  id: string;
  jobNumber: string;
  invoiceNumber: string;
  status: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  contractor: {
    name: string;
    companyName: string;
    phone: string;
    email: string;
  };
  job: {
    location: string;
    serviceType: string;
    completionNotes: string;
    completedAt: string;
    vehicle?: {
      vin?: string;
      unit?: string;
      make?: string;
      model?: string;
    };
  };
  lineItems: Array<{
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  photos?: string[];
  signature?: string;
}

export default function InvoicePreview() {
  const { id: jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch invoice data
  const { data: invoice, isLoading } = useQuery<InvoiceData>({
    queryKey: [`/api/contractor/invoices/${jobId}`],
    enabled: !!jobId,
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async (method: "email" | "sms") => {
      return apiRequest(`/api/contractor/invoices/${jobId}/send`, "POST", { method });
    },
    onSuccess: (_, method) => {
      toast({
        title: "Invoice sent successfully",
        description: `Invoice has been sent via ${method === "email" ? "email" : "SMS"}`,
      });
      setShowSendDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/contractor/invoices/${jobId}`] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to send invoice",
        description: "Please try again later",
      });
    },
  });

  // Download PDF
  const downloadPDF = async () => {
    if (!invoice) return;
    
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("invoice-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

      toast({
        title: "PDF downloaded",
        description: "Invoice has been saved to your device",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate PDF",
        description: "Please try again later",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded-md w-1/3"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">Invoice not found</p>
              <Button onClick={() => navigate("/contractor/jobs")}>
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invoice Preview</h1>
            <p className="text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/contractor/jobs/${jobId}/complete`)}
              data-testid="button-edit-invoice"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Invoice
            </Button>
            <Button
              variant="outline"
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => setShowSendDialog(true)}
              data-testid="button-send-customer"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Service Invoice</CardTitle>
                  <CardDescription className="mt-2">
                    Invoice #{invoice.invoiceNumber}
                  </CardDescription>
                </div>
                <Badge 
                  variant={invoice.status === "paid" ? "default" : "outline"}
                  className="text-base"
                >
                  {invoice.status === "paid" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Paid
                    </>
                  ) : (
                    "Pending Payment"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Section */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground">FROM</h3>
                  <div className="space-y-2">
                    <p className="font-semibold">{invoice.contractor.companyName || invoice.contractor.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {invoice.contractor.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {invoice.contractor.email}
                    </div>
                  </div>
                </div>

                {/* To Section */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground">BILL TO</h3>
                  <div className="space-y-2">
                    <p className="font-semibold">{invoice.customer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {invoice.customer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {invoice.customer.email}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Job Information */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">JOB DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Service Location</p>
                        <p className="text-muted-foreground">{invoice.job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Completion Date</p>
                        <p className="text-muted-foreground">
                          {format(new Date(invoice.job.completedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Service Type</p>
                        <p className="text-muted-foreground">{invoice.job.serviceType}</p>
                      </div>
                    </div>
                    {invoice.job.vehicle && (
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Vehicle</p>
                          <p className="text-muted-foreground">
                            {invoice.job.vehicle.unit || invoice.job.vehicle.vin}
                            {invoice.job.vehicle.make && (
                              <span className="block">
                                {invoice.job.vehicle.make} {invoice.job.vehicle.model}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion Notes */}
              {invoice.job.completionNotes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">SERVICE NOTES</h3>
                    <p className="text-sm whitespace-pre-wrap">{invoice.job.completionNotes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">CHARGES</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <Badge variant="outline" className="mt-1">
                              {item.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Due</span>
                    <span data-testid="text-total-due">${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {invoice.photos && invoice.photos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">DOCUMENTATION PHOTOS</h3>
                    <div className="flex flex-wrap gap-4">
                      {invoice.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Documentation ${index + 1}`}
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Signature */}
              {invoice.signature && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">CONTRACTOR SIGNATURE</h3>
                    <img
                      src={invoice.signature}
                      alt="Contractor Signature"
                      className="h-20 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed on {format(new Date(invoice.job.completedAt), "PPP 'at' p")}
                    </p>
                  </div>
                </>
              )}

              {/* Payment Instructions */}
              <div className="bg-muted rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-sm mb-2">Payment Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  Payment is due upon receipt. You can pay online via the link sent to your email
                  or contact us for alternative payment methods.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice to Customer</DialogTitle>
              <DialogDescription>
                Choose how you want to send this invoice to {invoice.customer.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup value={sendMethod} onValueChange={(value) => setSendMethod(value as "email" | "sms")}>
                <div className="flex items-start space-x-3 mb-4">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Send via Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send to: {invoice.customer.email}
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Send via SMS</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send to: {invoice.customer.phone}
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSendDialog(false)}
                data-testid="button-cancel-send"
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendInvoiceMutation.mutate(sendMethod)}
                disabled={sendInvoiceMutation.isPending}
                data-testid="button-confirm-send"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}