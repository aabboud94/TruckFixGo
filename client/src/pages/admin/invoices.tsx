import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Mail,
  Printer,
  Search,
  Filter,
  CalendarIcon,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Upload,
  Settings,
  Building2,
  User,
  Hash,
  MoreVertical,
  FileSpreadsheet,
  Send
} from "lucide-react";

interface InvoiceFilters {
  status?: string;
  customerId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export default function AdminInvoices() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<InvoiceFilters>({
    fromDate: startOfMonth(new Date()),
    toDate: endOfMonth(new Date()),
  });
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkExportDialog, setBulkExportDialog] = useState(false);
  const [invoiceSettingsDialog, setInvoiceSettingsDialog] = useState(false);

  // Query invoices
  const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["/api/admin/invoices", filters],
    queryFn: () => apiRequest("/api/admin/invoices", "GET", undefined, {
      status: filters.status,
      customerId: filters.customerId,
      fromDate: filters.fromDate?.toISOString(),
      toDate: filters.toDate?.toISOString(),
    }),
  });

  // Query invoice metrics
  const { data: metricsData } = useQuery({
    queryKey: ["/api/admin/invoices/metrics", filters],
    queryFn: () => apiRequest("/api/admin/invoices/metrics", "GET", undefined, {
      fromDate: filters.fromDate?.toISOString(),
      toDate: filters.toDate?.toISOString(),
    }),
  });

  // Mutation to update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      return apiRequest(`/api/invoices/${invoiceId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Invoice status has been updated successfully.",
      });
      refetchInvoices();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for bulk export
  const bulkExportMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const response = await fetch("/api/admin/invoices/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invoiceIds }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-export-${format(new Date(), "yyyy-MM-dd")}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: `${selectedInvoices.size} invoices have been exported.`,
      });
      setSelectedInvoices(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to regenerate invoice
  const regenerateInvoiceMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest(`/api/jobs/${jobId}/invoice/regenerate`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Invoice regenerated",
        description: "The invoice has been regenerated successfully.",
      });
      refetchInvoices();
    },
    onError: (error: Error) => {
      toast({
        title: "Regeneration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const invoices = invoicesData?.invoices || [];
  const metrics = metricsData || {
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    averagePaymentTime: 0,
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      draft: FileText,
      pending: Clock,
      paid: CheckCircle,
      overdue: AlertCircle,
      cancelled: XCircle,
    };
    return icons[status] || FileText;
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

  const handleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map((inv: any) => inv.id)));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  return (
    <AdminLayout title="Invoice Management">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalAmount?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.paidAmount?.toFixed(2)}</div>
            <p className="text-xs text-green-600">Collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.pendingAmount?.toFixed(2)}</div>
            <p className="text-xs text-yellow-600">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.overdueAmount?.toFixed(2)}</div>
            <p className="text-xs text-red-600">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice Filters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setInvoiceSettingsDialog(true)}
                data-testid="button-invoice-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkExportDialog(true)}
                disabled={selectedInvoices.size === 0}
                data-testid="button-bulk-export"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Bulk Export ({selectedInvoices.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fromDate ? format(filters.fromDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fromDate}
                    onSelect={(date) => setFilters({ ...filters, fromDate: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.toDate ? format(filters.toDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.toDate}
                    onSelect={(date) => setFilters({ ...filters, toDate: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Invoice # or Customer"
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({
                fromDate: startOfMonth(new Date()),
                toDate: endOfMonth(new Date()),
              })}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilters({
                fromDate: startOfMonth(subMonths(new Date(), 1)),
                toDate: endOfMonth(subMonths(new Date(), 1)),
              })}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading invoices...</p>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice: any) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{invoice.customerName || "Guest"}</p>
                            {invoice.fleetAccountName && (
                              <p className="text-sm text-gray-600">
                                <Building2 className="h-3 w-3 inline mr-1" />
                                {invoice.fleetAccountName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold">${invoice.totalAmount}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/invoices/${invoice.id}/download`)}
                              data-testid={`button-download-${invoice.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => regenerateInvoiceMutation.mutate(invoice.jobId)}
                              data-testid={`button-regenerate-${invoice.id}`}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48" align="end">
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => updateStatusMutation.mutate({
                                      invoiceId: invoice.id,
                                      status: "paid"
                                    })}
                                  >
                                    Mark as Paid
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => updateStatusMutation.mutate({
                                      invoiceId: invoice.id,
                                      status: "overdue"
                                    })}
                                  >
                                    Mark as Overdue
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600"
                                    onClick={() => updateStatusMutation.mutate({
                                      invoiceId: invoice.id,
                                      status: "cancelled"
                                    })}
                                  >
                                    Cancel Invoice
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Export Dialog */}
      <Dialog open={bulkExportDialog} onOpenChange={setBulkExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Export Invoices</DialogTitle>
            <DialogDescription>
              Export {selectedInvoices.size} selected invoices for accounting purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Individual Files)</SelectItem>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="zip">ZIP (All PDFs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This will export {selectedInvoices.size} invoice(s) containing:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Invoice details and numbers</li>
                <li>• Customer information</li>
                <li>• Service breakdowns</li>
                <li>• Payment status</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                bulkExportMutation.mutate(Array.from(selectedInvoices));
                setBulkExportDialog(false);
              }}
              disabled={bulkExportMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {bulkExportMutation.isPending ? "Exporting..." : "Export Invoices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Settings Dialog */}
      <Dialog open={invoiceSettingsDialog} onOpenChange={setInvoiceSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Settings</DialogTitle>
            <DialogDescription>
              Configure invoice templates, numbering, and payment terms.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="numbering">Numbering</TabsTrigger>
              <TabsTrigger value="terms">Payment Terms</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div>
                <Label>Company Name</Label>
                <Input defaultValue="TruckFixGo" />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input type="number" defaultValue="8.25" step="0.01" />
              </div>
              <div>
                <Label>Default Due Days</Label>
                <Input type="number" defaultValue="30" />
              </div>
            </TabsContent>

            <TabsContent value="numbering" className="space-y-4 mt-4">
              <div>
                <Label>Invoice Prefix</Label>
                <Input defaultValue="INV" />
              </div>
              <div>
                <Label>Next Invoice Number</Label>
                <Input type="number" defaultValue="1001" />
              </div>
              <div>
                <Label>Number Format</Label>
                <Select defaultValue="prefix-year-number">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefix-year-number">INV-2024-0001</SelectItem>
                    <SelectItem value="prefix-number">INV-0001</SelectItem>
                    <SelectItem value="year-month-number">202401-0001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <div>
                <Label>Payment Terms</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                  defaultValue="Payment is due within 30 days of invoice date. Late payments subject to 1.5% monthly interest."
                />
              </div>
              <div>
                <Label>Warranty Terms</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                  defaultValue="Warranty: 90 days on parts, 30 days on labor."
                />
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              <div>
                <Label>Logo URL</Label>
                <Input placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <Label>Footer Text</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  defaultValue="For questions about this invoice, contact our billing department at invoices@truckfixgo.com or 1-800-TRUCKFIX."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Settings saved",
                description: "Invoice settings have been updated successfully.",
              });
              setInvoiceSettingsDialog(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}