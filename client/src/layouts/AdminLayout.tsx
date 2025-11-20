import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Settings, User, AlertCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { NotificationsPanel } from "@/components/notifications-panel";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AdminLayout({ children, title, breadcrumbs = [] }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const hasRedirected = useRef(false);

  // Check admin authentication with better error handling
  const { data: adminSession, isLoading, error, isError } = useQuery({
    queryKey: ['/api/admin/session'],
    retry: 2, // Retry twice before giving up
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Redirect to login if not authenticated, but prevent loops
  useEffect(() => {
    // Don't redirect if we're already on the login page
    if (location === '/admin/login') {
      hasRedirected.current = false;
      setRedirectAttempts(0);
      return;
    }

    // Only redirect if loading is done and there's definitely no session
    if (!isLoading && !adminSession) {
      // Prevent infinite redirect loops
      if (redirectAttempts >= 3) {
        console.error('Too many redirect attempts. Stopping to prevent loop.');
        return;
      }

      // Only redirect once per mount to prevent loops
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        setRedirectAttempts(prev => prev + 1);
        
        console.log('AdminLayout: No session found, redirecting to login', {
          isLoading,
          hasSession: !!adminSession,
          error: error?.message,
          attempts: redirectAttempts + 1
        });
        
        setLocation('/admin/login');
      }
    }
  }, [adminSession, isLoading, location, setLocation, redirectAttempts, error]);

  // Notification count is now handled by the NotificationsPanel component

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

  // Show error if too many redirect attempts
  if (redirectAttempts >= 3) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Unable to verify your admin session. This could be due to:</p>
            <ul className="list-disc list-inside text-sm">
              <li>Session expired or invalid</li>
              <li>Network connectivity issues</li>
              <li>Browser cookie settings blocking session</li>
            </ul>
            <div className="mt-4">
              <Button 
                onClick={() => {
                  setRedirectAttempts(0);
                  hasRedirected.current = false;
                  setLocation('/admin/login');
                }}
                variant="default"
                className="mr-2"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => {
                  setRedirectAttempts(0);
                  hasRedirected.current = false;
                  window.location.reload();
                }}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
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
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-50 flex flex-col border-b bg-background flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4 flex-1">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                
                {/* Breadcrumbs - with proper wrapping on mobile */}
                {breadcrumbs.length > 0 && (
                  <Breadcrumb className="flex-1 overflow-hidden">
                    <BreadcrumbList className="flex-wrap">
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
              <div className="flex items-center gap-2 md:gap-3">
                {/* Search - Desktop */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search settings..."
                    className="w-64 pl-9"
                    data-testid="input-admin-search"
                  />
                </div>

                {/* Search Toggle - Mobile */}
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-11 w-11 md:h-9 md:w-9 md:hidden"
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  data-testid="button-search-toggle"
                >
                  {showMobileSearch ? <X className="h-5 w-5 md:h-4 md:w-4" /> : <Search className="h-5 w-5 md:h-4 md:w-4" />}
                </Button>

                {/* Notifications */}
                <NotificationsPanel />

                {/* Settings */}
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-11 w-11 md:h-9 md:w-9"
                  onClick={() => setLocation('/admin/settings')}
                  data-testid="button-settings"
                >
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
                </Button>

                {/* User Menu */}
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-11 w-11 md:h-9 md:w-9"
                  data-testid="button-user-menu"
                >
                  <User className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Search Bar - Full Width */}
            {showMobileSearch && (
              <div className="px-4 pb-3 md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search settings..."
                    className="w-full pl-9"
                    data-testid="input-mobile-search"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </header>

          {/* Page Title */}
          {title && (
            <div className="border-b bg-muted/50 px-4 py-3 md:px-6 md:py-4">
              <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <Toaster />
    </SidebarProvider>
  );
}