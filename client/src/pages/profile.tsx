import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  Settings,
  Bell,
  CreditCard,
  FileText
} from "lucide-react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user session
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        return response?.user || null;
      } catch (error) {
        return null;
      }
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
      setLocation('/login');
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    setLocation('/login');
    return null;
  }

  const roleLabel = session.role === 'fleet_manager' ? 'Fleet Manager' : 'Driver';

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {session.firstName && session.lastName 
                      ? `${session.firstName} ${session.lastName}`
                      : 'My Profile'}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {roleLabel}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{session.email || 'No email provided'}</span>
            </div>
            {session.phone && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{session.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/payment-methods')}
              data-testid="button-payment-methods"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Methods
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/notifications')}
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>

            {session.role === 'fleet_manager' && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/fleet/vehicles')}
                  data-testid="button-fleet-vehicles"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Vehicles
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/fleet/invoices')}
                  data-testid="button-fleet-invoices"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
              </>
            )}

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/jobs')}
              data-testid="button-job-history"
            >
              <FileText className="h-4 w-4 mr-2" />
              Job History
            </Button>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}