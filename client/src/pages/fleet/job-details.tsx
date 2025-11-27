import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import JobPhotoGallery from "@/components/job-photo-gallery";
import { format } from "date-fns";
import {
  ArrowLeft,
  Truck,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  User,
  FileText,
  Download,
  MessageSquare,
  Camera,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import type { Job, JobPhoto } from "@shared/schema";

type FleetJob = Job & {
  vehicleLicensePlate?: string | null;
  vehicleLocation?: {
    address?: string | null;
    lat?: number;
    lng?: number;
  } | null;
  totalCost?: string | number | null;
  contractorName?: string | null;
};

interface JobPhotosResponse {
  photos: JobPhoto[];
}

export default function FleetJobDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/fleet/jobs/:id");
  const jobId = params?.id;

  // Fetch job data
  const { data: jobData, isLoading: jobLoading, refetch: refetchJob } = useQuery<FleetJob | null>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/jobs/${jobId}`);
      return response?.job || null;
    }
  });

  // Fetch job photos
  const { data: photosData, isLoading: photosLoading, refetch: refetchPhotos } = useQuery<JobPhotosResponse>({
    queryKey: [`/api/jobs/${jobId}/photos`],
    enabled: !!jobId
  });

  // Fetch job messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/jobs/${jobId}/messages`],
    enabled: !!jobId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/jobs/${jobId}/messages`);
      return response?.messages || [];
    }
  });

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The requested job could not be found.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => setLocation('/fleet/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
      case 'en_route':
      case 'on_site':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'assigned':
        return <Badge variant="default" className="bg-yellow-500">Assigned</Badge>;
      case 'new':
        return <Badge variant="secondary">New</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobTypeLabel = (type: string) => {
    return type === 'emergency' ? 'Emergency Service' : 'Scheduled Service';
  };

  const photos = photosData?.photos || [];
  const messages = messagesData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/fleet/dashboard')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-xl font-semibold">Job Details</span>
              {getStatusBadge(jobData.status)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" data-testid="button-download-invoice">
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Job #{jobData.id.slice(-8)}</CardTitle>
                <CardDescription>{getJobTypeLabel(jobData.jobType)}</CardDescription>
              </div>
              <Badge variant={jobData.jobType === 'emergency' ? 'destructive' : 'default'}>
                {jobData.jobType === 'emergency' ? 'Emergency' : 'Scheduled'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Vehicle:</span> {jobData.vehicleMake} {jobData.vehicleModel} ({jobData.vehicleYear})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">License:</span> {jobData.vehicleLicensePlate || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Location:</span> {jobData.vehicleLocation?.address || 'Location not provided'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span> {format(new Date(jobData.createdAt), 'PPp')}
                  </span>
                </div>
                {jobData.completedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Completed:</span> {format(new Date(jobData.completedAt), 'PPp')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Cost:</span> ${jobData.totalCost || '0.00'}
                  </span>
                </div>
                {jobData.contractorId && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Contractor:</span> {jobData.contractorName || 'Assigned'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {jobData.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Service Description:</p>
                <p className="text-sm">{jobData.description}</p>
              </div>
            )}

            {jobData.completionNotes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Completion Notes:</p>
                <p className="text-sm">{jobData.completionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Photos and Messages */}
        <Tabs defaultValue="photos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos" data-testid="tab-photos">
              <Camera className="h-4 w-4 mr-2" />
              Photos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({messages.length})
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos">
            {photosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <JobPhotoGallery
                jobId={jobId!}
                photos={photos}
                canUpload={false} // Fleet managers can only view, not upload
                onPhotosChange={refetchPhotos}
              />
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div key={message.id} className="flex gap-3 pb-3 border-b last:border-0">
                        <User className="h-8 w-8 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{message.senderName || 'System'}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet for this job.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
