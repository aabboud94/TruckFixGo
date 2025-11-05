import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Calendar,
  DollarSign,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Clock,
  Zap,
  Award,
  Phone,
  FileCheck
} from "lucide-react";

export default function FleetLanding() {
  const [, setLocation] = useLocation();

  const pricingTiers = [
    {
      name: "Standard",
      description: "For small fleets",
      features: ["Basic pricing", "48hr response time", "Monthly billing"],
      color: "secondary"
    },
    {
      name: "Silver",
      description: "For growing fleets",
      features: ["5% discount", "24hr response time", "NET 30 terms", "Priority scheduling"],
      color: "default"
    },
    {
      name: "Gold",
      description: "For established fleets",
      features: ["10% discount", "12hr response time", "NET 45 terms", "Dedicated support", "Custom contracts"],
      color: "default",
      popular: true
    },
    {
      name: "Platinum",
      description: "Enterprise fleets",
      features: ["15% discount", "Immediate response", "NET 60 terms", "Account manager", "Auto-authorize", "Custom SLAs"],
      color: "default"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span 
                className="text-2xl font-bold text-primary cursor-pointer"
                onClick={() => setLocation("/")}
                data-testid="logo-fleet"
              >
                TruckFixGo Fleet
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation("/fleet/login")} data-testid="button-fleet-login">
                Login
              </Button>
              <Button onClick={() => setLocation("/fleet/register")} data-testid="button-fleet-register">
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-4 h-4 mr-1" />
              Enterprise Fleet Solutions
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Fleet Services That Scale With Your Business
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Comprehensive PM scheduling, batch services, and custom pricing for fleets of all sizes. 
              Save time, reduce costs, and keep your trucks on the road.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => setLocation("/fleet/register")}
                className="px-8"
                data-testid="button-hero-get-started"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setLocation("/fleet/dashboard")}
                className="px-8"
                data-testid="button-hero-view-demo"
              >
                View Demo Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Fleet Managers Choose TruckFixGo</h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of fleet managers who trust us with their maintenance needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate" data-testid="benefit-card-cost-savings">
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Volume discounts up to 15% off. Centralized billing with NET terms. 
                  No more individual payment processing fees.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="benefit-card-centralized">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Centralized Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Single dashboard for all vehicles. Track maintenance history, schedule PMs, 
                  and manage compliance from one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="benefit-card-priority">
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Priority Service</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Fleet accounts get priority dispatch. Faster response times and dedicated 
                  support when you need it most.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="benefit-card-compliance">
              <CardHeader>
                <FileCheck className="w-10 h-10 text-primary mb-2" />
                <CardTitle>DOT Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated PM reminders and DOT inspection tracking. Stay compliant with 
                  detailed service records and reports.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="benefit-card-analytics">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Fleet Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Detailed cost analysis and downtime metrics. Make data-driven decisions 
                  to optimize your fleet operations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="benefit-card-support">
              <CardHeader>
                <Award className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gold and Platinum tiers get dedicated account managers. Direct line for 
                  urgent needs and custom solutions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Offerings */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fleet-Specific Services</h2>
            <p className="text-lg text-muted-foreground">
              Tailored solutions for your fleet maintenance needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-elevate" data-testid="service-card-pm">
              <CardHeader>
                <Calendar className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">PM Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Scheduled A, B, and C services. Automated reminders and batch scheduling.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="service-card-washing">
              <CardHeader>
                <Truck className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Multi-Truck Washing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  On-site fleet washing with water recovery. Volume discounts available.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="service-card-batch">
              <CardHeader>
                <Shield className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Batch Repairs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Schedule multiple vehicles for the same service. Efficient and cost-effective.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="service-card-dot">
              <CardHeader>
                <FileCheck className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">DOT Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Annual inspections and compliance tracking. Digital records and reporting.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fleet Pricing Tiers</h2>
            <p className="text-lg text-muted-foreground">
              Volume-based pricing that grows with your fleet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`hover-elevate ${tier.popular ? 'border-primary border-2' : ''}`}
                data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
              >
                <CardHeader>
                  {tier.popular && (
                    <Badge className="mb-2 w-fit">Most Popular</Badge>
                  )}
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => setLocation("/fleet/register")}
                    data-testid={`button-select-${tier.name.toLowerCase()}`}
                  >
                    Select {tier.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Streamline Your Fleet Operations?
          </h2>
          <p className="text-lg text-gray-100 mb-8">
            Join hundreds of fleet managers who save time and money with TruckFixGo
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => setLocation("/fleet/register")}
              className="px-8"
              data-testid="button-cta-create-account"
            >
              Create Fleet Account
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white/20"
              data-testid="button-cta-contact"
            >
              <Phone className="w-5 h-5 mr-2" />
              Contact Sales
            </Button>
          </div>
          <p className="text-sm text-gray-200 mt-8">
            No setup fees • Cancel anytime • 30-day money back guarantee
          </p>
        </div>
      </section>
    </div>
  );
}