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
  Instagram,
  Star,
  TrendingUp,
  DollarSign,
  Timer,
  Navigation,
  Fuel,
  Sparkles,
  PhoneCall,
  ArrowRight,
  Award
} from "lucide-react";

// Import generated images
import heroEmergencyImage from '@assets/generated_images/Hero_emergency_truck_repair_5d0a67fb.png';
import beforeAfterImage from '@assets/generated_images/Before_after_truck_repair_3bf1fc17.png';
import fleetMaintenanceImage from '@assets/generated_images/Fleet_maintenance_service_e4d45b61.png';
import tireServiceImage from '@assets/generated_images/Professional_tire_service_ba62f28d.png';

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="24/7 Emergency Truck Repair - Get Help in 15 Minutes | TruckFixGo"
        description="Stranded on the highway? Get immediate mobile truck repair service. 24/7 emergency assistance, certified mechanics, 15-minute response. Service First Policy - we fix now, paperwork later. Call 1-800-TRUCK-FIX!"
        canonical="https://truckfixgo.com/"
      />
      
      {/* Urgent Alert Bar */}
      <div className="bg-destructive text-destructive-foreground py-2 text-center animate-pulse">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="font-semibold text-sm">EMERGENCY? Get help in 15 minutes or less</span>
          <a href="tel:1-800-TRUCK-FIX" className="underline font-bold">Call Now</a>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary">TruckFixGo</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="/services" className="text-foreground hover:text-primary transition-colors" data-testid="link-services">
                Services
              </a>
              <a href="/pricing" className="text-foreground hover:text-primary transition-colors" data-testid="link-pricing">
                Pricing
              </a>
              <a href="/fleet" className="text-foreground hover:text-primary transition-colors" data-testid="link-fleet">
                Fleet Solutions
              </a>
              <a href="/contractor/apply" className="text-foreground hover:text-primary transition-colors" data-testid="link-become-contractor">
                Become a Contractor
              </a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <a href="tel:1-800-TRUCK-FIX" className="flex items-center text-destructive font-semibold hover:underline">
                <Phone className="w-4 h-4 mr-1 animate-pulse" />
                1-800-TRUCK-FIX
              </a>
              <Button 
                variant="destructive" 
                size="lg"
                className="hover-elevate animate-bounce" 
                onClick={() => setLocation("/emergency")} 
                data-testid="button-emergency-repair-header"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Get Emergency Help
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <a href="/services" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-services">
                Services
              </a>
              <a href="/pricing" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-pricing">
                Pricing
              </a>
              <a href="/fleet" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-fleet">
                Fleet Solutions
              </a>
              <a href="/contractor/apply" className="block px-3 py-2 text-foreground hover:text-primary transition-colors" data-testid="mobile-link-become-contractor">
                Become a Contractor
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <a href="tel:1-800-TRUCK-FIX" className="flex items-center justify-center text-destructive font-semibold hover:underline py-2">
                  <Phone className="w-4 h-4 mr-1 animate-pulse" />
                  1-800-TRUCK-FIX
                </a>
                <Button 
                  variant="destructive" 
                  className="w-full hover-elevate animate-bounce" 
                  onClick={() => setLocation("/emergency")} 
                  data-testid="mobile-button-emergency-repair"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Get Emergency Help
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Real Image */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroEmergencyImage})` }}
        />
        
        {/* Enhanced Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-destructive text-destructive-foreground">
              <Timer className="w-3 h-3 mr-1" />
              Average 15-minute response time
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Stranded?<br/>
              <span className="text-destructive">We're Already on Our Way</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-100 mb-8">
              <strong>Service First Policy:</strong> We fix your truck NOW, handle paperwork later. 
              No credit checks. No upfront payment. Just immediate help when you need it most.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <Button 
                size="lg" 
                variant="destructive"
                className="px-8 py-6 text-lg font-semibold hover-elevate animate-pulse w-full sm:w-auto"
                onClick={() => setLocation("/emergency")}
                data-testid="button-hero-emergency"
              >
                <Phone className="w-5 h-5 mr-2" />
                Get Help Now - 15 Min Response
              </Button>
              
              <Button 
                size="lg" 
                variant="secondary"
                className="px-8 py-6 text-lg font-semibold hover-elevate w-full sm:w-auto"
                onClick={() => setLocation("/scheduled-booking")}
                data-testid="button-hero-scheduled"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Service
              </Button>
              
              <div className="flex flex-col text-white">
                <span className="text-3xl font-bold">1-800-TRUCK-FIX</span>
                <span className="text-sm opacity-90">24/7 Emergency Hotline</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">2,847</div>
                <div className="text-xs text-gray-200">Trucks Rescued This Month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">15 min</div>
                <div className="text-xs text-gray-200">Average Response Time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-xs text-gray-200">Always Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Value Proposition */}
      <section className="py-8 bg-destructive text-destructive-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12" />
              <div>
                <h3 className="text-2xl font-bold">Service First Policy</h3>
                <p>We fix your truck immediately. No paperwork delays. No credit checks.</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => setLocation("/emergency")}
              className="hover-elevate"
              data-testid="button-service-first-cta"
            >
              Get Immediate Help
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Before/After Transformation */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Real Customer Story</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From Breakdown to Back on the Road
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how we transform roadside emergencies into success stories - every single day
            </p>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={beforeAfterImage} 
              alt="Before and after truck repair transformation" 
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
              <div className="grid md:grid-cols-2 gap-8 text-white">
                <div>
                  <Badge className="mb-2 bg-destructive text-destructive-foreground">Before</Badge>
                  <h3 className="text-xl font-bold mb-2">3:47 AM - Breakdown on I-80</h3>
                  <p className="text-sm opacity-90">Engine failure. Loaded trailer. Driver stranded.</p>
                </div>
                <div>
                  <Badge className="mb-2 bg-green-600 text-white">After</Badge>
                  <h3 className="text-xl font-bold mb-2">4:23 AM - Back on Schedule</h3>
                  <p className="text-sm opacity-90">Fixed on-site. Delivery made on time. Zero towing costs.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-2xl font-bold text-primary mb-2">
              "TruckFixGo saved my delivery and my reputation. 36 minutes from call to fixed."
            </p>
            <p className="text-muted-foreground">- Mike Thompson, Owner-Operator</p>
          </div>
        </div>
      </section>

      {/* Services Grid with Real Images */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Complete Mobile Truck Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From emergency repairs to preventive maintenance - we bring the shop to you
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Emergency Service Card */}
            <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid="service-emergency">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={heroEmergencyImage}
                  alt="24/7 Emergency truck repair service" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  24/7 Emergency
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">Emergency Roadside Repair</CardTitle>
                    <CardDescription className="text-base">
                      Immediate response for breakdowns, tire blowouts, fuel delivery, and more
                    </CardDescription>
                  </div>
                  <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">15-minute average response time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Service First Policy - fix now, paperwork later</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">GPS tracking - watch help arrive in real-time</span>
                  </li>
                </ul>
                <Button 
                  variant="destructive" 
                  className="w-full hover-elevate"
                  onClick={() => setLocation("/emergency")}
                  data-testid="button-emergency-service"
                >
                  Get Emergency Help Now
                </Button>
              </CardContent>
            </Card>

            {/* Fleet Service Card */}
            <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid="service-fleet">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={fleetMaintenanceImage}
                  alt="Fleet maintenance and PM services" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4">
                  Fleet Solutions
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">Fleet Maintenance Program</CardTitle>
                    <CardDescription className="text-base">
                      Scheduled PM services, DOT inspections, and fleet management
                    </CardDescription>
                  </div>
                  <Calendar className="w-8 h-8 text-primary flex-shrink-0" />
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Volume discounts for 10+ vehicles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Priority scheduling & response</span>
                  </li>
                </ul>
                <Button 
                  className="w-full hover-elevate"
                  onClick={() => setLocation("/fleet")}
                  data-testid="button-fleet-service"
                >
                  Get Fleet Pricing
                </Button>
              </CardContent>
            </Card>

            {/* Tire Service Card */}
            <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid="service-tire">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={tireServiceImage}
                  alt="Professional mobile tire service" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-orange-600 text-white">
                  Most Popular
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">Mobile Tire Service</CardTitle>
                    <CardDescription className="text-base">
                      Blowout repair, replacement, rotation - we bring the tire shop to you
                    </CardDescription>
                  </div>
                  <Wrench className="w-8 h-8 text-orange-600 flex-shrink-0" />
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">All major tire brands in stock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Emergency and scheduled service</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Nationwide warranty</span>
                  </li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full hover-elevate"
                  onClick={() => setLocation("/services")}
                  data-testid="button-tire-service"
                >
                  View Tire Services
                </Button>
              </CardContent>
            </Card>

            {/* Additional Services Card */}
            <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid="service-additional">
              <CardContent className="p-6">
                <CardTitle className="text-2xl mb-4">Full Service Mobile Shop</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <Fuel className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Fuel Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">DOT Inspections</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Mobile Washing</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <Wrench className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Diagnostics</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <p className="text-muted-foreground mb-4">
                  Complete mobile truck services - from emergency repairs to scheduled maintenance
                </p>
                <Button 
                  variant="outline"
                  className="w-full hover-elevate"
                  onClick={() => setLocation("/services")}
                  data-testid="button-all-services"
                >
                  View All Services
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by 10,000+ Drivers & Fleet Managers
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Don't take our word for it - hear from the drivers we've helped get back on the road
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Testimonial 1 */}
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "Broke down at 2 AM with a full load. TruckFixGo had a mechanic to me in 18 minutes. 
                  Fixed my alternator on the spot. Saved my delivery and probably my job."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Carlos Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Owner-Operator, 15 years</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "Managing 47 trucks, downtime kills us. TruckFixGo's fleet program cut our roadside 
                  delays by 60%. Their PM schedule keeps us DOT compliant. Game changer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Mitchell</div>
                    <div className="text-sm text-muted-foreground">Fleet Manager, ABC Logistics</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "Tire blew on I-70 in a snowstorm. Not only did they arrive fast, but the mechanic 
                  was professional and knew exactly what to do. Back rolling in under an hour."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">James Wilson</div>
                    <div className="text-sm text-muted-foreground">Long-Haul Driver</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">15 min</div>
              <div className="text-sm opacity-90">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-90">Always Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">10,000+</div>
              <div className="text-sm opacity-90">Trucks Serviced</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9/5</div>
              <div className="text-sm opacity-90">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Getting Help is Simple
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three steps to get back on the road - most trucks fixed in under an hour
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                <PhoneCall className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Call or Book Online</h3>
              <p className="text-muted-foreground">
                Call 1-800-TRUCK-FIX or book online. Tell us your location and issue. 
                Service First means we dispatch help immediately.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Navigation className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Track Help Arriving</h3>
              <p className="text-muted-foreground">
                Watch your mechanic arrive in real-time with GPS tracking. 
                Get updates on ETA and direct communication with your tech.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-600/10 rounded-full flex items-center justify-center">
                <CircleCheckBig className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Fixed & Back Rolling</h3>
              <p className="text-muted-foreground">
                Most repairs completed on-site in under an hour. 
                Multiple payment options including fleet accounts and credit terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">DOT Certified</div>
                <div className="text-sm text-muted-foreground">All Mechanics</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">Fully Insured</div>
                <div className="text-sm text-muted-foreground">$5M Coverage</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">BBB A+ Rated</div>
                <div className="text-sm text-muted-foreground">Since 2019</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">Nationwide</div>
                <div className="text-sm text-muted-foreground">All 50 States</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Don't Let a Breakdown Ruin Your Day
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of drivers who trust TruckFixGo for fast, reliable mobile truck repair. 
            Available 24/7, nationwide, with our Service First Policy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-6 text-lg font-semibold hover-elevate"
              onClick={() => setLocation("/emergency")}
              data-testid="button-final-emergency"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Get Emergency Help Now
            </Button>
            <div className="text-center">
              <div className="text-3xl font-bold">1-800-TRUCK-FIX</div>
              <div className="text-sm opacity-90">Call now for immediate assistance</div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-primary-foreground/20">
            <p className="text-sm opacity-75 mb-4">
              Service First Policy: We dispatch help immediately. No credit checks. No upfront payment required.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm opacity-75">
              <span>EFS/Comdata Accepted</span>
              <span>•</span>
              <span>Fleet Accounts</span>
              <span>•</span>
              <span>Net 30 Terms Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">TruckFixGo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                24/7 mobile truck repair and fleet maintenance services nationwide.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/emergency" className="hover:text-primary">Emergency Repair</a></li>
                <li><a href="/services" className="hover:text-primary">Tire Service</a></li>
                <li><a href="/services" className="hover:text-primary">PM Services</a></li>
                <li><a href="/fleet" className="hover:text-primary">Fleet Solutions</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-primary">About Us</a></li>
                <li><a href="/contractor/apply" className="hover:text-primary">Become a Contractor</a></li>
                <li><a href="/pricing" className="hover:text-primary">Pricing</a></li>
                <li><a href="/contact" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Get Help Now</h4>
              <div className="space-y-2">
                <a href="tel:1-800-TRUCK-FIX" className="flex items-center text-destructive font-bold text-lg hover:underline">
                  <Phone className="w-5 h-5 mr-2" />
                  1-800-TRUCK-FIX
                </a>
                <p className="text-sm text-muted-foreground">24/7 Emergency Hotline</p>
                <Button 
                  variant="destructive" 
                  className="w-full mt-4 hover-elevate"
                  onClick={() => setLocation("/emergency")}
                  data-testid="button-footer-emergency"
                >
                  Get Emergency Help
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 TruckFixGo. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
}