import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Truck, DollarSign, CheckCircle, Info, Calculator,
  Clock, MapPin, Calendar, Users, Building, Zap,
  AlertCircle, Shield, TrendingUp, Package, Phone
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
  const [estimatedMiles, setEstimatedMiles] = useState([50]);
  const [isEmergency, setIsEmergency] = useState(true);
  const [isNightTime, setIsNightTime] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);

  // Fetch service types with pricing from the API
  const { data: servicesWithPricing, isLoading } = useQuery({
    queryKey: ['/api/public/services-with-pricing'],
  });

  // Calculate estimated price
  const calculateEstimate = () => {
    if (!servicesWithPricing?.length) return 0;
    
    // Find an emergency service to use as base
    const emergencyService = servicesWithPricing.find(s => s.isEmergency);
    if (!emergencyService || !emergencyService.pricing) return 0;
    
    let basePrice = parseFloat(emergencyService.pricing.basePrice) || 150;
    let distanceMultiplier = 1;
    
    if (estimatedMiles[0] > 100) distanceMultiplier = 2.0;
    else if (estimatedMiles[0] > 50) distanceMultiplier = 1.5;
    else if (estimatedMiles[0] > 25) distanceMultiplier = 1.2;
    
    let surcharges = 0;
    if (isEmergency && emergencyService.pricing.emergencySurcharge) {
      surcharges += parseFloat(emergencyService.pricing.emergencySurcharge);
    }
    if (isNightTime && emergencyService.pricing.nightSurcharge) {
      surcharges += parseFloat(emergencyService.pricing.nightSurcharge);
    }
    if (isWeekend && emergencyService.pricing.weekendSurcharge) {
      surcharges += parseFloat(emergencyService.pricing.weekendSurcharge);
    }
    
    return Math.round((basePrice * distanceMultiplier) + surcharges);
  };

  // Generate pricing tables from API data
  const emergencyPricing = servicesWithPricing?.filter(s => s.isEmergency).map(service => ({
    service: service.name,
    base: `$${parseFloat(service.pricing?.basePrice || 0).toFixed(0)}`,
    perHour: service.pricing?.perHourRate ? `$${parseFloat(service.pricing.perHourRate).toFixed(0)}/hr` : "Contact for quote",
    response: service.estimatedDuration ? `${service.estimatedDuration} min` : "45-60 min"
  })) || [];

  const scheduledPricing = servicesWithPricing?.filter(s => s.isSchedulable && !s.isEmergency).map(service => ({
    service: service.name,
    base: `$${parseFloat(service.pricing?.basePrice || 0).toFixed(0)}`,
    duration: service.estimatedDuration ? `${Math.floor(service.estimatedDuration / 60)} hours` : "2-3 hours",
    frequency: service.description || "As needed"
  })) || [];

  const fleetPlans = [
    {
      name: "Standard",
      discount: "0%",
      minTrucks: "1-5",
      features: [
        "Pay-per-service pricing",
        "Standard response times",
        "Basic reporting",
        "Email support"
      ],
      color: "secondary"
    },
    {
      name: "Silver",
      discount: "5%",
      minTrucks: "6-20",
      features: [
        "5% discount on all services",
        "Priority dispatch",
        "Monthly reports",
        "Dedicated support line",
        "Net 30 payment terms"
      ],
      color: "default"
    },
    {
      name: "Gold",
      discount: "10%",
      minTrucks: "21-50",
      features: [
        "10% discount on all services",
        "Guaranteed response times",
        "Weekly reports & analytics",
        "Account manager",
        "Net 45 payment terms",
        "Volume discounts on parts"
      ],
      color: "warning"
    },
    {
      name: "Platinum",
      discount: "15%",
      minTrucks: "50+",
      features: [
        "15% discount on all services",
        "Fastest response guarantee",
        "Real-time fleet analytics",
        "Dedicated account team",
        "Net 60 payment terms",
        "Custom pricing available",
        "On-site service options"
      ],
      color: "default"
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
                <a className="text-sm hover:text-primary">Services</a>
              </Link>
              <Link href="/pricing">
                <a className="text-sm font-medium text-primary">Pricing</a>
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
          <Badge className="mb-4" variant="secondary">Transparent Pricing</Badge>
          <h1 className="text-4xl font-bold mb-4">Simple, Fair Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            No hidden fees, no surprises. Get upfront pricing for all our services
            with discounts available for fleet accounts.
          </p>
        </div>

        {/* Price Calculator */}
        <Card className="max-w-3xl mx-auto mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quick Price Estimator
            </CardTitle>
            <CardDescription>
              Get an instant estimate for your service needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Distance to Service Location</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={estimatedMiles}
                  onValueChange={setEstimatedMiles}
                  min={10}
                  max={200}
                  step={10}
                  className="flex-1"
                />
                <span className="w-20 text-right font-medium">{estimatedMiles[0]} miles</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency">Emergency Service</Label>
                  <p className="text-xs text-muted-foreground">25% surcharge applies</p>
                </div>
                <Switch
                  id="emergency"
                  checked={isEmergency}
                  onCheckedChange={setIsEmergency}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="night">Night Service (10 PM - 6 AM)</Label>
                  <p className="text-xs text-muted-foreground">15% surcharge applies</p>
                </div>
                <Switch
                  id="night"
                  checked={isNightTime}
                  onCheckedChange={setIsNightTime}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekend">Weekend Service</Label>
                  <p className="text-xs text-muted-foreground">10% surcharge applies</p>
                </div>
                <Switch
                  id="weekend"
                  checked={isWeekend}
                  onCheckedChange={setIsWeekend}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-lg">Estimated Base Cost:</span>
                <span className="text-3xl font-bold text-primary">
                  ${calculateEstimate()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * This is an estimate. Final price depends on actual service required and parts needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tables */}
        <Tabs defaultValue="emergency" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Plans</TabsTrigger>
          </TabsList>

          {/* Emergency Pricing */}
          <TabsContent value="emergency" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Emergency Service Pricing</h2>
              <p className="text-muted-foreground">
                24/7 roadside assistance when you need it most
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Service</th>
                      <th className="text-left p-4">Base Rate</th>
                      <th className="text-left p-4">Additional</th>
                      <th className="text-left p-4">Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyPricing.map((item) => (
                      <tr key={item.service} className="border-b">
                        <td className="p-4 font-medium">{item.service}</td>
                        <td className="p-4">{item.base}</td>
                        <td className="p-4 text-muted-foreground">
                          {item.perHour || item.perTire || item.perGallon || item.perMile || item.perUnit}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            {item.response}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Surcharges may apply:</p>
                  <ul className="space-y-1">
                    <li>• Emergency service: +25%</li>
                    <li>• Night service (10 PM - 6 AM): +15%</li>
                    <li>• Weekend service: +10%</li>
                    <li>• Distance over 50 miles: Additional fees apply</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Scheduled Pricing */}
          <TabsContent value="scheduled" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Scheduled Service Pricing</h2>
              <p className="text-muted-foreground">
                Preventive maintenance to keep your fleet running smoothly
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Service</th>
                      <th className="text-left p-4">Starting Price</th>
                      <th className="text-left p-4">Duration</th>
                      <th className="text-left p-4">Recommended Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledPricing.map((item) => (
                      <tr key={item.service} className="border-b">
                        <td className="p-4 font-medium">{item.service}</td>
                        <td className="p-4">{item.base}</td>
                        <td className="p-4 text-muted-foreground">{item.duration}</td>
                        <td className="p-4">
                          <Badge variant="secondary">
                            <Calendar className="mr-1 h-3 w-3" />
                            {item.frequency}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Benefits of Scheduled Maintenance:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Lower rates than emergency service</li>
                    <li>• Minimize unexpected breakdowns</li>
                    <li>• Extend vehicle lifespan</li>
                    <li>• Maintain compliance with DOT regulations</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fleet Plans */}
          <TabsContent value="fleet" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Fleet Management Plans</h2>
              <p className="text-muted-foreground">
                Volume discounts and premium features for fleet operators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fleetPlans.map((plan) => (
                <Card key={plan.name} className={plan.name === "Gold" ? "border-primary" : ""}>
                  {plan.name === "Gold" && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <Badge className="w-fit mb-2" variant={plan.color as any}>
                      {plan.name}
                    </Badge>
                    <CardTitle className="text-lg">
                      {plan.discount} Discount
                    </CardTitle>
                    <CardDescription>
                      {plan.minTrucks} trucks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/fleet/register" className="w-full">
                      <Button 
                        className="w-full" 
                        variant={plan.name === "Gold" ? "default" : "outline"}
                        data-testid={`button-choose-${plan.name.toLowerCase()}`}
                      >
                        Choose {plan.name}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-4">
                Need a custom solution for your large fleet?
              </p>
              <Link href="/contact">
                <Button variant="outline" data-testid="button-contact-sales">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Sales
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Methods */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Accepted Payment Methods</CardTitle>
            <CardDescription>
              Flexible payment options for your convenience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Credit/Debit Cards</h3>
                <p className="text-sm text-muted-foreground">
                  Visa, MasterCard, American Express, Discover
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Fleet Checks</h3>
                <p className="text-sm text-muted-foreground">
                  EFS, Comdata, T-Chek, Fleet One
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Fleet Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Net 30/45/60 terms available for qualified fleets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Pricing FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-1">Are there any hidden fees?</p>
              <p className="text-sm text-muted-foreground">
                No. All fees are disclosed upfront before service begins. The only additional charges
                would be for parts if needed for repairs.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">How are emergency surcharges calculated?</p>
              <p className="text-sm text-muted-foreground">
                Emergency service adds 25% to the base rate. Night service (10 PM - 6 AM) adds 15%,
                and weekend service adds 10%. These can stack if multiple conditions apply.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Can I get a quote before service?</p>
              <p className="text-sm text-muted-foreground">
                Yes! We provide upfront quotes for all services. For emergency repairs, we'll give
                you an estimate based on the described issue and confirm the final price before work begins.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Do fleet discounts apply to emergency services?</p>
              <p className="text-sm text-muted-foreground">
                Yes, fleet discounts apply to all services including emergency roadside assistance.
                The discount is applied after any applicable surcharges.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Save on Truck Repairs?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of satisfied customers who trust TruckFixGo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/emergency">
                  <Button size="lg" data-testid="button-get-started">
                    <Zap className="mr-2 h-4 w-4" />
                    Get Service Now
                  </Button>
                </Link>
                <Link href="/fleet/register">
                  <Button size="lg" variant="outline" data-testid="button-fleet-quote">
                    <Users className="mr-2 h-4 w-4" />
                    Get Fleet Quote
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}