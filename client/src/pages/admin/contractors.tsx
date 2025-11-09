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
import {
  Search, Filter, UserPlus, Ban, CheckCircle, XCircle, Star,
  DollarSign, Briefcase, Clock, Award, FileCheck, AlertCircle,
  RefreshCw, Download, TrendingUp, TrendingDown, Loader2, 
  Edit, Eye, UserCheck, UserX
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
      return apiRequest(`/api/admin/contractors/${contractorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contractors'] });
      toast({
        title: "Status updated",
        description: "Contractor status has been updated successfully",
      });
    },
  });

  // Mutation for updating performance tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ contractorId, tier }: { contractorId: string; tier: string }) => {
      return apiRequest(`/api/admin/contractors/${contractorId}/tier`, {
        method: 'PUT',
        body: JSON.stringify({ tier }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contractors'] });
      toast({
        title: "Tier updated",
        description: "Contractor performance tier has been updated",
      });
    },
  });

  // Mutation for bulk actions
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, contractorIds }: { action: string; contractorIds: string[] }) => {
      return apiRequest('/api/admin/contractors/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, contractorIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contractors'] });
      setSelectedContractors([]);
      toast({
        title: "Bulk action completed",
        description: "Selected contractors have been updated",
      });
    },
  });

  // Mutation for updating contractor details
  const updateContractorDetailsMutation = useMutation({
    mutationFn: async (data: { name: string; company: string; email: string; phone: string }) => {
      return apiRequest(`/api/admin/contractors/${editedContractor?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contractors'] });
      setSelectedContractor({ ...selectedContractor, ...data });
      setEditedContractor({ ...editedContractor, ...data });
      toast({
        title: "Details updated",
        description: "Contractor details have been updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update contractor details",
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

  const handleExport = async () => {
    try {
      const response = await apiRequest('/api/admin/contractors/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });
      
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
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedContractors.length} contractor(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkActionMutation.mutate({
                    action: 'approve',
                    contractorIds: selectedContractors,
                  })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkActionMutation.mutate({
                    action: 'suspend',
                    contractorIds: selectedContractors,
                  })}
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedContractors([])}
                >
                  Clear Selection
                </Button>
              </div>
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
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedContractor(contractor);
                              setEditedContractor(contractor);
                              setShowContractorDetails(true);
                            }}
                            data-testid={`button-view-${contractor.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedContractor(contractor);
                            }}
                            data-testid={`button-edit-${contractor.id}`}
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
                    <Label>Status</Label>
                    <Select
                      value={selectedContractor.status}
                      onValueChange={(value) => {
                        updateStatusMutation.mutate({
                          contractorId: selectedContractor.id,
                          status: value,
                        });
                      }}
                      disabled={updateStatusMutation.isPending || updateContractorDetailsMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
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
                      updateContractorDetailsMutation.mutate({
                        name: editedContractor.name,
                        company: editedContractor.company,
                        email: editedContractor.email,
                        phone: editedContractor.phone,
                      });
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

    </AdminLayout>
  );
}