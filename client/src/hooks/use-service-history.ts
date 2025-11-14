import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { 
  ServiceHistory, 
  ServiceSchedule, 
  ServiceRecommendation,
  VehicleMaintenanceLog
} from '@shared/schema';

interface ServiceHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  serviceType?: string;
  hasWarranty?: boolean;
  limit?: number;
  offset?: number;
}

interface MaintenanceReport {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  totalServices: number;
  totalCost: number;
  averageCostPerService: number;
  servicesByType: Record<string, {
    count: number;
    totalCost: number;
    lastServiceDate: Date;
  }>;
  upcomingServices: ServiceSchedule[];
  recommendations: ServiceRecommendation[];
  costTrend: { month: string; cost: number }[];
}

interface ServiceHistoryData {
  items: ServiceHistory[];
  total: number;
  hasMore: boolean;
}

// Get vehicle service history
export function useServiceHistory(
  vehicleId: string,
  filters?: ServiceHistoryFilters,
  options?: Omit<UseQueryOptions<ServiceHistoryData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['/api/service-history/vehicle', vehicleId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.serviceType) params.append('serviceType', filters.serviceType);
      if (filters?.hasWarranty !== undefined) params.append('hasWarranty', filters.hasWarranty.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const url = `/api/service-history/vehicle/${vehicleId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch service history');
      }
      return response.json();
    },
    enabled: !!vehicleId,
    ...options
  });
}

// Get upcoming services for vehicle
export function useUpcomingServices(
  vehicleId: string,
  options?: Omit<UseQueryOptions<ServiceSchedule[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['/api/service-history/upcoming', vehicleId],
    queryFn: async () => {
      const response = await fetch(`/api/service-history/upcoming/${vehicleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming services');
      }
      return response.json();
    },
    enabled: !!vehicleId,
    ...options
  });
}

// Get service recommendations for vehicle
export function useServiceRecommendations(
  vehicleId: string,
  filters?: {
    priority?: string;
    isCompleted?: boolean;
    isDismissed?: boolean;
  },
  options?: Omit<UseQueryOptions<ServiceRecommendation[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['/api/service-history/recommendations', vehicleId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.isCompleted !== undefined) params.append('isCompleted', filters.isCompleted.toString());
      if (filters?.isDismissed !== undefined) params.append('isDismissed', filters.isDismissed.toString());
      
      const url = `/api/service-history/recommendations/${vehicleId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch service recommendations');
      }
      return response.json();
    },
    enabled: !!vehicleId,
    ...options
  });
}

// Get maintenance report for vehicle
export function useMaintenanceReport(
  vehicleId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
) {
  return useQuery({
    queryKey: ['/api/service-history/report', vehicleId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.startDate) params.append('startDate', options.startDate.toISOString());
      if (options?.endDate) params.append('endDate', options.endDate.toISOString());
      
      const url = `/api/service-history/report/${vehicleId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance report');
      }
      return response.json() as Promise<MaintenanceReport>;
    },
    enabled: !!vehicleId
  });
}

// Get maintenance logs for vehicle
export function useMaintenanceLogs(
  vehicleId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    logType?: string;
    limit?: number;
    offset?: number;
  }
) {
  return useQuery({
    queryKey: ['/api/service-history/maintenance-logs', vehicleId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.logType) params.append('logType', filters.logType);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const url = `/api/service-history/maintenance-logs/${vehicleId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance logs');
      }
      return response.json() as Promise<VehicleMaintenanceLog[]>;
    },
    enabled: !!vehicleId
  });
}

// Record service history
export function useRecordServiceHistory() {
  return useMutation({
    mutationFn: async (data: Partial<ServiceHistory>) => {
      return apiRequest('POST', '/api/service-history', data);
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/upcoming', variables.vehicleId] });
      if (variables.jobId) {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs', variables.jobId] });
      }
    }
  });
}

// Update service schedule
export function useUpdateServiceSchedule() {
  return useMutation({
    mutationFn: async ({ vehicleId, ...data }: Partial<ServiceSchedule> & { vehicleId: string }) => {
      return apiRequest('PUT', `/api/service-history/schedule/${vehicleId}`, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/upcoming', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/vehicle', variables.vehicleId] });
    }
  });
}

// Generate service recommendations
export function useGenerateRecommendations() {
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      return apiRequest('POST', `/api/service-history/recommendations/generate/${vehicleId}`);
    },
    onSuccess: (data, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/recommendations', vehicleId] });
    }
  });
}

// Mark recommendation as completed
export function useCompleteRecommendation() {
  return useMutation({
    mutationFn: async ({ recommendationId, jobId }: { recommendationId: string; jobId: string }) => {
      return apiRequest('PUT', `/api/service-history/recommendations/${recommendationId}/complete`, { jobId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/recommendations'] });
      if (data.vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/service-history/vehicle', data.vehicleId] });
      }
    }
  });
}

// Dismiss recommendation
export function useDismissRecommendation() {
  return useMutation({
    mutationFn: async ({ recommendationId, reason }: { recommendationId: string; reason?: string }) => {
      return apiRequest('PUT', `/api/service-history/recommendations/${recommendationId}/dismiss`, { reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/recommendations'] });
      if (data.vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/service-history/recommendations', data.vehicleId] });
      }
    }
  });
}

// Send service reminders
export function useSendServiceReminders() {
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      return apiRequest('POST', `/api/service-history/reminders/send/${vehicleId}`);
    }
  });
}

// Create maintenance log
export function useCreateMaintenanceLog() {
  return useMutation({
    mutationFn: async (data: Partial<VehicleMaintenanceLog>) => {
      return apiRequest('POST', '/api/service-history/maintenance-log', data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-history/maintenance-logs', variables.vehicleId] });
    }
  });
}

// Download maintenance report as PDF
export function useDownloadMaintenanceReport(vehicleId: string) {
  return useMutation({
    mutationFn: async (options?: { startDate?: Date; endDate?: Date }) => {
      const params = new URLSearchParams();
      params.append('format', 'pdf');
      if (options?.startDate) params.append('startDate', options.startDate.toISOString());
      if (options?.endDate) params.append('endDate', options.endDate.toISOString());
      
      const response = await fetch(
        `/api/service-history/report/${vehicleId}?${params.toString()}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to download maintenance report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-report-${vehicleId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    }
  });
}