import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Homepage from "@/pages/Homepage";
import Login from "@/pages/login";
import EmergencyBooking from "@/pages/emergency-booking";
import ScheduledBooking from "@/pages/scheduled-booking";
import TrackingPage from "@/pages/tracking";
import PaymentMethodsPage from "@/pages/payment-methods";
import BiddingJobsPage from "@/pages/bidding-jobs";
import JobsDashboard from "@/pages/jobs";

// Public Pages
import Contact from "@/pages/contact";
import About from "@/pages/about";
import Services from "@/pages/services";
import Pricing from "@/pages/pricing";

// Contractor Pages
import ContractorAuth from "@/pages/contractor/auth";
import ContractorApply from "@/pages/contractor-apply";
import ContractorSignup from "@/pages/contractor-signup";
import ContractorDashboard from "@/pages/contractor/dashboard";
import ContractorJobs from "@/pages/contractor/jobs";
import ContractorEarnings from "@/pages/contractor/earnings";
import ContractorPerformance from "@/pages/contractor/performance";
import ContractorProfile from "@/pages/contractor/profile";
import ContractorDocuments from "@/pages/contractor/documents";
import ContractorActiveJob from "@/pages/contractor/active-job";
import ContractorBidding from "@/pages/contractor/bidding";
import ContractorJobAcceptance from "@/pages/contractor/job-acceptance";
import ManageDrivers from "@/pages/contractor/manage-drivers";
import ContractorJobCompletion from "@/pages/contractor/job-completion";
import ContractorInvoicePreview from "@/pages/contractor/invoice-preview";

// Fleet Pages
import FleetLanding from "@/pages/fleet";
import FleetRegister from "@/pages/fleet/register";
import FleetLogin from "@/pages/fleet/login";
import FleetAuth from "@/pages/fleet/auth";
import FleetDashboard from "@/pages/fleet/dashboard";
import FleetSchedulePM from "@/pages/fleet/schedule-pm";
import FleetVehicles from "@/pages/fleet/vehicles";
import FleetAnalytics from "@/pages/fleet/analytics";
import FleetBatchJobs from "@/pages/fleet/batch-jobs";
import FleetInvoices from "@/pages/fleet/invoices";
import FleetBillingPortal from "@/pages/fleet/billing-portal";
import FleetContracts from "@/pages/fleet/contracts";
import FleetApplicationPending from "@/pages/fleet/application-pending";
import FleetJobDetails from "@/pages/fleet/job-details";
import FleetJobHistory from "@/pages/fleet/job-history";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminSetup from "@/pages/admin-setup";
import AdminDashboard from "@/pages/admin";
import AdminSettings from "@/pages/admin/settings";
import AdminBookingSettings from "@/pages/admin/booking-settings";
import AdminJobs from "@/pages/admin/jobs";
import AdminContractors from "@/pages/admin/contractors";
import AdminApplications from "@/pages/admin/applications";
import AdminTemplates from "@/pages/admin/templates";
import AdminPricingRules from "@/pages/admin/pricing-rules";
import AdminBidding from "@/pages/admin/bidding";
import AdminBiddingConfig from "@/pages/admin/bidding-config";
import AdminJobMonitor from "@/pages/admin/job-monitor";
import AdminFleetChecks from "@/pages/admin-fleet-checks";
import AdminBilling from "@/pages/admin/billing";
import AdminContracts from "@/pages/admin/contracts";
import AdminUsers from "@/pages/admin/users";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminFleets from "@/pages/admin/fleets";
import AdminInvoices from "@/pages/admin/invoices";
import AdminReviewModeration from "@/pages/admin/review-moderation";
import AdminAreas from "@/pages/admin/areas";
import AdminContent from "@/pages/admin/content";
import AdminReferrals from "@/pages/admin/referrals";
import AdminSurge from "@/pages/admin/surge";
import AdminSupport from "@/pages/admin/support";
import AdminHealth from "@/pages/admin/health";
import AdminLiveMap from "@/pages/admin/live-map";
import AdminInvoiceDefaults from "@/pages/admin/invoice-defaults";
import AdminStatus from "@/pages/admin/status";

import NotFound from "@/pages/not-found";
import AIChatbot from "@/components/ai-chatbot";
import InstallPrompt from "@/components/install-prompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TestLocationInput from "@/pages/test-location-input";
import SplitPaymentPage from "@/pages/split-payment";
import ResetPassword from "@/pages/reset-password";
import ForgotPassword from "@/pages/forgot-password";

