import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, Wrench, Clock, Shield, Zap, DollarSign,
  CheckCircle, AlertCircle, Calendar, MapPin, Phone,
  Settings, Droplets, Battery, Gauge, Disc, Wind,
  Fuel, Navigation, Package, Users, Building
} from "lucide-react";
import { Link } from "wouter";

export default function Services() {
  const emergencyServices = [
    {
      name: "24 Hour Mobile Truck Repair",
      description: "Emergency roadside help with on-site truck repairs to get you back on the road quickly",
      icon: Wrench,
      features: ["Mobile truck diagnostics", "Electrical system repairs", "Brake adjustments", "Emergency mechanical fixes"],
      responseTime: "45-60 minutes"
    },
    {
      name: "Tire Blowout Assistance", 
      description: "Complete mobile tire service for roadside assistance - repair and replacement for semi trucks",
      icon: Disc,
      features: ["Emergency tire replacement", "Tire patch repairs", "Wheel alignment check", "Tire pressure service"],
      responseTime: "30-45 minutes"
    },
    {
      name: "Battery Jump Start Service",
      description: "Emergency battery service - roadside help for dead batteries, testing, and replacement",
      icon: Battery,
      features: ["24/7 jump start service", "Battery testing", "Battery replacement", "Cable repairs"],
      responseTime: "30-45 minutes"
    },
    {
      name: "Roadside Fuel Delivery",
      description: "Emergency fuel delivery service - roadside help when you run out of diesel",
      icon: Fuel,
      features: ["Diesel fuel delivery", "DEF fluid delivery", "Up to 50 gallons", "24/7 availability"],
      responseTime: "45-60 minutes"
    },
    {
      name: "Heavy-Duty Towing Service",
      description: "Professional towing for semi trucks - roadside assistance for major breakdowns",
      icon: Truck,
      features: ["Heavy-duty towing", "Flatbed service", "Winch recovery", "Long-distance towing"],
      responseTime: "60-90 minutes"
    },
    {
      name: "Mobile Welding Repair",
      description: "On-site welding services - emergency roadside help for structural truck repairs",
      icon: Tool,
      features: ["Frame repairs", "Exhaust repairs", "Custom fabrication", "Emergency patches"],
      responseTime: "60-90 minutes"
    }
  ];

  const scheduledServices = [
    {
      name: "Preventive Maintenance",
      description: "Regular maintenance to prevent breakdowns",
      icon: Settings,
      features: ["Oil changes", "Filter replacements", "Fluid checks", "Belt inspections"],
      pricing: "Starting at $200"
    },
    {
      name: "DOT Inspections",
      description: "Annual and periodic DOT compliance inspections",
      icon: Shield,
      features: ["Annual inspections", "Pre-trip inspections", "Compliance reports", "Defect corrections"],
      pricing: "Starting at $150"
    },
    {
      name: "Truck Wash",
      description: "Professional washing and detailing services",
      icon: Droplets,
      features: ["Exterior wash", "Engine degreasing", "Interior cleaning", "Trailer washout"],
      pricing: "Starting at $75"
    },
    {
      name: "HVAC Service",
      description: "Heating and cooling system maintenance",
      icon: Wind,
      features: ["AC recharge", "Heater repairs", "Cabin filter replacement", "System diagnostics"],
      pricing: "Starting at $125"
    },
    {
      name: "Brake Service",
      description: "Complete brake system maintenance",
      icon: Gauge,
      features: ["Brake adjustments", "Pad replacement", "Drum/disc service", "Air brake repairs"],
      pricing: "Starting at $250"
    },
    {
      name: "Engine Service",
      description: "Comprehensive engine maintenance and repairs",
      icon: Settings,
      features: ["Engine diagnostics", "Tune-ups", "Belt replacement", "Cooling system service"],
      pricing: "Starting at $300"
    }
  ];

  const fleetServices = [
    {
      name: "Fleet Maintenance Programs",
      description: "Customized maintenance schedules for your entire fleet",
      features: ["Scheduled PM services", "Priority dispatch", "Volume discounts", "Dedicated account manager"]
    },
    {
      name: "Mobile Service Units",
      description: "Bring the shop to your yard or terminal",
      features: ["On-site repairs", "Scheduled visits", "Multiple truck servicing", "Reduced downtime"]
    },
    {
      name: "Fleet Analytics",
      description: "Data-driven insights for fleet optimization",
      features: ["Maintenance tracking", "Cost analysis", "Breakdown patterns", "Performance metrics"]
    },
    {
      name: "24/7 Fleet Support",
      description: "Round-the-clock support for fleet emergencies",
      features: ["Dedicated hotline", "Priority response", "Nationwide coverage", "Real-time tracking"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">TruckFixGo</span>
              </a>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/about">
                <a className="text-sm hover:text-primary">About</a>
              </Link>
              <Link href="/services">
                <a className="text-sm font-medium text-primary">Services</a>
              </Link>
              <Link href="/pricing">
                <a className="text-sm hover:text-primary">Pricing</a>
              </Link>
              <Link href="/contact">
                <a className="text-sm hover:text-primary">Contact</a>
              </Link>
              <Link href="/emergency">
                <Button size="sm" data-testid="button-emergency">
                  Emergency Service
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Comprehensive Solutions</Badge>
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From emergency roadside assistance to scheduled maintenance,
            we keep your trucks running smoothly 24/7.
          </p>
        </div>

        {/* Service Categories */}
        <Tabs defaultValue="emergency" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
          </TabsList>

          {/* Emergency Services */}
          <TabsContent value="emergency" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">24/7 Emergency Services</h2>
              <p className="text-muted-foreground">
                Immediate response when you need it most
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emergencyServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-8 w-8 text-primary" />
                        <Badge variant="destructive">Emergency</Badge>
                      </div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Services Include:</p>
                          <ul className="space-y-1">
                            {service.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Response: </span>
                          <span className="font-medium">{service.responseTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href="/emergency">
                <Button size="lg" data-testid="button-request-emergency">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Request Emergency Service
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Scheduled Services */}
          <TabsContent value="scheduled" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Scheduled Maintenance</h2>
              <p className="text-muted-foreground">
                Keep your fleet in top condition with regular maintenance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-8 w-8 text-primary" />
                        <Badge variant="secondary">Scheduled</Badge>
                      </div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Services Include:</p>
                          <ul className="space-y-1">
                            {service.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{service.pricing}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href="/fleet/register">
                <Button size="lg" variant="outline" data-testid="button-schedule-service">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Service
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Fleet Services */}
          <TabsContent value="fleet" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Fleet Management Solutions</h2>
              <p className="text-muted-foreground">
                Comprehensive services designed for fleet operators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fleetServices.map((service) => (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Building className="h-8 w-8 text-primary" />
                      <Badge>Fleet</Badge>
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/fleet/register">
                <Button size="lg" data-testid="button-fleet-inquiry">
                  <Users className="mr-2 h-4 w-4" />
                  Get Fleet Quote
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>

        {/* Service Coverage */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Service Coverage</CardTitle>
            <CardDescription>
              Available across major highways and metropolitan areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Nationwide Network</h3>
                <p className="text-sm text-muted-foreground">
                  500+ contractors across all 50 states
                </p>
              </div>
              <div className="text-center">
                <Navigation className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Highway Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Service along all major interstate highways
                </p>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Rapid Response</h3>
                <p className="text-sm text-muted-foreground">
                  Average response time under 60 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Our Services */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Why Choose TruckFixGo?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Certified Technicians</p>
                    <p className="text-sm text-muted-foreground">
                      All contractors are licensed, insured, and background-checked
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fast Response</p>
                    <p className="text-sm text-muted-foreground">
                      AI-powered dispatch for the quickest contractor assignment
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Transparent Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Upfront quotes with no hidden fees
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Quality Parts</p>
                    <p className="text-sm text-muted-foreground">
                      OEM and high-quality aftermarket parts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">24/7 Support</p>
                    <p className="text-sm text-muted-foreground">
                      Round-the-clock customer service
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Satisfaction Guaranteed</p>
                    <p className="text-sm text-muted-foreground">
                      Quality assurance on all services
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Need Service Now?</h2>
              <p className="text-muted-foreground mb-6">
                Our network of certified contractors is ready to help
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/emergency">
                  <Button size="lg" data-testid="button-emergency-cta">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Emergency Service
                  </Button>
                </Link>
                <Button size="lg" variant="outline" data-testid="button-call-now">
                  <Phone className="mr-2 h-4 w-4" />
                  Call 1-800-FIX-TRUCK
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}