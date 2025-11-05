import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Homepage from "@/pages/Homepage";
import EmergencyBooking from "@/pages/emergency-booking";
import TrackingPage from "@/pages/tracking";

// Contractor Pages
import ContractorAuth from "@/pages/contractor/auth";
import ContractorDashboard from "@/pages/contractor/dashboard";
import ContractorJobs from "@/pages/contractor/jobs";
import ContractorEarnings from "@/pages/contractor/earnings";
import ContractorPerformance from "@/pages/contractor/performance";
import ContractorProfile from "@/pages/contractor/profile";
import ContractorActiveJob from "@/pages/contractor/active-job";

// Fleet Pages
import FleetLanding from "@/pages/fleet";
import FleetRegister from "@/pages/fleet/register";
import FleetLogin from "@/pages/fleet/login";
import FleetDashboard from "@/pages/fleet/dashboard";
import FleetSchedulePM from "@/pages/fleet/schedule-pm";
import FleetVehicles from "@/pages/fleet/vehicles";
import FleetAnalytics from "@/pages/fleet/analytics";
import FleetBatchJobs from "@/pages/fleet/batch-jobs";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Main Pages */}
      <Route path="/" component={Homepage} />
      <Route path="/emergency" component={EmergencyBooking} />
      
      {/* Tracking Pages */}
      <Route path="/track/:jobId" component={TrackingPage} />
      
      {/* Contractor Pages */}
      <Route path="/contractor/auth" component={ContractorAuth} />
      <Route path="/contractor/dashboard" component={ContractorDashboard} />
      <Route path="/contractor/jobs" component={ContractorJobs} />
      <Route path="/contractor/jobs/:jobId" component={ContractorJobs} />
      <Route path="/contractor/earnings" component={ContractorEarnings} />
      <Route path="/contractor/performance" component={ContractorPerformance} />
      <Route path="/contractor/profile" component={ContractorProfile} />
      <Route path="/contractor/active-job" component={ContractorActiveJob} />
      
      {/* Fleet Pages */}
      <Route path="/fleet" component={FleetLanding} />
      <Route path="/fleet/register" component={FleetRegister} />
      <Route path="/fleet/login" component={FleetLogin} />
      <Route path="/fleet/dashboard" component={FleetDashboard} />
      <Route path="/fleet/schedule-pm" component={FleetSchedulePM} />
      <Route path="/fleet/vehicles" component={FleetVehicles} />
      <Route path="/fleet/analytics" component={FleetAnalytics} />
      <Route path="/fleet/batch-jobs" component={FleetBatchJobs} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
