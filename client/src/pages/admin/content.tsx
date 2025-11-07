import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Edit, Save, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminContent() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <Button data-testid="button-save-content">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="homepage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="terms">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="homepage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Main headline and call-to-action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Input
                    id="hero-title"
                    defaultValue="24/7 Mobile Mechanics for Semi-Trucks"
                    data-testid="input-hero-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero-subtitle"
                    defaultValue="Get back on the road fast with certified mobile mechanics. Emergency repairs and preventive maintenance anywhere, anytime."
                    className="min-h-[100px]"
                    data-testid="input-hero-subtitle"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-preview-hero">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trust Indicators</CardTitle>
                <CardDescription>Statistics and social proof</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Jobs Completed</Label>
                  <Input defaultValue="10,000+" data-testid="input-jobs-completed" />
                </div>
                <div className="space-y-2">
                  <Label>Average Response Time</Label>
                  <Input defaultValue="45 min" data-testid="input-response-time" />
                </div>
                <div className="space-y-2">
                  <Label>Certified Mechanics</Label>
                  <Input defaultValue="500+" data-testid="input-mechanics-count" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Descriptions</CardTitle>
                <CardDescription>Edit service offerings and descriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">Emergency Tire Service</h4>
                    <Button size="sm" variant="ghost" data-testid="button-edit-service">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    24/7 tire repair and replacement service. Our mechanics carry common tire sizes
                    and can source specific tires quickly.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">Preventive Maintenance</h4>
                    <Button size="sm" variant="ghost" data-testid="button-edit-service">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    DOT-compliant PM services including A, B, and C level maintenance performed
                    at your location.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Manage FAQ content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full" data-testid="button-add-faq">
                    <FileText className="mr-2 h-4 w-4" />
                    Add New FAQ
                  </Button>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-medium">How quickly can a mechanic arrive?</h4>
                        <Button size="sm" variant="ghost" data-testid="button-edit-faq">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average response time is 45 minutes for emergency calls. Scheduled
                        maintenance can be booked for specific time slots.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Legal Documents</CardTitle>
                <CardDescription>Terms of service and privacy policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Terms of Service</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" data-testid="button-edit-terms">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Terms
                    </Button>
                    <Button variant="outline" data-testid="button-view-terms">
                      <Eye className="mr-2 h-4 w-4" />
                      View Current
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Privacy Policy</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" data-testid="button-edit-privacy">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Privacy
                    </Button>
                    <Button variant="outline" data-testid="button-view-privacy">
                      <Eye className="mr-2 h-4 w-4" />
                      View Current
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}