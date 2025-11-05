import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { apiRequest } from "@/lib/queryClient";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AdminLayout({ children, title, breadcrumbs = [] }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();

  // Check admin authentication
  const { data: adminSession, isLoading, error } = useQuery({
    queryKey: ['/api/admin/session'],
    retry: 1
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (!adminSession || error)) {
      setLocation('/admin/login');
    }
  }, [adminSession, isLoading, error, setLocation]);

  // Check for notifications
  const { data: notifications } = useQuery<{ unread: number }>({
    queryKey: ['/api/admin/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!adminSession
  });

  const unreadCount = notifications?.unread || 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminSession) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-6 py-3">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {crumb.href ? (
                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                          ) : (
                            <span className="text-foreground">{crumb.label}</span>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search settings..."
                  className="w-64 pl-9"
                  data-testid="input-admin-search"
                />
              </div>

              {/* Notifications */}
              <Button 
                size="icon" 
                variant="ghost"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    variant="destructive"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setLocation('/admin/settings')}
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <Button 
                size="icon" 
                variant="ghost"
                data-testid="button-user-menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Page Title */}
          {title && (
            <div className="border-b bg-muted/50 px-6 py-4">
              <h1 className="text-2xl font-semibold">{title}</h1>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <Toaster />
    </SidebarProvider>
  );
}