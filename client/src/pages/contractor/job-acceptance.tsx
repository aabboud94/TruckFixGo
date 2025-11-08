import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Phone,
  CheckCircle,
  AlertCircle,
  Navigation,
  Camera,
  FileText,
  Truck,
  User,
  Activity
} from "lucide-react";
import { format } from "date-fns";

export default function ContractorJobAcceptance() {
  const [params] = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [completionNotes, setCompletionNotes] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");

  // Fetch job details
  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ['/api/jobs', params?.jobId],
    enabled: !!params?.jobId
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/jobs/${params?.jobId}/accept`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Accepted",
        description: "You have been assigned to this job"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', params?.jobId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive"
      });
    }
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest(`/api/jobs/${params?.jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
    },
    onSuccess: (_, status) => {
      const messages: Record<string, string> = {
        en_route: "Marked as En Route - Customer has been notified",
        on_site: "Marked as On Site - Ready to begin service",
        completed: "Job Completed Successfully!"
      };
      
      toast({
        title: "Status Updated",
        description: messages[status] || "Job status has been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', params?.jobId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  });

  // Complete job with pricing mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      const total = parseFloat(laborCost || "0") + 
                   parseFloat(partsCost || "0") + 
                   parseFloat(additionalCost || "0");
                   
      return await apiRequest(`/api/jobs/${params?.jobId}/complete`, {
        method: "POST",
        body: JSON.stringify({ 
          completionNotes,
          laborCost: parseFloat(laborCost || "0") * 100, // Convert to cents
          partsCost: parseFloat(partsCost || "0") * 100,
          additionalCost: parseFloat(additionalCost || "0") * 100,
          totalCost: total * 100,
          status: "completed"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Completed",
        description: "Final pricing has been sent to the customer"
      });
      setLocation("/contractor/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive"
      });
    }
  });

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Job not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "destructive",
      assigned: "secondary",
      en_route: "default",
      on_site: "default",
      completed: "secondary"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const calculateTotal = () => {
    return parseFloat(laborCost || "0") + 
           parseFloat(partsCost || "0") + 
           parseFloat(additionalCost || "0");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Management</h1>
        <p className="text-muted-foreground">Job #{job.jobNumber || job.id.slice(0, 8)}</p>
      </div>

      {/* Job Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Status</CardTitle>
            {getStatusBadge(job.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Actions */}
            {job.status === 'new' && (
              <Button 
                onClick={() => acceptJobMutation.mutate()}
                className="w-full" 
                size="lg"
                disabled={acceptJobMutation.isPending}
                data-testid="button-accept-job"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept Job
              </Button>
            )}
            
            {job.status === 'assigned' && (
              <Button 
                onClick={() => updateStatusMutation.mutate('en_route')}
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                disabled={updateStatusMutation.isPending}
                data-testid="button-en-route"
              >
                <Navigation className="mr-2 h-5 w-5" />
                Mark En Route
              </Button>
            )}
            
            {job.status === 'en_route' && (
              <Button 
                onClick={() => updateStatusMutation.mutate('on_site')}
                className="w-full bg-orange-600 hover:bg-orange-700" 
                size="lg"
                disabled={updateStatusMutation.isPending}
                data-testid="button-on-site"
              >
                <Activity className="mr-2 h-5 w-5" />
                Arrived On Site
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Customer</Label>
            <p className="font-medium">{job.customerName || 'Guest Customer'}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Contact</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{job.customerPhone}</p>
            </div>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Location</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{job.locationAddress || 'GPS Location'}</p>
            </div>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Issue Description</Label>
            <p className="font-medium">{job.description || job.issueType}</p>
          </div>
          
          {job.vehicleMake && (
            <div>
              <Label className="text-muted-foreground">Vehicle</Label>
              <p className="font-medium">
                {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                {job.unitNumber && ` - Unit #${job.unitNumber}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Job Form - Only show when on site */}
      {job.status === 'on_site' && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Job & Set Pricing</CardTitle>
            <CardDescription>
              Enter the final pricing details for this job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Breakdown */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="labor">Labor Cost ($)</Label>
                <Input
                  id="labor"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  data-testid="input-labor-cost"
                />
              </div>
              
              <div>
                <Label htmlFor="parts">Parts Cost ($)</Label>
                <Input
                  id="parts"
                  type="number"
                  step="0.01"
                  placeholder="75.00"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  data-testid="input-parts-cost"
                />
              </div>
              
              <div>
                <Label htmlFor="additional">Additional Costs ($)</Label>
                <Input
                  id="additional"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                  data-testid="input-additional-cost"
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Total</Label>
                <p className="text-2xl font-bold">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Completion Notes */}
            <div>
              <Label htmlFor="notes">Completion Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe the work performed, parts replaced, etc."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-completion-notes"
              />
            </div>
            
            {/* Photo Upload */}
            <div>
              <Label>Completion Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Upload photos of completed work (optional)
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </div>
            
            {/* Complete Job Button */}
            <Button 
              onClick={() => completeJobMutation.mutate()}
              className="w-full bg-green-600 hover:bg-green-700" 
              size="lg"
              disabled={!laborCost && !partsCost && !additionalCost}
              data-testid="button-complete-job"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Job & Send Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/contractor/dashboard")}
          data-testid="button-back-dashboard"
        >
          Back to Dashboard
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setLocation("/contractor/jobs")}
          data-testid="button-view-all-jobs"
        >
          View All Jobs
        </Button>
      </div>
    </div>
  );
}