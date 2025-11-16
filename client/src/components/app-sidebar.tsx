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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  Phone,
  Calendar,
  Briefcase,
  HelpCircle,
  Info,
  Settings,
  LogIn,
  UserPlus,
  Truck,
  Car,
  Wrench,
  DollarSign,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    group: "Main",
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "Emergency Service", url: "/emergency", icon: Phone, badge: "24/7" },
      { title: "Schedule Service", url: "/scheduled-booking", icon: Calendar },
      { title: "Track Job", url: "/jobs", icon: Truck },
    ]
  },
  {
    group: "Services",
    items: [
      { title: "Our Services", url: "/services", icon: Wrench },
      { title: "Pricing", url: "/pricing", icon: DollarSign },
      { title: "About Us", url: "/about", icon: Info },
      { title: "Contact", url: "/contact", icon: HelpCircle },
    ]
  },
  {
    group: "Fleet Services",
    items: [
      { title: "Fleet Portal", url: "/fleet", icon: Car },
      { title: "Fleet Login", url: "/fleet/login", icon: LogIn },
      { title: "Fleet Register", url: "/fleet/register", icon: UserPlus },
    ]
  },
  {
    group: "Contractor",
    items: [
      { title: "Contractor Portal", url: "/contractor", icon: Briefcase },
      { title: "Apply Now", url: "/contractor/apply", icon: UserPlus },
      { title: "Contractor Login", url: "/contractor/auth", icon: LogIn },
    ]
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">TruckFixGo</h2>
            <p className="text-xs text-muted-foreground">24/7 Truck Repair</p>
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
                      data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === "24/7" ? "default" : "secondary"}
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
          <SidebarMenuButton 
            asChild
            data-testid="sidebar-notifications"
          >
            <a href="/notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </a>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}