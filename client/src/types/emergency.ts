export interface EmergencyBookingData {
  // Step 1
  name?: string;
  location?: { lat: number; lng: number; address?: string };
  manualLocation?: string;
  phone: string;
  email?: string;

  // Step 2
  issue: string;
  issueDescription?: string;
  unitNumber?: string;
  carrierName?: string;
  photoUrl?: string;

  // Response metadata
  jobId?: string;
  jobNumber?: string;
  estimatedArrival?: string;
  trackingLink?: string;
  status?: string;
}

export interface EmergencyTrackingResponse {
  job?: {
    id?: string;
    jobNumber?: string;
    status?: string;
    jobType?: string;
    createdAt?: string;
    assignedAt?: string;
    enRouteAt?: string;
    arrivedAt?: string;
    completedAt?: string;
    estimatedArrival?: string;
    address?: string;
  };
  contractor?: {
    name?: string;
    company?: string;
    rating?: number;
    totalJobs?: number;
    phone?: string;
    isOnline?: boolean;
  } | null;
  statusHistory?: Array<{
    fromStatus?: string;
    toStatus?: string;
    createdAt?: string;
    reason?: string;
  }>;
  customer?: {
    name?: string;
  } | null;
}
