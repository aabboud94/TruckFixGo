import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  Truck,
  List,
  Building2,
  User,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  showFor: ('driver' | 'fleet_manager')[];
}

export function BottomNav() {
  const [location] = useLocation();

  // Check authentication and fetch user session
  const { data: session } = useQuery({
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

  // Don't show for non-authenticated users or contractors/admins
  if (!session || !session.role || 
      (session.role !== 'driver' && session.role !== 'fleet_manager')) {
    return null;
  }

  // Define navigation items based on user role
  const navItems: NavItem[] = [
    {
      label: "Home",
      icon: Home,
      href: session.role === 'fleet_manager' ? '/fleet/dashboard' : '/jobs',
      showFor: ['driver', 'fleet_manager']
    },
    {
      label: "Book",
      icon: Plus,
      href: '/emergency',
      showFor: ['driver', 'fleet_manager']
    },
    {
      label: "Jobs",
      icon: List,
      href: session.role === 'fleet_manager' ? '/fleet/jobs' : '/jobs',
      showFor: ['driver', 'fleet_manager']
    },
    {
      label: "Fleet",
      icon: Building2,
      href: '/fleet/dashboard',
      showFor: ['fleet_manager']
    },
    {
      label: "Profile",
      icon: User,
      href: '/profile',
      showFor: ['driver', 'fleet_manager']
    }
  ];

  // Filter items based on user role
  const visibleItems = navItems.filter(item => 
    item.showFor.includes(session.role as 'driver' | 'fleet_manager')
  );

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t",
        "md:hidden", // Only show on mobile
        "shadow-lg"
      )}
      data-testid="bottom-navigation"
    >
      <div className="flex items-center justify-around h-[60px] px-2 safe-area-bottom">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
                          (item.href === '/fleet/dashboard' && location.startsWith('/fleet')) ||
                          (item.href === '/jobs' && location.startsWith('/jobs'));
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "transition-colors duration-200",
                "hover-elevate active-elevate-2",
                isActive && "text-primary"
              )}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 mb-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span 
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
