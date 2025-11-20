import { useState, useMemo } from "react";
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
  Award,
  Flag,
  Map,
  Gauge,
  Route,
  BadgeCheck
} from "lucide-react";

// Import generated images
import heroEmergencyImage from '@assets/generated_images/Hero_emergency_truck_repair_5d0a67fb.png';
import beforeAfterImage from '@assets/generated_images/Before_after_truck_repair_3bf1fc17.png';
import fleetMaintenanceImage from '@assets/generated_images/Fleet_maintenance_service_e4d45b61.png';
import tireServiceImage from '@assets/generated_images/Professional_tire_service_ba62f28d.png';

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Memoize star positions to prevent jitter on re-renders
  const starPositions = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      rotation: Math.random() * 360
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="America's #1 Mobile Truck Repair Network | 24/7 Emergency Service | TruckFixGo"
        description="Keep America Moving! Serving Peterbilt, Kenworth, Freightliner, Mack & Western Star trucks across all major interstates. Service First Policy - We fix now, paperwork later!"
        canonical="https://truckfixgo.com/"
      />
      
      {/* Patriotic Alert Bar */}
      <div className="bg-gradient-to-r from-red-600 via-white to-blue-600 py-1">
        <div className="bg-destructive text-destructive-foreground py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Flag className="w-5 h-5" />
            <span className="font-bold text-base md:text-sm uppercase tracking-wide">24/7 EMERGENCY TRUCK REPAIR SERVICE</span>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <Truck className="w-8 h-8 text-red-500" />
                <div>
                  <span className="text-2xl font-bold">TRUCKFIXGO</span>
                  <span className="text-xs block -mt-1 text-red-300">AMERICA'S HIGHWAY HEROES</span>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="/services" className="text-sm text-white hover:text-red-300 transition-colors font-semibold uppercase tracking-wide" data-testid="link-services">
                Services
              </a>
              <a href="/pricing" className="text-sm text-white hover:text-red-300 transition-colors font-semibold uppercase tracking-wide" data-testid="link-pricing">
                Pricing
              </a>
              <a href="/fleet" className="text-sm text-white hover:text-red-300 transition-colors font-semibold uppercase tracking-wide" data-testid="link-fleet">
                Fleet Solutions
              </a>
              <a href="/contractor/apply" className="text-sm text-white hover:text-red-300 transition-colors font-semibold uppercase tracking-wide" data-testid="link-become-contractor">
                Join Our Team
              </a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button 
                size="lg"
                className="bg-red-600 text-white font-bold uppercase tracking-wide hover-elevate animate-bounce" 
                onClick={() => setLocation("/emergency")} 
                data-testid="button-emergency-repair-header"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Emergency Repair
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <a href="/services" className="block px-3 py-2 text-base text-white hover:text-red-300 transition-colors font-semibold uppercase" data-testid="mobile-link-services">
                Services
              </a>
              <a href="/pricing" className="block px-3 py-2 text-base text-white hover:text-red-300 transition-colors font-semibold uppercase" data-testid="mobile-link-pricing">
                Pricing
              </a>
              <a href="/fleet" className="block px-3 py-2 text-base text-white hover:text-red-300 transition-colors font-semibold uppercase" data-testid="mobile-link-fleet">
                Fleet Solutions
              </a>
              <a href="/contractor/apply" className="block px-3 py-2 text-base text-white hover:text-red-300 transition-colors font-semibold uppercase" data-testid="mobile-link-become-contractor">
                Join Our Team
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button 
                  className="w-full bg-red-600 text-white font-bold uppercase hover-elevate animate-bounce" 
                  onClick={() => setLocation("/emergency")} 
                  data-testid="mobile-button-emergency-repair"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Emergency Repair
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* BOLD AMERICAN HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-red-800 to-blue-900">
        {/* Interstate Highway Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`,
            backgroundSize: '100px 100%'
          }} />
        </div>
        
        {/* Stars Pattern */}
        <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
          {starPositions.map((star) => (
            <span key={star.id} className="absolute text-white text-2xl" style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              transform: `rotate(${star.rotation}deg)`
            }}>★</span>
          ))}
        </div>
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <Badge className="bg-white text-blue-900 text-lg px-6 py-2 font-bold">
              <Flag className="w-5 h-5 mr-2 text-red-600" />
              SERVING AMERICA'S TRUCKERS SINCE 2010
            </Badge>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight uppercase tracking-tight">
            AMERICA'S #1<br/>
            <span className="text-red-500 text-shadow-lg">MOBILE TRUCK REPAIR</span><br/>
            <span className="text-3xl sm:text-4xl md:text-5xl">NETWORK</span>
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-white mb-8 font-bold leading-relaxed">
            KEEP AMERICA MOVING • 24/7 EMERGENCY SERVICE
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border-2 border-white/20">
            <p className="text-lg sm:text-xl text-white font-semibold mb-4">
              WE SERVICE ALL AMERICAN TRUCK BRANDS:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-white font-bold">
              <span className="bg-red-600 px-4 py-2 rounded">PETERBILT</span>
              <span className="bg-blue-600 px-4 py-2 rounded">KENWORTH</span>
              <span className="bg-red-600 px-4 py-2 rounded">FREIGHTLINER</span>
              <span className="bg-blue-600 px-4 py-2 rounded">MACK</span>
              <span className="bg-red-600 px-4 py-2 rounded">WESTERN STAR</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              className="bg-red-600 text-white px-12 py-8 text-xl font-black hover-elevate animate-pulse w-full sm:w-auto uppercase tracking-wide"
              onClick={() => setLocation("/emergency")}
              data-testid="button-hero-emergency"
            >
              <AlertCircle className="w-6 h-6 mr-2" />
              GET EMERGENCY HELP NOW
            </Button>
            
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-900 px-12 py-8 text-xl font-black hover-elevate w-full sm:w-auto uppercase tracking-wide"
              onClick={() => setLocation("/scheduled-booking")}
              data-testid="button-hero-scheduled"
            >
              <Calendar className="w-6 h-6 mr-2" />
              SCHEDULE SERVICE
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-white/30">
              <div className="text-3xl md:text-4xl font-black text-white">50,000+</div>
              <div className="text-sm md:text-base text-white font-semibold">AMERICAN TRUCKS SERVICED</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-white/30">
              <div className="text-3xl md:text-4xl font-black text-white">48</div>
              <div className="text-sm md:text-base text-white font-semibold">STATES COVERED</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-white/30">
              <div className="text-3xl md:text-4xl font-black text-white">24/7</div>
              <div className="text-sm md:text-base text-white font-semibold">ALWAYS ON DUTY</div>
            </div>
          </div>
        </div>
      </section>

      {/* AMERICAN VALUES SECTION */}
      <section className="py-16 bg-gradient-to-r from-red-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <Shield className="w-16 h-16 text-blue-800" />
              <div>
                <h3 className="text-3xl font-black text-blue-900 uppercase">Service First Policy</h3>
                <p className="text-lg font-semibold text-gray-700">We Fix Your Rig First • Paperwork Can Wait • America Doesn't Stop</p>
              </div>
            </div>
            <Button 
              size="lg"
              className="bg-blue-800 text-white font-bold uppercase hover-elevate"
              onClick={() => setLocation("/emergency")}
              data-testid="button-service-first-cta"
            >
              KEEP AMERICA ROLLING
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* INTERSTATE HIGHWAY COVERAGE */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-red-600 text-white text-lg px-6 py-2 mb-4">
              <Map className="w-5 h-5 mr-2" />
              COAST TO COAST COVERAGE
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase">
              Serving America's<br/>
              <span className="text-red-500">Major Interstate Highways</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From sea to shining sea, we've got America's supply chain covered
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {['I-80', 'I-70', 'I-40', 'I-10', 'I-95', 'I-5', 'I-90', 'I-75', 'I-35', 'I-20', 'I-15', 'I-25'].map((highway) => (
              <div key={highway} className="bg-green-700 text-white rounded-lg p-4 text-center font-black text-xl border-4 border-white">
                {highway}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-blue-800 text-white border-2 border-white">
              <CardContent className="p-6">
                <MapPin className="w-12 h-12 text-red-400 mb-4" />
                <CardTitle className="text-2xl font-black mb-2 uppercase">Major Truck Stops</CardTitle>
                <p className="opacity-90">
                  Service at Flying J, Pilot, Love's, TA, Petro & more. We come to YOU wherever you're parked.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-700 text-white border-2 border-white">
              <CardContent className="p-6">
                <Gauge className="w-12 h-12 text-white mb-4" />
                <CardTitle className="text-2xl font-black mb-2 uppercase">Weigh Stations</CardTitle>
                <p className="opacity-90">
                  Pre-pass repairs, scale house service, DOT compliance fixes. Keep your CSA scores high.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-800 text-white border-2 border-white">
              <CardContent className="p-6">
                <BadgeCheck className="w-12 h-12 text-red-400 mb-4" />
                <CardTitle className="text-2xl font-black mb-2 uppercase">DOT Certified</CardTitle>
                <p className="opacity-90">
                  100% DOT compliant repairs. Annual inspections. Keep America's roads safe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AMERICAN TRUCK BRANDS SHOWCASE */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-blue-900 uppercase">
              We Service<br/>
              <span className="text-red-600">America's Finest Trucks</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-semibold">
              Expert mechanics certified on all major American truck brands
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Peterbilt Card */}
            <Card className="hover-elevate border-4 border-red-600">
              <CardContent className="p-6">
                <div className="bg-red-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  PETERBILT
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">579, 389, 567 Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">PACCAR MX Engines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Aftertreatment Systems</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Kenworth Card */}
            <Card className="hover-elevate border-4 border-blue-600">
              <CardContent className="p-6">
                <div className="bg-blue-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  KENWORTH
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">T680, W990, T880 Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">PACCAR Powertrains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">TruckTech+ Diagnostics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Freightliner Card */}
            <Card className="hover-elevate border-4 border-red-600">
              <CardContent className="p-6">
                <div className="bg-red-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  FREIGHTLINER
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Cascadia, Coronado Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Detroit Engines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">DT12 Transmissions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Mack Card */}
            <Card className="hover-elevate border-4 border-blue-600">
              <CardContent className="p-6">
                <div className="bg-blue-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  MACK
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Anthem, Pinnacle Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">MP8, MP7 Engines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">mDRIVE Transmissions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Western Star Card */}
            <Card className="hover-elevate border-4 border-red-600">
              <CardContent className="p-6">
                <div className="bg-red-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  WESTERN STAR
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">4900, 5700XE Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Detroit/Cummins Options</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Vocational Specialists</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Volvo Card */}
            <Card className="hover-elevate border-4 border-blue-600">
              <CardContent className="p-6">
                <div className="bg-blue-600 text-white font-black text-2xl p-4 rounded-t-lg text-center mb-4">
                  VOLVO
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">VNL, VNR Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">D13 Turbo Compound</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">I-Shift Transmissions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUCKER TESTIMONIALS - AMERICAN STYLE */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-red-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase">
              American Truckers Trust Us
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Real stories from the backbone of America - our hardworking truckers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="bg-white text-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="mb-4 font-semibold">
                  "Broke down hauling steel on I-80 through Wyoming. TruckFixGo had me rolling in 45 minutes. 
                  Real American service when you need it most. These guys understand trucking."
                </p>
                <div className="font-bold">- Jake "Big Rig" Williams</div>
                <div className="text-sm text-gray-600">Peterbilt 579 Owner-Operator</div>
                <div className="text-sm text-blue-600 font-semibold">Chicago to Denver Route</div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-white text-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="mb-4 font-semibold">
                  "My Kenworth W990 threw a code at a weigh station on I-40. One call and they were there. 
                  Fixed my DEF system and kept me DOT compliant. True professionals."
                </p>
                <div className="font-bold">- Maria Gonzalez</div>
                <div className="text-sm text-gray-600">Fleet Owner - 15 Trucks</div>
                <div className="text-sm text-blue-600 font-semibold">Southwest Regional Carrier</div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-white text-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="mb-4 font-semibold">
                  "30 years driving across America. These folks know their stuff. Fixed my Freightliner 
                  at the Flying J off I-70 in Kansas. Back hauling grain same day."
                </p>
                <div className="font-bold">- Robert "Red" Thompson</div>
                <div className="text-sm text-gray-600">Freightliner Cascadia Driver</div>
                <div className="text-sm text-blue-600 font-semibold">Million Mile Driver</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 bg-white text-blue-900 px-8 py-4 rounded-lg font-bold">
              <Award className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl">SERVING TRUCKERS</div>
                <div className="text-sm">WITH PRIDE SINCE 2010</div>
              </div>
              <Award className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </section>

      {/* AMERICAN CITIES & ROUTES */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-blue-900 uppercase">
              Coast to Coast Coverage
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-semibold">
              From the Atlantic to the Pacific, we keep America's trucks moving
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-bold">
            {[
              'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
              'Philadelphia, PA', 'San Antonio, TX', 'Dallas, TX', 'San Diego, CA',
              'Detroit, MI', 'Nashville, TN', 'Memphis, TN', 'Atlanta, GA',
              'Denver, CO', 'Kansas City, MO', 'St. Louis, MO', 'Miami, FL'
            ].map(city => (
              <div key={city} className="bg-white p-4 rounded-lg shadow-md hover-elevate">
                <MapPin className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <span className="text-gray-800">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION - AMERICAN PRIDE */}
      <section className="py-20 bg-gradient-to-r from-red-600 via-white to-blue-600">
        <div className="bg-blue-900 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white uppercase">
              Keep America Moving
            </h2>
            <p className="text-2xl text-white mb-8 font-semibold">
              When your truck stops, America stops. We won't let that happen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                size="lg"
                className="bg-red-600 text-white px-12 py-8 text-xl font-black hover-elevate uppercase"
                onClick={() => setLocation("/emergency")}
                data-testid="button-cta-emergency"
              >
                <Phone className="w-6 h-6 mr-2" />
                CALL FOR EMERGENCY SERVICE
              </Button>
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-blue-900 px-12 py-8 text-xl font-black hover-elevate uppercase"
                onClick={() => setLocation("/fleet")}
                data-testid="button-cta-fleet"
              >
                <Users className="w-6 h-6 mr-2" />
                FLEET SOLUTIONS
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-white">
              <div className="text-center">
                <div className="text-4xl font-black">50+</div>
                <div className="text-sm uppercase">States Covered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black">24/7</div>
                <div className="text-sm uppercase">Always Ready</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black">100%</div>
                <div className="text-sm uppercase">American Owned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-400 uppercase">Services</h3>
              <ul className="space-y-2">
                <li><a href="/emergency" className="hover:text-red-400" data-testid="footer-link-emergency">Emergency Repair</a></li>
                <li><a href="/scheduled-booking" className="hover:text-red-400" data-testid="footer-link-scheduled">Scheduled Service</a></li>
                <li><a href="/fleet" className="hover:text-red-400" data-testid="footer-link-fleet-solutions">Fleet Solutions</a></li>
                <li><a href="/services" className="hover:text-red-400" data-testid="footer-link-all-services">All Services</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-400 uppercase">Coverage Areas</h3>
              <ul className="space-y-2">
                <li className="hover:text-red-400">All Major Interstates</li>
                <li className="hover:text-red-400">48 Continental States</li>
                <li className="hover:text-red-400">Major Truck Stops</li>
                <li className="hover:text-red-400">Weigh Stations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-400 uppercase">Truck Brands</h3>
              <ul className="space-y-2">
                <li className="hover:text-red-400">Peterbilt</li>
                <li className="hover:text-red-400">Kenworth</li>
                <li className="hover:text-red-400">Freightliner</li>
                <li className="hover:text-red-400">Mack & More</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-400 uppercase">Contact</h3>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5" />
                <span className="font-bold text-xl">24/7 EMERGENCY SERVICE</span>
              </div>
              <p className="mb-4">24/7 Emergency Hotline</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-red-400" data-testid="social-facebook"><Facebook className="w-6 h-6" /></a>
                <a href="#" className="hover:text-red-400" data-testid="social-twitter"><Twitter className="w-6 h-6" /></a>
                <a href="#" className="hover:text-red-400" data-testid="social-linkedin"><Linkedin className="w-6 h-6" /></a>
                <a href="#" className="hover:text-red-400" data-testid="social-instagram"><Instagram className="w-6 h-6" /></a>
              </div>
            </div>
          </div>
          
          <Separator className="bg-gray-700 mb-8" />
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flag className="w-5 h-5 text-red-400" />
              <span className="text-lg font-bold text-red-400">PROUDLY AMERICAN OWNED & OPERATED</span>
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-gray-400">
              © 2024 TruckFixGo - America's Mobile Truck Repair Network. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Serving Peterbilt, Kenworth, Freightliner, Mack, Western Star, Volvo, International & all major truck brands across America
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}