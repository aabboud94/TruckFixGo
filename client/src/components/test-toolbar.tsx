import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  TestTube, 
  User, 
  Users,
  ChevronDown,
  UserPlus,
  BriefcaseBusiness,
  Trash2,
  RefreshCw,
  Mail,
  Power,
  FlaskConical,
  Settings,
  X,
  Maximize2,
  Minimize2,
  UserCog,
  Shield,
  Truck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export default function TestToolbar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Check if test mode is enabled
  useEffect(() => {
    const checkTestMode = async () => {
      try {
        const response = await fetch('/api/test-mode');
        const data = await response.json();
        setIsTestMode(data.testMode === true);
      } catch (error) {
        console.error('Failed to check test mode:', error);
      }
    };
    checkTestMode();
  }, []);

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: isTestMode
  });

  // Quick switch user mutation
  const switchUserMutation = useMutation({
    mutationFn: async (params: { email: string; password: string; role: string }) => 
      apiRequest("POST", "/api/auth/test-login", params),
    onSuccess: (data) => {
      toast({
        title: "User Switched",
        description: `Switched to ${data.user.email}`
      });
      queryClient.invalidateQueries();
      window.location.reload();
    }
  });

  // Generate test data mutations
  const generateContractorsMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/generate-contractors", { count: 5 }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "5 test contractors generated"
      });
    }
  });

  const generateJobsMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/generate-jobs", { count: 10 }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "10 test jobs generated"
      });
    }
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/clear-data"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test data cleared"
      });
    }
  });

  // Toggle contractor online status mutation
  const toggleOnlineStatusMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/contractor/toggle-availability"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability toggled"
      });
      queryClient.invalidateQueries();
    }
  });

  if (!isTestMode) {
    return null;
  }

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.companyName) {
      return user.companyName;
    }
    return user.email;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'system_admin':
        return <UserCog className="w-3 h-3" />;
      case 'contractor':
        return <Shield className="w-3 h-3" />;
      case 'fleet_manager':
        return <Users className="w-3 h-3" />;
      case 'driver':
        return <Truck className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case 'admin':
      case 'system_admin':
        return "destructive";
      case 'contractor':
        return "default";
      case 'fleet_manager':
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          onClick={() => setIsMinimized(false)}
          data-testid="button-expand-test-toolbar"
        >
          <FlaskConical className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-orange-300 bg-background/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-orange-50 dark:bg-orange-950/20">
        <div className="flex items-center gap-2">
          <TestTube className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-sm">Test Mode</span>
          <Badge variant="outline" className="text-xs">ACTIVE</Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Current User */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Current User</div>
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRoleIcon(currentUser.role)}
                  <div>
                    <div className="text-sm font-medium">
                      {getUserDisplayName(currentUser)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(currentUser.role)}>
                  {currentUser.role}
                </Badge>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not logged in</div>
            )}
          </div>

          {/* Quick Switch User */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick Switch</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Switch User</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Test Users</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => switchUserMutation.mutate({
                    email: "testadmin@example.com",
                    password: "Test123456!",
                    role: "admin"
                  })}
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUserMutation.mutate({
                    email: "testcontractor@example.com",
                    password: "Test123456!",
                    role: "contractor"
                  })}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Contractor
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUserMutation.mutate({
                    email: "testfleet@example.com",
                    password: "Test123456!",
                    role: "fleet_manager"
                  })}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Fleet Manager
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUserMutation.mutate({
                    email: "testdriver@example.com",
                    password: "Test123456!",
                    role: "driver"
                  })}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Driver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateContractorsMutation.mutate()}
                disabled={generateContractorsMutation.isPending}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                +5 Contractors
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateJobsMutation.mutate()}
                disabled={generateJobsMutation.isPending}
              >
                <BriefcaseBusiness className="w-3 h-3 mr-1" />
                +10 Jobs
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/admin/test-tools/emails")}
              >
                <Mail className="w-3 h-3 mr-1" />
                View Emails
              </Button>
              {currentUser?.role === 'contractor' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleOnlineStatusMutation.mutate()}
                  disabled={toggleOnlineStatusMutation.isPending}
                >
                  <Power className="w-3 h-3 mr-1" />
                  Toggle Online
                </Button>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Admin Tools</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/admin/test-tools")}
              >
                <Settings className="w-3 h-3 mr-1" />
                Test Tools
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Clear all test data?")) {
                    clearDataMutation.mutate();
                  }
                }}
                disabled={clearDataMutation.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}