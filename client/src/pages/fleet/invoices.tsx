import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Send,
  Building2,
  Calendar as CalendarIcon,
  ChevronRight,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Info,
  Package,
  Truck,
  Receipt,
  Filter,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Mail,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface FleetInvoice {
  id: string;
  invoiceNumber: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  fleetAccount: {
    id: string;
    companyName: string;
    accountNumber: string;
    netTerms: number;
  };
  summary: {
    totalVehicles: number;
    totalJobs: number;
    subtotal: number;
    fleetDiscount: number;
    tax: number;
    total: number;
  };
  status: "draft" | "sent" | "viewed" | "paid" | "overdue";
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  vehicles: Array<{
    id: string;
    identifier: string;
    make: string;
    model: string;
    jobCount: number;
    totalCost: number;
  }>;
  jobs: Array<{
    id: string;
    jobNumber: string;
    vehicleIdentifier: string;
    serviceDate: string;
    serviceType: string;
    amount: number;
  }>;
}

interface FleetInvoiceStats {
  totalOutstanding: number;
  totalPaid: number;
  overdueAmount: number;
  averagePaymentDays: number;
  upcomingInvoices: number;
  lastInvoiceDate?: string;
}

export default function FleetInvoices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<FleetInvoice | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [bulkGenerateDialogOpen, setBulkGenerateDialogOpen] = useState(false);

  // Fetch fleet invoices
  const { data: invoicesData, isLoading, refetch } = useQuery<{
    invoices: FleetInvoice[];
    stats: FleetInvoiceStats;
  }>({
    queryKey: [
      "/api/fleet/invoices",
      {
        startDate: selectedPeriod.start.toISOString(),
        endDate: selectedPeriod.end.toISOString(),
        status: filterStatus,
        search: searchQuery,
      },
    ],
  });

  // Generate fleet invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: {
      fleetAccountId: string;
      startDate: Date;
      endDate: Date;
    }) => {
      return await apiRequest("/api/fleet/invoices/generate", {
        method: "POST",
        body: JSON.stringify({
          fleetAccountId: data.fleetAccountId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Generated",
        description: "Fleet invoice has been generated successfully.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  // Download fleet invoice
  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/fleet/invoices/${invoiceId}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Invoice has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  // Send invoice email mutation
  const sendInvoiceEmail = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await apiRequest(`/api/fleet/invoices/${invoiceId}/send-email`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Invoice has been emailed successfully.",
      });
      setEmailDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send invoice email",
        variant: "destructive",
      });
    },
  });

  // Bulk generate invoices mutation
  const bulkGenerateInvoices = useMutation({
    mutationFn: async (data: { month: Date }) => {
      return await apiRequest("/api/fleet/invoices/bulk-generate", {
        method: "POST",
        body: JSON.stringify({
          startDate: startOfMonth(data.month).toISOString(),
          endDate: endOfMonth(data.month).toISOString(),
        }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${data.count} fleet invoices successfully.`,
      });
      setBulkGenerateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Generation Failed",
        description: error.message || "Failed to generate invoices",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-50 border-green-200";
      case "sent":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "overdue":
        return "text-red-600 bg-red-50 border-red-200";
      case "viewed":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "sent":
        return <Mail className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "viewed":
        return <Receipt className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const stats = invoicesData?.stats;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fleet Invoices</h1>
              <p className="text-muted-foreground">
                Manage consolidated invoices for your fleet account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/fleet/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
              <Dialog open={bulkGenerateDialogOpen} onOpenChange={setBulkGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-generate">
                    <Package className="h-4 w-4 mr-2" />
                    Bulk Generate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Generate Invoices</DialogTitle>
                    <DialogDescription>
                      Generate invoices for all fleet vehicles for the selected period.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Month</Label>
                      <Select
                        onValueChange={(value) => {
                          const [year, month] = value.split("-");
                          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                          bulkGenerateInvoices.mutate({ month: date });
                        }}
                      >
                        <SelectTrigger data-testid="select-month">
                          <SelectValue placeholder="Choose a month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2].map((offset) => {
                            const month = subMonths(new Date(), offset);
                            return (
                              <SelectItem
                                key={offset}
                                value={`${month.getFullYear()}-${month.getMonth() + 1}`}
                              >
                                {format(month, "MMMM yyyy")}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <Info className="h-4 w-4 inline mr-1" />
                        This will generate invoices for all completed jobs in the selected
                        period. Existing invoices will not be regenerated.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalOutstanding?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Total unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats?.overdueAmount?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.totalPaid?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Collected this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averagePaymentDays || 0} days
              </div>
              <p className="text-xs text-muted-foreground">
                Average time to payment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Management</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice number or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]" data-testid="select-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-date-range">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedPeriod.start, "MMM d")} -{" "}
                    {format(selectedPeriod.end, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={{
                      from: selectedPeriod.start,
                      to: selectedPeriod.end,
                    }}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setSelectedPeriod({
                          start: range.from,
                          end: range.to,
                        });
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Invoices</CardTitle>
            <CardDescription>
              Consolidated invoices for your fleet vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedInvoice(invoice)}
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.billingPeriod.start), "MMM d")} -
                        {format(new Date(invoice.billingPeriod.end), "MMM d")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {invoice.summary.totalVehicles}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.summary.totalJobs}</TableCell>
                      <TableCell className="font-semibold">
                        ${invoice.summary.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("capitalize", getStatusColor(invoice.status))}
                        >
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{invoice.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadInvoice(invoice.id);
                            }}
                            data-testid={`button-download-${invoice.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(invoice);
                              setEmailDialogOpen(true);
                            }}
                            data-testid={`button-email-${invoice.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No invoices found for the selected period</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Invoice Details Dialog */}
        {selectedInvoice && !emailDialogOpen && (
          <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invoice {selectedInvoice.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  Fleet invoice details and vehicle breakdown
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Invoice Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">
                      {selectedInvoice.fleetAccount.companyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">
                      {selectedInvoice.fleetAccount.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billing Period</p>
                    <p className="font-medium">
                      {format(new Date(selectedInvoice.billingPeriod.start), "MMM d")} -{" "}
                      {format(new Date(selectedInvoice.billingPeriod.end), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="font-medium">
                      NET {selectedInvoice.fleetAccount.netTerms}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Vehicle Breakdown */}
                <div>
                  <h3 className="font-semibold mb-3">Vehicle Breakdown</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle ID</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>{vehicle.identifier}</TableCell>
                          <TableCell>
                            {vehicle.make} {vehicle.model}
                          </TableCell>
                          <TableCell>{vehicle.jobCount}</TableCell>
                          <TableCell className="text-right">
                            ${vehicle.totalCost.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${selectedInvoice.summary.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.summary.fleetDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Fleet Discount</span>
                      <span>-${selectedInvoice.summary.fleetDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${selectedInvoice.summary.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${selectedInvoice.summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                  data-testid="button-close"
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadInvoice(selectedInvoice.id)}
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Email Invoice Dialog */}
        {emailDialogOpen && selectedInvoice && (
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Invoice Email</DialogTitle>
                <DialogDescription>
                  Send invoice {selectedInvoice.invoiceNumber} to the fleet account's
                  billing contact.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Invoice Details</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Amount: ${selectedInvoice.summary.total.toFixed(2)}</p>
                    <p>Due Date: {format(new Date(selectedInvoice.dueDate), "MMM d, yyyy")}</p>
                    <p>Vehicles: {selectedInvoice.summary.totalVehicles}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <Info className="h-4 w-4 inline mr-1" />
                    The invoice will be sent to the registered billing email for{" "}
                    {selectedInvoice.fleetAccount.companyName} with a PDF attachment.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => sendInvoiceEmail.mutate(selectedInvoice.id)}
                  disabled={sendInvoiceEmail.isPending}
                  data-testid="button-send-email"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}