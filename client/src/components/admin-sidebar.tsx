import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Settings,
  Briefcase,
  Users,
  Building2,
  Mail,
  TrendingUp,
  Gift,
  Zap,
  FileText,
  UserCog,
  HeadphonesIcon,
  LogOut,
  ShieldCheck,
  Truck,
  DollarSign,
  BarChart3,
  MessageSquare,
  MapPin,
  Palette,
  FileSignature
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const menuItems = [
  {
    group: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: Home, badge: null },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3, badge: null },
    ]
  },
  {
    group: "Operations",
    items: [
      { title: "Live Map", url: "/admin/live-map", icon: MapPin, badge: "live" },
      { title: "Jobs", url: "/admin/jobs", icon: Briefcase, badge: null },
      { title: "Applications", url: "/admin/applications", icon: FileText, badge: "new" },
      { title: "Contractors", url: "/admin/contractors", icon: Users, badge: null },
      { title: "Fleet Accounts", url: "/admin/fleets", icon: Building2, badge: null },
      { title: "Contracts", url: "/admin/contracts", icon: FileSignature, badge: null },
      { title: "Users", url: "/admin/users", icon: UserCog, badge: null },
      { title: "Invoices", url: "/admin/invoices", icon: FileText, badge: null },
      { title: "Billing", url: "/admin/billing", icon: DollarSign, badge: null },
    ]
  },
  {
    group: "Configuration",
    items: [
      { title: "Platform Settings", url: "/admin/settings", icon: Settings, badge: null },
      { title: "Pricing Rules", url: "/admin/pricing-rules", icon: DollarSign, badge: "new" },
      { title: "Service Areas", url: "/admin/areas", icon: MapPin, badge: null },
      { title: "Templates", url: "/admin/templates", icon: Mail, badge: null },
      { title: "Content", url: "/admin/content", icon: FileText, badge: null },
    ]
  },
  {
    group: "Marketing",
    items: [
      { title: "Referral Program", url: "/admin/referrals", icon: Gift, badge: null },
      { title: "Surge Pricing", url: "/admin/surge", icon: Zap, badge: null },
    ]
  },
  {
    group: "Support",
    items: [
      { title: "Support Tools", url: "/admin/support", icon: HeadphonesIcon, badge: "3" },
      { title: "Review Moderation", url: "/admin/review-moderation", icon: MessageSquare, badge: null },
      { title: "System Health", url: "/admin/health", icon: ShieldCheck, badge: null },
    ]
  }
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();

  // Query for notifications/badges
  const { data: notifications } = useQuery({
    queryKey: ['/api/admin/notifications'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setLocation('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">TruckFixGo</h2>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`sidebar-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === "live" ? "default" : "secondary"}
                            className="ml-auto h-5"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="px-4 py-3">
          <div className="mb-3">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@truckfixgo.com</p>
          </div>
          <SidebarMenuButton
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            data-testid="button-admin-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}