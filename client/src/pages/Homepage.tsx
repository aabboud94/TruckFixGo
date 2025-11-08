import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEOHead from "@/components/SEOHead";
import {
  Truck,
  Wrench,
  Calendar,
  ClipboardList,
  MapPin,
  UserCheck,
  CheckCircle,
  Menu,
  X,
  Phone,
  Clock,
  Shield,
  CircleCheckBig,
  AlertCircle,
  Users,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from "lucide-react";

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="24/7 Roadside Help for Trucks | Emergency Mobile Truck Repair | TruckFixGo"
        description="Get immediate roadside help for trucks nationwide. 24/7 emergency roadside assistance, mobile truck repair, tire service, fuel delivery. 15-minute response time. Call 1-800-TRUCK-FIX now!"
        canonical="https://truckfixgo.com/"
      />
      {/* Navigation Header - Enhanced with SEO */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary">TruckFixGo</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/services" className="text-foreground hover:text-primary transition-colors" data-testid="link-services">
                Services
              </a>
              <a href="/jobs" className="text-foreground hover:text-primary transition-colors" data-testid="link-jobs">
                Jobs
              </a>
              <a href="/about" className="text-foreground hover:text-primary transition-colors" data-testid="link-about">
                About
              </a>
              <a href="/pricing" className="text-foreground hover:text-primary transition-colors" data-testid="link-pricing">
                Pricing
              </a>
              <a href="/contact" className="text-foreground hover:text-primary transition-colors" data-testid="link-contact">
                Contact
              </a>
            </nav>

            {/* Desktop CTAs with Phone Number */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="tel:1-800-TRUCK-FIX" className="flex items-center text-destructive font-semibold hover:underline">
                <Phone className="w-4 h-4 mr-1" />
                1-800-TRUCK-FIX
              </a>
              <Button variant="destructive" className="hover-elevate" onClick={() => setLocation("/emergency")} data-testid="button-emergency-repair-header">
                <AlertCircle className="w-4 h-4 mr-2" />
                Get Help Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <a href="/services" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-services">
                Services
              </a>
              <a href="/jobs" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-jobs">
                Jobs
              </a>
              <a href="/about" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-about">
                About
              </a>
              <a href="/pricing" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-pricing">
                Pricing
              </a>
              <a href="/contact" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-contact">
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <a href="tel:1-800-TRUCK-FIX" className="flex items-center justify-center text-destructive font-semibold hover:underline py-2">
                  <Phone className="w-4 h-4 mr-1" />
                  1-800-TRUCK-FIX
                </a>
                <Button variant="destructive" className="w-full hover-elevate" onClick={() => setLocation("/emergency")} data-testid="mobile-button-emergency-repair">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Get Help Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient Background Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Hero Content - SEO Optimized */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            24/7 Roadside Help for Trucks<br />Emergency Mobile Repair Service
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-3xl mx-auto">
            Get immediate roadside assistance when you need it most. Professional mobile mechanics for semi trucks, 
            emergency roadside service, tire blowout assistance, and roadside fuel delivery - all with a 15-minute average response time.
          </p>
          
          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              variant="destructive"
              className="px-8 py-6 text-lg font-semibold hover-elevate w-full sm:w-auto"
              onClick={() => setLocation("/emergency")}
              data-testid="button-hero-emergency"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergency Repair Now
            </Button>
            <Button 
              size="lg"
              variant="default"
              className="px-8 py-6 text-lg font-semibold bg-primary hover-elevate w-full sm:w-auto"
              onClick={() => setLocation("/fleet")}
              data-testid="button-hero-fleet"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Fleet Service
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-white">
            <div className="flex items-center gap-2" data-testid="trust-indicator-247">
              <Clock className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium">24/7 Available</span>
            </div>
            <div className="flex items-center gap-2" data-testid="trust-indicator-trucks">
              <Truck className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium">500+ Trucks Serviced</span>
            </div>
            <div className="flex items-center gap-2" data-testid="trust-indicator-response">
              <Shield className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium">15min Avg Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Showcase Section */}
      <section id="services" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From emergency roadside repairs to scheduled fleet maintenance, we've got you covered
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Emergency Repairs Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-emergency">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle className="text-xl mb-2">Emergency Repairs</CardTitle>
                <CardDescription>
                  24/7 roadside assistance for breakdowns. Our mechanics arrive within 30 minutes on average.
                </CardDescription>
              </CardContent>
            </Card>

            {/* PM Services Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-pm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">PM Services</CardTitle>
                <CardDescription>
                  Scheduled preventive maintenance to keep your fleet running smoothly and avoid breakdowns.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Mobile Truck Washing Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-washing">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Mobile Truck Washing</CardTitle>
                <CardDescription>
                  Professional cleaning services at your location. Keep your fleet looking professional.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Diagnostics & Inspections Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-diagnostics">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Diagnostics & Inspections</CardTitle>
                <CardDescription>
                  Comprehensive vehicle diagnostics and DOT inspections to ensure compliance and safety.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Tire Services Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-tires">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <CircleCheckBig className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle className="text-xl mb-2">Tire Services</CardTitle>
                <CardDescription>
                  Emergency tire repairs, replacements, and rotations. Available 24/7 for roadside assistance.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Fleet Maintenance Card */}
            <Card className="hover-elevate transition-transform duration-200" data-testid="service-card-fleet">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Fleet Maintenance</CardTitle>
                <CardDescription>
                  Comprehensive fleet management programs with scheduled maintenance and priority service.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Fleets Nationwide</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our numbers speak for themselves
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Jobs Completed Stat */}
            <Card className="text-center" data-testid="stat-card-jobs">
              <CardContent className="p-8">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">2,500+</div>
                <div className="text-lg font-medium">Jobs Completed</div>
                <div className="text-sm text-muted-foreground mt-1">This year alone</div>
              </CardContent>
            </Card>

            {/* Response Time Stat */}
            <Card className="text-center" data-testid="stat-card-response">
              <CardContent className="p-8">
                <div className="text-4xl md:text-5xl font-bold text-destructive mb-2">15 min</div>
                <div className="text-lg font-medium">Average Response Time</div>
                <div className="text-sm text-muted-foreground mt-1">For emergency calls</div>
              </CardContent>
            </Card>

            {/* Network Size Stat */}
            <Card className="text-center" data-testid="stat-card-network">
              <CardContent className="p-8">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</div>
                <div className="text-lg font-medium">Certified Mechanics</div>
                <div className="text-sm text-muted-foreground mt-1">In our network</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting your truck back on the road is simple
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center" data-testid="step-card-1">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <Badge variant="secondary" className="mb-3">Step 1</Badge>
              <h3 className="text-xl font-semibold mb-2">Request Service</h3>
              <p className="text-muted-foreground">
                Call us or use our app to request service. Share your location and describe the issue.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center" data-testid="step-card-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <Badge variant="secondary" className="mb-3">Step 2</Badge>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-muted-foreground">
                We match you with the nearest available certified mechanic who specializes in your issue.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center" data-testid="step-card-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <Badge variant="secondary" className="mb-3">Step 3</Badge>
              <h3 className="text-xl font-semibold mb-2">Service Delivered</h3>
              <p className="text-muted-foreground">
                Our mechanic arrives, diagnoses the problem, and gets you back on the road quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Back on the Road?
          </h2>
          <p className="text-lg text-gray-100 mb-8">
            Don't let breakdowns slow you down. We're here 24/7 to keep your trucks moving.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              variant="destructive"
              className="px-8 py-6 text-lg font-semibold hover-elevate w-full sm:w-auto"
              onClick={() => setLocation("/emergency")}
              data-testid="button-cta-emergency"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergency Repair Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white/20 w-full sm:w-auto"
              onClick={() => setLocation("/fleet")}
              data-testid="button-cta-fleet"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Fleet Service
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - SEO Optimized with Internal Links */}
      <footer className="bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">TruckFixGo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted 24/7 roadside help provider. Professional mobile truck repair, 
                emergency roadside assistance, and fleet maintenance services nationwide.
              </p>
              <div className="flex space-x-4">
                <a href="https://facebook.com/TruckFixGo" aria-label="TruckFixGo Facebook" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://twitter.com/TruckFixGo" aria-label="TruckFixGo Twitter" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/company/truckfixgo" aria-label="TruckFixGo LinkedIn" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-linkedin">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/truckfixgo" aria-label="TruckFixGo Instagram" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Services - SEO Optimized Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Roadside Help Services</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/emergency" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-emergency">
                    24 Hour Emergency Roadside Assistance
                  </a>
                </li>
                <li>
                  <a href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-mobile-repair">
                    Mobile Truck Repair Near Me
                  </a>
                </li>
                <li>
                  <a href="/services#tire-service" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-tire">
                    Tire Blowout Assistance
                  </a>
                </li>
                <li>
                  <a href="/services#fuel-delivery" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-fuel">
                    Roadside Fuel Delivery
                  </a>
                </li>
                <li>
                  <a href="/fleet" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-fleet">
                    Fleet Maintenance Programs
                  </a>
                </li>
                <li>
                  <a href="/services#diagnostics" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-diagnostics">
                    Mobile Truck Diagnostics
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-about">
                    About TruckFixGo
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-pricing">
                    Service Pricing
                  </a>
                </li>
                <li>
                  <a href="/track/demo" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-tracking">
                    Track Your Service
                  </a>
                </li>
                <li>
                  <a href="/contractor/apply" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-contractors">
                    Become a Contractor
                  </a>
                </li>
                <li>
                  <a href="/fleet/register" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-fleet-signup">
                    Fleet Account Signup
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact - Enhanced for SEO */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Get Roadside Help Now</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:1-800-TRUCK-FIX" className="font-semibold text-destructive hover:underline" data-testid="footer-phone">
                    1-800-TRUCK-FIX
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span data-testid="footer-hours">24/7 Emergency Service</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span data-testid="footer-location">Nationwide Coverage</span>
                </p>
                <div className="mt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full hover-elevate" 
                    onClick={() => setLocation("/emergency")}
                    data-testid="footer-emergency-button"
                  >
                    Get Emergency Help Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2025 TruckFixGo - Professional Roadside Help & Mobile Truck Repair. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-privacy">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-terms">
                Terms of Service
              </a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-contact">
                Contact Us
              </a>
              <a href="/sitemap.xml" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="footer-link-sitemap">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}