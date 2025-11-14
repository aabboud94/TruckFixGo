import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, Filter, UserPlus, Ban, CheckCircle, XCircle, Star,
  DollarSign, Briefcase, Clock, Award, FileCheck, AlertCircle,
  RefreshCw, Download, TrendingUp, TrendingDown, Loader2, 
  Edit, Eye, UserCheck, UserX, Mail, ChevronDown
} from "lucide-react";

export default function AdminContractors() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [editedContractor, setEditedContractor] = useState<any>(null);
  const [showContractorDetails, setShowContractorDetails] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);

  // Bulk action states
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
  });
  const [rejectReason, setRejectReason] = useState('');

  // Build query parameters for contractors
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    if (tierFilter && tierFilter !== 'all') params.append('tier', tierFilter);
    if (searchQuery) params.append('search', searchQuery);
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Query for contractors
  const { data: contractors, isLoading, refetch } = useQuery({
    queryKey: [`/api/admin/contractors${buildQueryParams()}`],
  });

  // Mutation for updating contractor status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ contractorId, status }: { contractorId: string; status: string }) => {
      return apiRequest('PUT', `/api/admin/contractors/${contractorId}/status`, { status });
    },
    onSuccess: () => {
      // Invalidate all contractor queries including filtered ones
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      toast({
        title: "Status updated",
        description: "Contractor status has been updated successfully",
      });
    },
  });

  // Mutation for updating performance tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ contractorId, tier }: { contractorId: string; tier: string }) => {
      return apiRequest('PUT', `/api/admin/contractors/${contractorId}/tier`, { tier });
    },
    onSuccess: () => {
      // Invalidate all contractor queries including filtered ones
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      toast({
        title: "Tier updated",
        description: "Contractor performance tier has been updated",
      });
    },
  });

  // Bulk operations mutations
  const bulkApproveMutation = useMutation({
    mutationFn: async (contractorIds: string[]) => {
      return apiRequest('POST', '/api/admin/contractors/bulk-approve', { contractorIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      setSelectedContractors([]);
      toast({
        title: "Contractors approved",
        description: data.message || `Successfully approved ${data.result?.succeeded?.length || 0} contractors`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error approving contractors",
        description: error.message || "Failed to approve selected contractors",
      });
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async ({ contractorIds, reason }: { contractorIds: string[], reason: string }) => {
      return apiRequest('POST', '/api/admin/contractors/bulk-reject', { contractorIds, reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      setSelectedContractors([]);
      setRejectReason('');
      toast({
        title: "Contractors rejected",
        description: data.message || `Successfully rejected ${data.result?.succeeded?.length || 0} contractors`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error rejecting contractors",
        description: error.message || "Failed to reject selected contractors",
      });
    },
  });

  const bulkSuspendMutation = useMutation({
    mutationFn: async (contractorIds: string[]) => {
      return apiRequest('POST', '/api/admin/contractors/bulk-suspend', { contractorIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      setSelectedContractors([]);
      toast({
        title: "Contractors suspended",
        description: data.message || `Successfully suspended ${data.result?.succeeded?.length || 0} contractors`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error suspending contractors",
        description: error.message || "Failed to suspend selected contractors",
      });
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: async (contractorIds: string[]) => {
      return apiRequest('POST', '/api/admin/contractors/bulk-activate', { contractorIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      setSelectedContractors([]);
      toast({
        title: "Contractors activated",
        description: data.message || `Successfully activated ${data.result?.succeeded?.length || 0} contractors`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error activating contractors",
        description: error.message || "Failed to activate selected contractors",
      });
    },
  });

  const bulkEmailMutation = useMutation({
    mutationFn: async ({ contractorIds, subject, message }: { contractorIds: string[], subject: string, message: string }) => {
      return apiRequest('POST', '/api/admin/contractors/bulk-email', { contractorIds, subject, message });
    },
    onSuccess: (data) => {
      setEmailData({ subject: '', message: '' });
      setShowEmailDialog(false);
      setSelectedContractors([]);
      toast({
        title: "Emails sent",
        description: data.message || `Successfully emailed ${data.result?.succeeded?.length || 0} contractors`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error sending emails",
        description: error.message || "Failed to send emails to selected contractors",
      });
    },
  });

  // Mutation for updating contractor details
  const updateContractorDetailsMutation = useMutation({
    mutationFn: async (data: { contractorId: string; name: string; company: string; email: string; phone: string; status: string }) => {
      const url = `/api/admin/contractors/${data.contractorId}`;
      console.log('[updateContractorDetailsMutation] URL:', url);
      console.log('[updateContractorDetailsMutation] Payload:', {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        status: data.status
      });
      return apiRequest('PUT', url, {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        status: data.status
      });
    },
    onSuccess: (data) => {
      // Invalidate all contractor queries including filtered ones
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.startsWith('/api/admin/contractors');
        }
      });
      
      // Map backend response to frontend format
      const mappedData = {
        ...data,
        name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        company: data.company || data.companyName || ''
      };
      
      setSelectedContractor({ ...selectedContractor, ...mappedData });
      setEditedContractor({ ...editedContractor, ...mappedData });
      toast({
        title: "Details updated",
        description: "Contractor details have been updated successfully",
      });
    },
    onError: (error) => {
      console.error('[updateContractorDetailsMutation] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contractor details';
      toast({
        variant: "destructive",
        title: "Update failed",
        description: errorMessage,
      });
    },
  });

  const contractorsData = contractors || [];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  // Helper functions for bulk actions
  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    if (action === 'email') {
      setShowEmailDialog(true);
    } else if (action === 'reject') {
      setShowRejectDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const confirmBulkAction = () => {
    if (!bulkAction || selectedContractors.length === 0) return;

    switch (bulkAction) {
      case 'approve':
        bulkApproveMutation.mutate(selectedContractors);
        break;
      case 'suspend':
        bulkSuspendMutation.mutate(selectedContractors);
        break;
      case 'activate':
        bulkActivateMutation.mutate(selectedContractors);
        break;
    }

    setShowConfirmDialog(false);
    setBulkAction(null);
  };

  const confirmBulkReject = () => {
    if (!rejectReason || selectedContractors.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please provide a reason for rejection",
      });
      return;
    }

    bulkRejectMutation.mutate({
      contractorIds: selectedContractors,
      reason: rejectReason,
    });

    setShowRejectDialog(false);
    setBulkAction(null);
  };

  const sendBulkEmail = () => {
    if (!emailData.subject || !emailData.message || selectedContractors.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please provide both subject and message for the email",
      });
      return;
    }

    bulkEmailMutation.mutate({
      contractorIds: selectedContractors,
      subject: emailData.subject,
      message: emailData.message,
    });
  };

  const getBulkActionDescription = () => {
    if (!bulkAction) return '';
    const count = selectedContractors.length;
    switch (bulkAction) {
      case 'approve':
        return `You are about to approve ${count} contractor${count > 1 ? 's' : ''}. They will be able to accept jobs and access the contractor dashboard.`;
      case 'suspend':
        return `You are about to suspend ${count} contractor${count > 1 ? 's' : ''}. They will not be able to accept new jobs until reactivated.`;
      case 'activate':
        return `You are about to activate ${count} contractor${count > 1 ? 's' : ''}. They will be able to accept jobs again.`;
      default:
        return '';
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest('POST', '/api/admin/contractors/export', { format: 'csv' });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contractors-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Contractors data has been exported",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export contractors data",
      });
    }
  };

  return (
    <AdminLayout 
      title="Contractor Management"
      breadcrumbs={[{ label: "Contractors" }]}
    >

      {/* Main Contractors Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Contractors</CardTitle>
              <CardDescription>Manage contractor accounts and performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                data-testid="button-refresh-contractors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-contractors"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => navigate('/admin/applications')}
                data-testid="button-view-applications"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                View Applications
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-contractors"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedContractors.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedContractors.length} contractor{selectedContractors.length > 1 ? 's' : ''} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="dropdown-bulk-actions">
                      Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Choose an action</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('approve')}
                      data-testid="action-bulk-approve"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Approve Contractors
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('reject')}
                      data-testid="action-bulk-reject"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Reject Contractors
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('suspend')}
                      data-testid="action-bulk-suspend"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend Contractors
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('activate')}
                      data-testid="action-bulk-activate"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate Contractors
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('email')}
                      data-testid="action-bulk-email"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedContractors([])}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Contractors Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContractors.length === contractorsData.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedContractors(contractorsData.map((c: any) => c.id));
                        } else {
                          setSelectedContractors([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Avg Response</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : contractorsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No contractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  contractorsData.map((contractor: any) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContractors.includes(contractor.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContractors([...selectedContractors, contractor.id]);
                            } else {
                              setSelectedContractors(selectedContractors.filter(id => id !== contractor.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contractor.name}</p>
                          <p className="text-sm text-muted-foreground">{contractor.company}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(contractor.status) as any}>
                          {contractor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(contractor.tier)}>
                          {contractor.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{contractor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{contractor.completedJobs}/{contractor.totalJobs}</p>
                          <Progress 
                            value={(contractor.completedJobs / contractor.totalJobs) * 100} 
                            className="mt-1 h-1.5"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{contractor.avgResponseTime} min</TableCell>
                      <TableCell>${contractor.totalEarnings.toLocaleString()}</TableCell>
                      <TableCell>${contractor.currentBalance.toLocaleString()}</TableCell>
                      <TableCell>{format(contractor.joinedAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 relative z-10">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              // Transform contractor data to match the edit form expectations
                              const contractorWithName = {
                                ...contractor,
                                name: `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.name || '',
                                company: contractor.company || contractor.companyName || '',
                                email: contractor.email || '',
                                phone: contractor.phone || '',
                                status: contractor.status || 'pending'
                              };
                              setSelectedContractor(contractorWithName);
                              setEditedContractor(contractorWithName);
                              setShowContractorDetails(true);
                            }}
                            data-testid={`button-view-${contractor.id}`}
                            className="relative z-10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              // Transform contractor data to match the edit form expectations
                              const contractorWithName = {
                                ...contractor,
                                name: `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.name || '',
                                company: contractor.company || contractor.companyName || '',
                                email: contractor.email || '',
                                phone: contractor.phone || '',
                                status: contractor.status || 'pending'
                              };
                              setSelectedContractor(contractorWithName);
                              setEditedContractor(contractorWithName);
                              setShowContractorDetails(true);
                            }}
                            data-testid={`button-edit-${contractor.id}`}
                            className="relative z-10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Details Dialog */}
      <Dialog 
        open={showContractorDetails} 
        onOpenChange={(open) => {
          setShowContractorDetails(open);
          if (!open) {
            setEditedContractor(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contractor Details - {selectedContractor?.name}</DialogTitle>
            <DialogDescription>
              Complete contractor information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedContractor && editedContractor && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={editedContractor.name} 
                      onChange={(e) => setEditedContractor({ ...editedContractor, name: e.target.value })}
                      disabled={updateContractorDetailsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input 
                      value={editedContractor.company} 
                      onChange={(e) => setEditedContractor({ ...editedContractor, company: e.target.value })}
                      disabled={updateContractorDetailsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={editedContractor.email} 
                      onChange={(e) => setEditedContractor({ ...editedContractor, email: e.target.value })}
                      disabled={updateContractorDetailsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={editedContractor.phone} 
                      onChange={(e) => setEditedContractor({ ...editedContractor, phone: e.target.value })}
                      disabled={updateContractorDetailsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractor-status">Status</Label>
                    <Select
                      value={editedContractor.status || 'pending'}
                      onValueChange={(value) => {
                        setEditedContractor({ ...editedContractor, status: value });
                      }}
                      disabled={updateContractorDetailsMutation.isPending}
                    >
                      <SelectTrigger id="contractor-status" data-testid="select-contractor-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" data-testid="option-status-active">Active</SelectItem>
                        <SelectItem value="pending" data-testid="option-status-pending">Pending</SelectItem>
                        <SelectItem value="suspended" data-testid="option-status-suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Performance Tier</Label>
                    <Select
                      value={selectedContractor.tier}
                      onValueChange={(value) => {
                        updateTierMutation.mutate({
                          contractorId: selectedContractor.id,
                          tier: value,
                        });
                      }}
                      disabled={updateTierMutation.isPending || updateContractorDetailsMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Save Changes Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => {
                      console.log('[Save Changes] Selected Contractor:', selectedContractor);
                      console.log('[Save Changes] Edited Contractor:', editedContractor);
                      console.log('[Save Changes] Contractor ID:', selectedContractor?.id);
                      
                      if (!selectedContractor?.id) {
                        console.error('[Save Changes] No contractor ID found!');
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Unable to save: no contractor selected",
                        });
                        return;
                      }
                      
                      const payload = {
                        contractorId: selectedContractor.id,
                        name: editedContractor.name,
                        company: editedContractor.company,
                        email: editedContractor.email,
                        phone: editedContractor.phone,
                        status: editedContractor.status,
                      };
                      console.log('[Save Changes] Mutation payload:', payload);
                      
                      updateContractorDetailsMutation.mutate(payload);
                    }}
                    disabled={updateContractorDetailsMutation.isPending}
                    data-testid="button-save-contractor-details"
                  >
                    {updateContractorDetailsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="performance">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-2xl font-bold">{selectedContractor.rating}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-2xl font-bold">
                          {((selectedContractor.completedJobs / selectedContractor.totalJobs) * 100).toFixed(1)}%
                        </span>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Avg Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-2xl font-bold">{selectedContractor.avgResponseTime} min</span>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="earnings">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-2xl font-bold">${selectedContractor.totalEarnings.toLocaleString()}</span>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Current Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-2xl font-bold">${selectedContractor.currentBalance.toLocaleString()}</span>
                        <Button className="mt-3 w-full" size="sm">Process Payout</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-4">
                  {selectedContractor.documentsVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>All documents verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>Documents pending verification</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Bulk {bulkAction === 'approve' ? 'Approval' : bulkAction === 'suspend' ? 'Suspension' : 'Activation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getBulkActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              data-testid="button-confirm-bulk-action"
            >
              {bulkApproveMutation.isPending || bulkSuspendMutation.isPending || bulkActivateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${bulkAction === 'approve' ? 'Approval' : bulkAction === 'suspend' ? 'Suspension' : 'Activation'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reject Selected Contractors</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedContractors.length} contractor{selectedContractors.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={5}
                className="resize-none"
                data-testid="input-reject-reason"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This reason will be:</p>
              <ul className="mt-1 ml-4 list-disc">
                <li>Sent to all {selectedContractors.length} selected contractor{selectedContractors.length > 1 ? 's' : ''}</li>
                <li>Logged for audit purposes</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setBulkAction(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkReject}
              disabled={bulkRejectMutation.isPending || !rejectReason}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-bulk-reject"
            >
              {bulkRejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Reject Contractors
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to Selected Contractors</DialogTitle>
            <DialogDescription>
              Compose an email to send to {selectedContractors.length} selected contractor{selectedContractors.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Enter email subject..."
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Enter your message..."
                rows={10}
                className="resize-none"
                data-testid="input-email-message"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This email will be sent to:</p>
              <ul className="mt-1 ml-4 list-disc">
                <li>{selectedContractors.length} selected contractor{selectedContractors.length > 1 ? 's' : ''}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEmailDialog(false);
                setBulkAction(null);
                setEmailData({ subject: '', message: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={sendBulkEmail}
              disabled={bulkEmailMutation.isPending || !emailData.subject || !emailData.message}
              data-testid="button-send-bulk-email"
            >
              {bulkEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}