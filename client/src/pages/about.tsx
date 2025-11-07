import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, Shield, Users, Clock, Award, Zap,
  CheckCircle, Target, TrendingUp, Map, Star,
  Building, Heart, Wrench, Phone
} from "lucide-react";
import { Link } from "wouter";

export default function About() {
  const stats = [
    { label: "Active Contractors", value: "500+", icon: Users },
    { label: "Service Calls Completed", value: "50,000+", icon: CheckCircle },
    { label: "Fleet Partners", value: "200+", icon: Building },
    { label: "Average Response Time", value: "45 min", icon: Clock }
  ];

  const values = [
    {
      title: "Reliability",
      description: "24/7 availability with guaranteed response times",
      icon: Shield
    },
    {
      title: "Quality",
      description: "Certified technicians with industry-leading expertise",
      icon: Award
    },
    {
      title: "Speed",
      description: "Rapid dispatch and efficient service delivery",
      icon: Zap
    },
    {
      title: "Transparency",
      description: "Clear pricing and real-time job tracking",
      icon: Target
    }
  ];

  const milestones = [
    { year: "2020", event: "TruckFixGo founded in Dallas, TX" },
    { year: "2021", event: "Expanded to 10 states across the Southeast" },
    { year: "2022", event: "Launched fleet management platform" },
    { year: "2023", event: "Reached 500+ certified contractors" },
    { year: "2024", event: "Introduced AI-powered dispatch system" },
    { year: "2025", event: "Nationwide coverage achieved" }
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
                <a className="text-sm font-medium text-primary">About</a>
              </Link>
              <Link href="/services">
                <a className="text-sm hover:text-primary">Services</a>
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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">Since 2020</Badge>
          <h1 className="text-4xl font-bold mb-4">About TruckFixGo</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're revolutionizing truck repair and maintenance with technology-driven solutions
            that keep America's fleets moving forward.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6 text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To provide fast, reliable, and transparent truck repair services that minimize
                downtime and maximize productivity for drivers and fleet operators across America.
                We connect skilled contractors with those who need them most, when they need them most.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To become the leading platform for commercial vehicle services, creating a
                seamless ecosystem where technology, expertise, and efficiency converge to keep
                the transportation industry moving forward without interruption.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Our Core Values</CardTitle>
            <CardDescription>
              The principles that guide everything we do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="text-center">
                    <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Company Timeline */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Our Journey</CardTitle>
            <CardDescription>
              Building the future of truck repair, one milestone at a time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2">
                      <CheckCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <Badge variant="outline" className="mb-1">{milestone.year}</Badge>
                    <p className="text-sm">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Us */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Why Choose TruckFixGo?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Nationwide Coverage</p>
                    <p className="text-sm text-muted-foreground">
                      Service available across all major highways and truck routes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Certified Technicians</p>
                    <p className="text-sm text-muted-foreground">
                      All contractors are vetted, licensed, and insured
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Transparent Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Upfront quotes with no hidden fees or surprises
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Real-Time Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor your service request from dispatch to completion
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fleet Integration</p>
                    <p className="text-sm text-muted-foreground">
                      Seamless integration with fleet management systems
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">24/7 Support</p>
                    <p className="text-sm text-muted-foreground">
                      Round-the-clock assistance whenever you need it
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Leadership Team</CardTitle>
            <CardDescription>
              Experienced professionals dedicated to transforming truck repair
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3" />
                <h3 className="font-semibold">John Smith</h3>
                <p className="text-sm text-muted-foreground">Chief Executive Officer</p>
                <p className="text-xs text-muted-foreground mt-2">
                  20+ years in transportation industry
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3" />
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">Chief Technology Officer</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Former tech lead at major logistics company
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3" />
                <h3 className="font-semibold">Mike Williams</h3>
                <p className="text-sm text-muted-foreground">Chief Operations Officer</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Expert in fleet management and operations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Experience the Difference?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of drivers and fleet operators who trust TruckFixGo for their repair needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/emergency">
                  <Button size="lg" data-testid="button-get-service">
                    <Truck className="mr-2 h-4 w-4" />
                    Get Service Now
                  </Button>
                </Link>
                <Link href="/fleet/register">
                  <Button size="lg" variant="outline" data-testid="button-fleet-signup">
                    <Building className="mr-2 h-4 w-4" />
                    Fleet Sign Up
                  </Button>
                </Link>
                <Link href="/contractor-signup">
                  <Button size="lg" variant="outline" data-testid="button-join-team">
                    <Users className="mr-2 h-4 w-4" />
                    Join Our Team
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