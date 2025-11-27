import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EmergencyBookingData } from "@/types/emergency";

const EMERGENCY_META_KEY = "emergencyBookingMeta";

export interface GuestBookingPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  location: { lat: number; lng: number };
  locationAddress: string;
  serviceTypeId: string;
  vehicleInfo?: Record<string, unknown>;
  description: string;
  photos?: string[];
}

export interface EmergencySubmissionInput {
  jobPayload: Record<string, any>;
  guestPayload: GuestBookingPayload;
  bookingSnapshot?: Partial<EmergencyBookingData>;
}

export interface EmergencySubmissionResult {
  source: "guest" | "fallback";
  jobId?: string;
  jobNumber?: string;
  trackingLink?: string;
  estimatedArrival?: string;
  status?: string;
}

export interface EmergencyWorkflowCache {
  jobId?: string;
  jobNumber?: string;
  trackingLink?: string;
  estimatedArrival?: string;
  updatedAt: number;
  bookingSnapshot?: Partial<EmergencyBookingData>;
}

const buildTrackingLink = (jobId?: string, trackingUrl?: string): string | undefined => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (trackingUrl) {
    return trackingUrl.startsWith("http")
      ? trackingUrl
      : origin
        ? `${origin}${trackingUrl}`
        : undefined;
  }
  if (jobId && origin) {
    return `${origin}/track/${jobId}`;
  }
  return undefined;
};

export const persistEmergencyMeta = (meta: EmergencyWorkflowCache) => {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(EMERGENCY_META_KEY, JSON.stringify(meta));
  } catch {
    // Storage might be unavailable (private mode, etc). Ignore silently.
  }
};

export const loadEmergencyMeta = (): EmergencyWorkflowCache | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(EMERGENCY_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EmergencyWorkflowCache;
    const twelveHoursMs = 1000 * 60 * 60 * 12;
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > twelveHoursMs) {
      localStorage.removeItem(EMERGENCY_META_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearEmergencyMeta = () => {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(EMERGENCY_META_KEY);
  } catch {
    // ignore
  }
};

export function useEmergencyWorkflow() {
  const mutation = useMutation<EmergencySubmissionResult, Error, EmergencySubmissionInput>({
    mutationFn: async ({ jobPayload, guestPayload }) => {
      // First attempt the full guest booking flow
      try {
        const response = await apiRequest("POST", "/api/emergency/book-guest", guestPayload);
        const job = response?.job ?? response;
        if (job) {
          return {
            source: "guest" as const,
            jobId: job.id,
            jobNumber: job.jobNumber,
            trackingLink: buildTrackingLink(job.id, job.trackingLink || job.trackingUrl),
            estimatedArrival: job.estimatedWaitTime || job.estimatedArrival || "30-45 minutes",
            status: job.status,
          };
        }
      } catch (error: any) {
        // For validation/user errors, throw immediately.
        if (error?.status && error.status < 500) {
          throw error;
        }
        console.warn("[EmergencyWorkflow] Guest booking failed, using fallback endpoint", error);
      }

      // Fallback to legacy emergency endpoint
      const fallback = await apiRequest("POST", "/api/jobs/emergency", jobPayload);
      const job = fallback?.job ?? fallback;
      if (!job) {
        throw new Error("Emergency job could not be created. Please try again.");
      }

      return {
        source: "fallback" as const,
        jobId: job.id,
        jobNumber: job.jobNumber,
        trackingLink: buildTrackingLink(job.id, job.trackingUrl),
        estimatedArrival: job.estimatedArrival || job.estimatedWaitTime || "15-30 minutes",
        status: job.status,
      };
    },
  });

  const submitEmergencyRequest = async (input: EmergencySubmissionInput) => {
    const result = await mutation.mutateAsync(input);

    persistEmergencyMeta({
      jobId: result.jobId,
      jobNumber: result.jobNumber,
      trackingLink: result.trackingLink,
      estimatedArrival: result.estimatedArrival,
      updatedAt: Date.now(),
      bookingSnapshot: {
        ...input.bookingSnapshot,
        jobId: result.jobId,
        jobNumber: result.jobNumber,
        trackingLink: result.trackingLink,
        estimatedArrival: result.estimatedArrival,
      },
    });

    return result;
  };

  return {
    submitEmergencyRequest,
    isSubmitting: mutation.isPending,
    resetEmergencyMutation: mutation.reset,
  };
}
