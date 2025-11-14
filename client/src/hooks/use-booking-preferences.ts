import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  BookingPreferences,
  InsertBookingPreferences,
  FavoriteContractor,
  ContractorBlacklist,
  BookingTemplate,
  InsertBookingTemplate
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ==================== BOOKING PREFERENCES HOOKS ====================

export function useBookingPreferences(userId?: string) {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: ["/api/booking/preferences", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/booking/preferences/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch preferences");
      const data = await response.json();
      return data.preferences as BookingPreferences;
    },
    enabled: !!userId
  });
  
  const updateMutation = useMutation({
    mutationFn: async (preferences: InsertBookingPreferences) => {
      return apiRequest("PUT", "/api/booking/preferences", preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/preferences"] });
      toast({
        title: "Success",
        description: "Your booking preferences have been updated"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}

// ==================== FAVORITE CONTRACTORS HOOKS ====================

export function useFavoriteContractors() {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: ["/api/booking/favorites"],
    queryFn: async () => {
      const response = await fetch("/api/booking/favorites");
      if (!response.ok) throw new Error("Failed to fetch favorites");
      const data = await response.json();
      return data.favorites as Array<FavoriteContractor & {
        contractor: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        } | null;
        profile: {
          companyName: string;
          averageRating: number | null;
          totalJobsCompleted: number;
          performanceTier: string | null;
        } | null;
      }>;
    }
  });
  
  const addMutation = useMutation({
    mutationFn: async ({ contractorId, notes }: { contractorId: string; notes?: string }) => {
      return apiRequest("POST", "/api/booking/favorites", { contractorId, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/favorites"] });
      toast({
        title: "Success",
        description: "Contractor added to favorites"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contractor to favorites",
        variant: "destructive"
      });
    }
  });
  
  const removeMutation = useMutation({
    mutationFn: async (contractorId: string) => {
      return apiRequest("DELETE", `/api/booking/favorites/${contractorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/favorites"] });
      toast({
        title: "Success",
        description: "Contractor removed from favorites"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove contractor from favorites",
        variant: "destructive"
      });
    }
  });
  
  return {
    favorites: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending
  };
}

// ==================== BLACKLISTED CONTRACTORS HOOKS ====================

export function useBlacklistedContractors() {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: ["/api/booking/blacklist"],
    queryFn: async () => {
      const response = await fetch("/api/booking/blacklist");
      if (!response.ok) throw new Error("Failed to fetch blacklist");
      const data = await response.json();
      return data.blacklist as Array<ContractorBlacklist & {
        contractor: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        } | null;
      }>;
    }
  });
  
  const blacklistMutation = useMutation({
    mutationFn: async ({ contractorId, reason }: { contractorId: string; reason?: string }) => {
      return apiRequest("POST", "/api/booking/blacklist", { contractorId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/booking/favorites"] });
      toast({
        title: "Success",
        description: "Contractor has been blacklisted"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to blacklist contractor",
        variant: "destructive"
      });
    }
  });
  
  const unblacklistMutation = useMutation({
    mutationFn: async (contractorId: string) => {
      return apiRequest("DELETE", `/api/booking/blacklist/${contractorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/blacklist"] });
      toast({
        title: "Success",
        description: "Contractor removed from blacklist"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove contractor from blacklist",
        variant: "destructive"
      });
    }
  });
  
  return {
    blacklist: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    blacklistContractor: blacklistMutation.mutate,
    unblacklistContractor: unblacklistMutation.mutate,
    isBlacklisting: blacklistMutation.isPending,
    isUnblacklisting: unblacklistMutation.isPending
  };
}

// ==================== BOOKING TEMPLATES HOOKS ====================

export function useBookingTemplates() {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: ["/api/booking/templates"],
    queryFn: async () => {
      const response = await fetch("/api/booking/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      return data.templates as BookingTemplate[];
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (template: InsertBookingTemplate) => {
      return apiRequest("POST", "/api/booking/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/templates"] });
      toast({
        title: "Success",
        description: "Template created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertBookingTemplate> }) => {
      return apiRequest("PUT", `/api/booking/templates/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/templates"] });
      toast({
        title: "Success",
        description: "Template updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("DELETE", `/api/booking/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  });
  
  const applyMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("POST", `/api/booking/templates/${templateId}/apply`);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Template applied to your booking"
      });
      return data;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive"
      });
    }
  });
  
  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    applyTemplate: applyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isApplying: applyMutation.isPending
  };
}

// ==================== SINGLE TEMPLATE HOOK ====================

export function useBookingTemplate(templateId?: string) {
  const query = useQuery({
    queryKey: ["/api/booking/templates", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const response = await fetch(`/api/booking/templates/${templateId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      return data.template as BookingTemplate;
    },
    enabled: !!templateId
  });
  
  return {
    template: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}