function Router() {
  return (
    <Switch>
      {/* Main Pages */}
      <Route path="/" component={Homepage} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/emergency" component={EmergencyBooking} />
      <Route path="/scheduled-booking" component={ScheduledBooking} />
      <Route path="/jobs" component={JobsDashboard} />
      <Route path="/jobs/:jobId" component={TrackingPage} />
      
      {/* Public Pages */}
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Test Pages */}
      <Route path="/test-location" component={TestLocationInput} />
      
      {/* Tracking Pages */}
      <Route path="/track/:jobId" component={TrackingPage} />
      
      {/* Payment Pages */}
      <Route path="/payment-methods" component={PaymentMethodsPage} />
      <Route path="/payment/split/:token" component={SplitPaymentPage} />
      
      {/* Contractor Pages */}
      <Route path="/contractor" component={ContractorDashboard} />
      <Route path="/contractor/auth" component={ContractorAuth} />
      <Route path="/contractor/apply" component={ContractorApply} />
      <Route path="/contractor-signup" component={ContractorSignup} />
      <Route path="/contractor/dashboard" component={ContractorDashboard} />
      <Route path="/contractor/bidding" component={ContractorBidding} />
      <Route path="/contractor/jobs" component={ContractorJobs} />
      <Route path="/contractor/jobs/:jobId" component={ContractorJobs} />
      <Route path="/contractor/earnings" component={ContractorEarnings} />
      <Route path="/contractor/performance" component={ContractorPerformance} />
      <Route path="/contractor/profile" component={ContractorProfile} />
      <Route path="/contractor/documents" component={ContractorDocuments} />
      <Route path="/contractor/active-job" component={ContractorActiveJob} />
      <Route path="/contractor/job/:jobId" component={ContractorJobAcceptance} />
      <Route path="/contractor/manage-drivers" component={ManageDrivers} />
      <Route path="/contractor/jobs/:id/complete" component={ContractorJobCompletion} />
      <Route path="/contractor/invoices/:id" component={ContractorInvoicePreview} />
      
      {/* Fleet Pages */}
      <Route path="/fleet" component={FleetLanding} />
      <Route path="/fleet/register" component={FleetRegister} />
      <Route path="/fleet/login" component={FleetLogin} />
      <Route path="/fleet/auth" component={FleetAuth} />
      <Route path="/fleet/application-pending" component={FleetApplicationPending} />
      <Route path="/fleet/dashboard" component={FleetDashboard} />
      <Route path="/fleet/schedule-pm" component={FleetSchedulePM} />
      <Route path="/fleet/vehicles" component={FleetVehicles} />
      <Route path="/fleet/analytics" component={FleetAnalytics} />
      <Route path="/fleet/batch-jobs" component={FleetBatchJobs} />
      <Route path="/fleet/invoices" component={FleetInvoices} />
      <Route path="/fleet/billing" component={FleetBillingPortal} />
      <Route path="/fleet/contracts" component={FleetContracts} />
      <Route path="/fleet/jobs/:id" component={FleetJobDetails} />
      <Route path="/fleet/job-history" component={FleetJobHistory} />
      
      {/* Admin Pages - Protected Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/setup" component={AdminSetup} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/booking-settings" component={AdminBookingSettings} />
      <Route path="/admin/jobs" component={AdminJobs} />
      <Route path="/admin/contractors" component={AdminContractors} />
      <Route path="/admin/applications" component={AdminApplications} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/pricing-rules" component={AdminPricingRules} />
      <Route path="/admin/bidding" component={AdminBidding} />
      <Route path="/admin/bidding-config" component={AdminBiddingConfig} />
      <Route path="/admin/job-monitor" component={AdminJobMonitor} />
      <Route path="/admin/fleet-checks" component={AdminFleetChecks} />
      <Route path="/admin/billing" component={AdminBilling} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/fleets" component={AdminFleets} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/invoice-defaults" component={AdminInvoiceDefaults} />
      <Route path="/admin/review-moderation" component={AdminReviewModeration} />
      <Route path="/admin/areas" component={AdminAreas} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/referrals" component={AdminReferrals} />
      <Route path="/admin/surge" component={AdminSurge} />
      <Route path="/admin/support" component={AdminSupport} />
      <Route path="/admin/health" component={AdminHealth} />
      <Route path="/admin/live-map" component={AdminLiveMap} />
      <Route path="/admin/status" component={AdminStatus} />
      
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
        <ErrorBoundary componentName="Main Router">
          <Router />
        </ErrorBoundary>
        <ErrorBoundary componentName="AI Chatbot">
          <AIChatbot />
        </ErrorBoundary>
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;