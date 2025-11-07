import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  Headphones, AlertCircle, Building, Truck,
  Shield, Users, ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
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
                <a className="text-sm hover:text-primary">Pricing</a>
              </Link>
              <Link href="/contact">
                <a className="text-sm font-medium text-primary">Contact</a>
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
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help 24/7. Reach out for emergency service, support, or general inquiries.
          </p>
        </div>

        {/* Emergency Alert */}
        <Alert className="mb-8 max-w-3xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Need Emergency Service?</strong> Call our 24/7 hotline immediately at{" "}
            <a href="tel:1-800-FIX-TRUCK" className="font-bold text-primary">
              1-800-FIX-TRUCK
            </a>{" "}
            or{" "}
            <Link href="/emergency">
              <a className="font-bold text-primary">book online</a>
            </Link>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Choose the best way to reach us for your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emergency Hotline */}
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <Phone className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">24/7 Emergency Hotline</h3>
                    <a 
                      href="tel:1-800-FIX-TRUCK" 
                      className="text-2xl font-bold text-primary hover:underline"
                      data-testid="link-emergency-phone"
                    >
                      1-800-FIX-TRUCK
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Immediate roadside assistance and emergency repairs
                    </p>
                  </div>
                </div>

                <Separator />

                {/* General Support */}
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Headphones className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">General Support</h3>
                    <a 
                      href="tel:1-800-349-8782" 
                      className="text-lg font-medium text-foreground hover:text-primary"
                      data-testid="link-support-phone"
                    >
                      1-800-349-8782
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mon-Fri: 8 AM - 8 PM EST<br />
                      Sat-Sun: 9 AM - 5 PM EST
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Email Support */}
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <div className="space-y-2">
                      <div>
                        <a 
                          href="mailto:support@truckfixgo.com"
                          className="font-medium hover:text-primary"
                          data-testid="link-support-email"
                        >
                          support@truckfixgo.com
                        </a>
                        <p className="text-sm text-muted-foreground">General inquiries & support</p>
                      </div>
                      <div>
                        <a 
                          href="mailto:fleet@truckfixgo.com"
                          className="font-medium hover:text-primary"
                          data-testid="link-fleet-email"
                        >
                          fleet@truckfixgo.com
                        </a>
                        <p className="text-sm text-muted-foreground">Fleet account inquiries</p>
                      </div>
                      <div>
                        <a 
                          href="mailto:contractors@truckfixgo.com"
                          className="font-medium hover:text-primary"
                          data-testid="link-contractors-email"
                        >
                          contractors@truckfixgo.com
                        </a>
                        <p className="text-sm text-muted-foreground">Contractor applications & support</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Office Locations */}
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Office Locations</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">Headquarters</p>
                        <p className="text-sm text-muted-foreground">
                          123 Truck Plaza Way<br />
                          Dallas, TX 75001<br />
                          United States
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Operations Center</p>
                        <p className="text-sm text-muted-foreground">
                          456 Fleet Avenue<br />
                          Atlanta, GA 30301<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Department Contacts</CardTitle>
                <CardDescription>
                  Direct lines to specialized teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">Billing & Payments</p>
                    <p className="text-sm text-muted-foreground">billing@truckfixgo.com</p>
                    <p className="text-sm text-muted-foreground">1-800-349-2455</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Fleet Accounts</p>
                    <p className="text-sm text-muted-foreground">fleet@truckfixgo.com</p>
                    <p className="text-sm text-muted-foreground">1-800-349-3533</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Contractor Relations</p>
                    <p className="text-sm text-muted-foreground">contractors@truckfixgo.com</p>
                    <p className="text-sm text-muted-foreground">1-800-349-2668</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Technical Support</p>
                    <p className="text-sm text-muted-foreground">tech@truckfixgo.com</p>
                    <p className="text-sm text-muted-foreground">1-800-349-8324</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Service Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Service Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Emergency Service</span>
                  <Badge variant="destructive">24/7</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Support</span>
                  <Badge>8 AM - 8 PM EST</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fleet Support</span>
                  <Badge>24/7</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Billing</span>
                  <Badge>9 AM - 5 PM EST</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/emergency">
                  <Button className="w-full" variant="destructive" data-testid="button-book-emergency">
                    <Truck className="mr-2 h-4 w-4" />
                    Book Emergency Service
                  </Button>
                </Link>
                <Link href="/fleet/register">
                  <Button className="w-full" variant="outline" data-testid="button-fleet-account">
                    <Users className="mr-2 h-4 w-4" />
                    Create Fleet Account
                  </Button>
                </Link>
                <Link href="/contractor-signup">
                  <Button className="w-full" variant="outline" data-testid="button-become-contractor">
                    <Shield className="mr-2 h-4 w-4" />
                    Become a Contractor
                  </Button>
                </Link>
                <Button className="w-full" variant="outline" data-testid="button-live-chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Live Chat
                </Button>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="#" 
                  className="flex items-center justify-between hover:text-primary"
                  data-testid="link-facebook"
                >
                  <span className="text-sm">Facebook</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between hover:text-primary"
                  data-testid="link-twitter"
                >
                  <span className="text-sm">Twitter</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between hover:text-primary"
                  data-testid="link-linkedin"
                >
                  <span className="text-sm">LinkedIn</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between hover:text-primary"
                  data-testid="link-youtube"
                >
                  <span className="text-sm">YouTube</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}