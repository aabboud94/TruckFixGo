import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Edit, 
  DollarSign, 
  Calendar,
  User,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Mail,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface InvoiceLineItem {
  id?: string;
  type: "part" | "labor" | "fee" | "tax" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerId: string;
  customerName: string;
  jobNumber: string;
  serviceType: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  amountDue: string;
  status: "draft" | "pending" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate?: string;
  paidAt?: string;
  sentAt?: string;
  lineItems?: InvoiceLineItem[];
}

const statusConfig = {
  draft: { label: "Draft", color: "secondary", icon: FileText },
  pending: { label: "Pending", color: "default", icon: Clock },
  sent: { label: "Sent", color: "default", icon: FileText },
  paid: { label: "Paid", color: "success", icon: CheckCircle },
  overdue: { label: "Overdue", color: "destructive", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "secondary", icon: XCircle }
};

const lineItemTypes = [
  { value: "part", label: "Part" },
  { value: "labor", label: "Labor" },
  { value: "fee", label: "Fee" },
  { value: "tax", label: "Tax" },
  { value: "other", label: "Other" }
];

export default function ContractorInvoices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Fetch invoices
  const { data: invoices = [], isLoading, error } = useQuery<Invoice[]>({
    queryKey: ["/api/contractor/invoices"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, lineItems }: { invoiceId: string; lineItems: InvoiceLineItem[] }) => {
      return await apiRequest(`/api/contractor/invoices/${invoiceId}`, "PATCH", { lineItems });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Updated",
        description: "Invoice line items have been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/invoices"] });
      setShowEditDialog(false);
      setEditingInvoice(null);
      setLineItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update invoice",
        variant: "destructive"
      });
    }
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, email, message }: { invoiceId: string; email: string; message?: string }) => {
      return await apiRequest(`/api/contractor/invoices/${invoiceId}/send`, "POST", {
        email,
        message
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Sent",
        description: "Invoice has been successfully sent to the customer"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/invoices"] });
      setShowSendDialog(false);
      setSendingInvoice(null);
      setCustomerEmail("");
      setEmailMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send invoice",
        variant: "destructive"
      });
    }
  });

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setLineItems(invoice.lineItems || []);
    setShowEditDialog(true);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    setSendingInvoice(invoice);
    // Pre-fill email if available from customer data
    setCustomerEmail("");
    setEmailMessage("");
    setShowSendDialog(true);
  };

  const handleSendInvoiceSubmit = () => {
    if (!sendingInvoice || !customerEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid email address",
        variant: "destructive"
      });
      return;
    }

    sendInvoiceMutation.mutate({
      invoiceId: sendingInvoice.id,
      email: customerEmail,
      message: emailMessage
    });
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        type: "other",
        description: "",
        quantity: 1,
        unitPrice: 0
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };
    
    // Recalculate total price if quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : newLineItems[index].quantity;
      const unitPrice = field === "unitPrice" ? value : newLineItems[index].unitPrice;
      newLineItems[index].totalPrice = quantity * unitPrice;
    }
    
    setLineItems(newLineItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const handleSaveInvoice = () => {
    if (!editingInvoice) return;
    
    // Validate line items
    const invalidItems = lineItems.filter(
      item => !item.description || item.quantity <= 0 || item.unitPrice < 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all line item details correctly",
        variant: "destructive"
      });
      return;
    }
    
    updateInvoiceMutation.mutate({
      invoiceId: editingInvoice.id,
      lineItems
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="text-lg font-semibold">Failed to load invoices</p>
              <p className="text-muted-foreground">Please try again later</p>
              <Button 
                onClick={() => navigate("/contractor/dashboard")} 
                variant="outline" 
                className="mt-4"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/contractor/dashboard")}
          className="mb-4"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Manage and edit your job invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            View and edit line items for your completed job invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold">No Invoices Found</p>
              <p className="text-muted-foreground">
                Invoices will appear here once you complete jobs
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusInfo = statusConfig[invoice.status];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-mono">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {invoice.customerName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              ${parseFloat(invoice.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusInfo.color as any}
                            className="gap-1"
                            data-testid={`badge-status-${invoice.id}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.sentAt ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">
                                {format(new Date(invoice.sentAt), "MMM dd")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not sent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvoice(invoice)}
                              disabled={invoice.status === "paid" || invoice.status === "cancelled"}
                              data-testid={`button-send-${invoice.id}`}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditInvoice(invoice)}
                              data-testid={`button-edit-${invoice.id}`}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Invoice Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Send this invoice to the customer via email
            </DialogDescription>
          </DialogHeader>

          {sendingInvoice && (
            <div className="space-y-4">
              {/* Invoice Preview */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Invoice Preview
                  </h4>
                  <Badge variant="outline">{sendingInvoice.invoiceNumber}</Badge>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{sendingInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Due:</span>
                    <span className="font-semibold">${parseFloat(sendingInvoice.amountDue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{sendingInvoice.dueDate ? format(new Date(sendingInvoice.dueDate), "MMM dd, yyyy") : "Net 30"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={statusConfig[sendingInvoice.status].color as any} className="h-5">
                      {statusConfig[sendingInvoice.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-customer-email"
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="email-message">Optional Message</Label>
                <Textarea
                  id="email-message"
                  placeholder="Add a personal message to include with the invoice (optional)"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={4}
                  data-testid="textarea-email-message"
                />
              </div>

              {/* Info Messages */}
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  The invoice will be sent as a PDF attachment. The customer will receive an email with:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 list-disc">
                  <li>Invoice summary in the email body</li>
                  <li>PDF attachment with full invoice details</li>
                  <li>Link to pay online (if payment is pending)</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSendDialog(false);
                setSendingInvoice(null);
                setCustomerEmail("");
                setEmailMessage("");
              }}
              data-testid="button-cancel-send"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvoiceSubmit}
              disabled={!customerEmail || sendInvoiceMutation.isPending}
              data-testid="button-send-invoice"
            >
              {sendInvoiceMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Invoice Line Items</DialogTitle>
            <DialogDescription>
              {editingInvoice && (
                <div className="flex gap-4 mt-2">
                  <span>Invoice: <strong>{editingInvoice.invoiceNumber}</strong></span>
                  <span>Customer: <strong>{editingInvoice.customerName}</strong></span>
                  <span>Job: <strong>{editingInvoice.jobNumber}</strong></span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {lineItems.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg space-y-3"
                  data-testid={`line-item-${index}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">Line Item #{index + 1}</h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveLineItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={item.type}
                        onValueChange={(value) => handleUpdateLineItem(index, "type", value)}
                      >
                        <SelectTrigger data-testid={`select-type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lineItemTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(index, "description", e.target.value)}
                        placeholder="Enter description"
                        data-testid={`input-description-${index}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        data-testid={`input-quantity-${index}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        data-testid={`input-unit-price-${index}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLineItem}
                className="w-full"
                data-testid="button-add-line-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>
          </ScrollArea>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center px-4 py-2 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold" data-testid="total-amount">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setEditingInvoice(null);
                setLineItems([]);
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveInvoice}
              disabled={updateInvoiceMutation.isPending}
              data-testid="button-save-invoice"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}