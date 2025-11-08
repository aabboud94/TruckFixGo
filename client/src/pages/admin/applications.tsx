import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search, Filter, MoreVertical, FileText, Download, Eye,
  CheckCircle, XCircle, Clock, AlertCircle, Mail, Phone,
  User, Building, MapPin, Calendar, Shield, Award, Car,
  RefreshCcw, MessageSquare, FileCheck, Ban, CheckSquare,
  ChevronDown, Info, Star, Briefcase, DollarSign
} from "lucide-react";
import type { ContractorApplication, ApplicationDocument, BackgroundCheck } from "@shared/schema";

// Application status configurations
const STATUS_CONFIG = {
  draft: { label: "Draft", color: "secondary", icon: FileText },
  pending: { label: "Pending Review", color: "warning", icon: Clock },
  under_review: { label: "Under Review", color: "info", icon: Eye },
  approved: { label: "Approved", color: "success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "destructive", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "secondary", icon: Ban }
};

// Document verification status
const DOC_STATUS_CONFIG = {
  pending: { label: "Pending", color: "secondary" },
  verified: { label: "Verified", color: "success" },
  rejected: { label: "Rejected", color: "destructive" },
  expired: { label: "Expired", color: "warning" }
};

// Review checklist items
const REVIEW_CHECKLIST = [
  { id: "personal_info", label: "Personal Information Verified", category: "basic" },
  { id: "business_info", label: "Business Information Verified", category: "basic" },
  { id: "cdl_valid", label: "CDL Valid and Current", category: "documents" },
  { id: "insurance_valid", label: "Insurance Certificate Valid", category: "documents" },
  { id: "w9_received", label: "W-9 Tax Form Received", category: "documents" },
  { id: "dot_medical", label: "DOT Medical Certificate Valid", category: "documents" },
  { id: "background_check", label: "Background Check Passed", category: "verification" },
  { id: "driving_record", label: "Driving Record Acceptable", category: "verification" },
  { id: "references_verified", label: "References Verified", category: "verification" },
  { id: "interview_completed", label: "Interview Completed (if required)", category: "verification" }
];

export default function AdminApplications() {
  const [selectedApplication, setSelectedApplication] = useState<ContractorApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  // Query for applications
  const { data: applications = [], isLoading, refetch } = useQuery<ContractorApplication[]>({
    queryKey: ['/api/admin/applications', filterStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      return apiRequest('GET', `/api/admin/applications?${params}`);
    }
  });

  // Query for selected application details
  const { data: applicationDetails } = useQuery({
    queryKey: ['/api/admin/applications', selectedApplication?.id],
    queryFn: async () => apiRequest('GET', `/api/admin/applications/${selectedApplication?.id}`),
    enabled: !!selectedApplication?.id
  });

  // Query for application documents
  const { data: documents = [] } = useQuery<ApplicationDocument[]>({
    queryKey: ['/api/admin/applications', selectedApplication?.id, 'documents'],
    queryFn: async () => apiRequest('GET', `/api/admin/applications/${selectedApplication?.id}/documents`),
    enabled: !!selectedApplication?.id
  });

  // Query for background checks
  const { data: backgroundChecks = [] } = useQuery<BackgroundCheck[]>({
    queryKey: ['/api/admin/applications', selectedApplication?.id, 'background-checks'],
    queryFn: async () => apiRequest('GET', `/api/admin/applications/${selectedApplication?.id}/background-checks`),
    enabled: !!selectedApplication?.id
  });

  // Mutation for updating application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, rejectionReason }: any) => {
      // Use the dedicated approve endpoint for approvals
      if (status === 'approved') {
        return apiRequest('POST', `/api/admin/applications/${id}/approve`, {
          notes
        });
      }
      return apiRequest('PUT', `/api/admin/applications/${id}/status`, {
        status, notes, rejectionReason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contractors'] });
      toast({
        title: "Application updated",
        description: "The application status has been updated successfully."
      });
      setSelectedApplication(null);
      setIsReviewDialogOpen(false);
    }
  });

  // Mutation for verifying documents
  const verifyDocumentMutation = useMutation({
    mutationFn: async ({ documentId, status, notes }: any) => {
      return apiRequest('POST', `/api/admin/applications/documents/${documentId}/verify`, {
        status, notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      toast({
        title: "Document verified",
        description: "The document verification status has been updated."
      });
    }
  });

  // Mutation for running background checks
  const runBackgroundCheckMutation = useMutation({
    mutationFn: async ({ applicationId, checkType }: any) => {
      return apiRequest('POST', `/api/admin/applications/${applicationId}/background-check`, {
        checkType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      toast({
        title: "Background check initiated",
        description: "The background check has been started and will complete shortly."
      });
    }
  });

  // Mutation for sending communications
  const sendCommunicationMutation = useMutation({
    mutationFn: async ({ applicationId, type, subject, message }: any) => {
      return apiRequest('POST', `/api/admin/applications/${applicationId}/communicate`, {
        type, subject, message
      });
    },
    onSuccess: () => {
      toast({
        title: "Communication sent",
        description: "The message has been sent to the applicant."
      });
    }
  });

  const handleApprove = () => {
    if (!selectedApplication) return;
    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status: 'approved',
      notes: reviewNotes
    });
  };

  const handleReject = () => {
    if (!selectedApplication || !rejectionReason) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason.",
        variant: "destructive"
      });
      return;
    }
    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status: 'rejected',
      notes: reviewNotes,
      rejectionReason
    });
  };

  const handleBulkAction = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No applications selected",
        description: "Please select at least one application.",
        variant: "destructive"
      });
      return;
    }

    // Implement bulk action logic
    selectedDocuments.forEach(id => {
      updateStatusMutation.mutate({
        id,
        status: bulkAction === 'approve' ? 'approved' : 'rejected',
        notes: bulkAction === 'approve' ? 'Bulk approved' : 'Bulk rejected',
        rejectionReason: bulkAction === 'reject' ? 'Does not meet requirements' : undefined
      });
    });

    setSelectedDocuments([]);
    setBulkAction(null);
  };

  const getCompletionPercentage = (app: ContractorApplication) => {
    const fields = [
      app.firstName, app.lastName, app.email, app.phone,
      app.address, app.city, app.state, app.zip
    ];
    const completed = fields.filter(f => f).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleExport = async () => {
    try {
      const data = await apiRequest<string>('POST', '/api/admin/applications/export', { 
        format: 'csv',
        filters: { 
          status: filterStatus,
          experience: experienceFilter
        }
      });
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Applications have been exported to CSV",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export applications data",
      });
    }
  };

  const getVerificationStatus = (app: ContractorApplication) => {
    const verifications = [
      app.emailVerified,
      app.phoneVerified,
      app.dotNumberVerified,
      app.mcNumberVerified,
      app.insuranceVerified
    ];
    const verified = verifications.filter(v => v).length;
    return { verified, total: verifications.length };
  };

  return (
    <AdminLayout title="Contractor Applications">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.length > 0 
                ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5 days</div>
            <p className="text-xs text-muted-foreground">Current average</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Review and manage contractor applications
              </CardDescription>
            </div>
            {selectedDocuments.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('approve');
                    handleBulkAction();
                  }}
                  data-testid="button-bulk-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedDocuments.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('reject');
                    handleBulkAction();
                  }}
                  data-testid="button-bulk-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected ({selectedDocuments.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDocuments.length === applications.length && applications.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDocuments(applications.map(a => a.id));
                      } else {
                        setSelectedDocuments([]);
                      }
                    }}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => {
                  const StatusIcon = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG].icon;
                  const verificationStatus = getVerificationStatus(app);
                  const completionPercentage = getCompletionPercentage(app);
                  
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(app.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocuments([...selectedDocuments, app.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== app.id));
                            }
                          }}
                          data-testid={`checkbox-select-${app.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {app.firstName?.charAt(0)}{app.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {app.firstName} {app.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.companyName || "Individual"}</div>
                          {app.dotNumber && (
                            <div className="text-sm text-muted-foreground">
                              DOT: {app.dotNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG].color as any}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.submittedAt ? (
                          <div>
                            <div className="font-medium">
                              {format(new Date(app.submittedAt), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(app.submittedAt), 'h:mm a')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not submitted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {completionPercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            {verificationStatus.verified}/{verificationStatus.total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${app.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSelectedApplication(app)}
                              data-testid={`menu-view-${app.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedApplication(app);
                                setIsReviewDialogOpen(true);
                              }}
                              data-testid={`menu-review-${app.id}`}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              Review Application
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                sendCommunicationMutation.mutate({
                                  applicationId: app.id,
                                  type: 'email',
                                  subject: 'Application Status Update',
                                  message: 'Your application is being reviewed.'
                                });
                              }}
                              data-testid={`menu-email-${app.id}`}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                runBackgroundCheckMutation.mutate({
                                  applicationId: app.id,
                                  checkType: 'criminal'
                                });
                              }}
                              data-testid={`menu-background-${app.id}`}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Run Background Check
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedApplication(app);
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: 'rejected',
                                  rejectionReason: 'Does not meet requirements'
                                });
                              }}
                              data-testid={`menu-reject-${app.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Application Details Sheet */}
      <Sheet open={!!selectedApplication && !isReviewDialogOpen} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedApplication && (
            <>
              <SheetHeader>
                <SheetTitle>Application Details</SheetTitle>
                <SheetDescription>
                  Review complete application information
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Applicant Information */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Applicant Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">
                        {selectedApplication.firstName} {selectedApplication.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium flex items-center gap-1">
                        {selectedApplication.email}
                        {selectedApplication.emailVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium flex items-center gap-1">
                        {selectedApplication.phone}
                        {selectedApplication.phoneVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="font-medium">
                        {selectedApplication.address}<br />
                        {selectedApplication.city}, {selectedApplication.state} {selectedApplication.zip}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Information */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Company Name</Label>
                      <p className="font-medium">
                        {selectedApplication.companyName || "Individual Contractor"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Business Type</Label>
                      <p className="font-medium">
                        {selectedApplication.businessType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">DOT Number</Label>
                      <p className="font-medium flex items-center gap-1">
                        {selectedApplication.dotNumber || "N/A"}
                        {selectedApplication.dotNumberVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">MC Number</Label>
                      <p className="font-medium flex items-center gap-1">
                        {selectedApplication.mcNumber || "N/A"}
                        {selectedApplication.mcNumberVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Years in Business</Label>
                      <p className="font-medium">
                        {selectedApplication.yearsInBusiness || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Insurance Provider</Label>
                      <p className="font-medium">
                        {selectedApplication.insuranceProvider || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Experience & Qualifications */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience & Qualifications
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Experience Level</Label>
                      <p className="font-medium capitalize">
                        {selectedApplication.experienceLevel}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Years Experience</Label>
                      <p className="font-medium">
                        {selectedApplication.totalYearsExperience} years
                      </p>
                    </div>
                    {selectedApplication.certifications && Array.isArray(selectedApplication.certifications) && selectedApplication.certifications.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Certifications</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedApplication.certifications.map((cert: string) => (
                            <Badge key={cert} variant="secondary">
                              <Award className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedApplication.specializations && Array.isArray(selectedApplication.specializations) && selectedApplication.specializations.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Specializations</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedApplication.specializations.map((spec: string) => (
                            <Badge key={spec} variant="outline">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Service Capabilities */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Service Capabilities
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Service Radius</Label>
                      <p className="font-medium">
                        {selectedApplication.serviceRadius} miles
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Own Tools</Label>
                        <p className="font-medium">
                          {selectedApplication.hasOwnTools ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Own Vehicle</Label>
                        <p className="font-medium">
                          {selectedApplication.hasOwnVehicle ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                    {selectedApplication.vehicleInfo && (
                      <div>
                        <Label className="text-muted-foreground">Vehicle Information</Label>
                        <p className="font-medium">
                          {typeof selectedApplication.vehicleInfo === 'object' 
                            ? Object.entries(selectedApplication.vehicleInfo).map(([key, value]) => `${key}: ${value}`).join(', ')
                            : selectedApplication.vehicleInfo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Documents */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({documents.length})
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.documentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.documentType} • Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={DOC_STATUS_CONFIG[doc.verificationStatus as keyof typeof DOC_STATUS_CONFIG].color as any}>
                            {DOC_STATUS_CONFIG[doc.verificationStatus as keyof typeof DOC_STATUS_CONFIG].label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDocumentViewerOpen(true);
                            }}
                            data-testid={`button-view-doc-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Background Checks */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Background Checks
                  </h3>
                  {backgroundChecks.length === 0 ? (
                    <p className="text-muted-foreground">No background checks performed yet</p>
                  ) : (
                    <div className="space-y-2">
                      {backgroundChecks.map((check) => (
                        <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{check.checkType}</p>
                            <p className="text-sm text-muted-foreground">
                              Requested {format(new Date(check.requestedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge 
                            variant={check.passed ? "default" : "destructive"}
                            className={check.passed ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => {
                      runBackgroundCheckMutation.mutate({
                        applicationId: selectedApplication.id,
                        checkType: 'criminal'
                      });
                    }}
                    data-testid="button-run-background-check"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Run New Background Check
                  </Button>
                </div>

                <SheetFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                    data-testid="button-close-details"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => setIsReviewDialogOpen(true)}
                    data-testid="button-review-application"
                  >
                    Review Application
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Complete the review checklist and make a decision on this application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Review Checklist */}
            <div>
              <Label>Review Checklist</Label>
              <ScrollArea className="h-64 border rounded-lg p-4 mt-2">
                <div className="space-y-3">
                  {REVIEW_CHECKLIST.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox
                        checked={checkedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCheckedItems([...checkedItems, item.id]);
                          } else {
                            setCheckedItems(checkedItems.filter(id => id !== item.id));
                          }
                        }}
                        data-testid={`checkbox-review-${item.id}`}
                      />
                      <label className="text-sm cursor-pointer">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Review Notes */}
            <div>
              <Label htmlFor="review-notes">Internal Review Notes</Label>
              <Textarea
                id="review-notes"
                placeholder="Add any notes about this application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-2"
                data-testid="textarea-review-notes"
              />
            </div>

            {/* Rejection Reason (if rejecting) */}
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason (if applicable)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                data-testid="textarea-rejection-reason"
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The applicant will be notified of your decision via email and SMS.
                {checkedItems.length < REVIEW_CHECKLIST.length && (
                  <span className="block mt-1 font-medium">
                    Warning: {REVIEW_CHECKLIST.length - checkedItems.length} checklist items are not completed.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason}
              data-testid="button-reject"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
            <Button
              onClick={handleApprove}
              disabled={checkedItems.length < REVIEW_CHECKLIST.length}
              data-testid="button-approve"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}