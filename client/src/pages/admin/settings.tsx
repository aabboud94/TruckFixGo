import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, TestTube, Plus, Trash2, Edit, MapPin, DollarSign, Settings2, Zap } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [testingApi, setTestingApi] = useState<string | null>(null);

  // Query for current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
  });

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings saved",
        description: "All changes have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error.message,
      });
    },
  });

  // Test API connection
  const testApiConnection = async (service: string) => {
    setTestingApi(service);
    try {
      const response = await apiRequest(`/api/admin/test-integration/${service}`, {
        method: 'POST',
      });
      toast({
        title: "Connection successful",
        description: `${service} API is configured correctly`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message,
      });
    } finally {
      setTestingApi(null);
    }
  };

  const currentSettings = settings || {
    general: {
      platformName: "TruckFixGo",
      supportEmail: "support@truckfixgo.com",
      supportPhone: "1-800-FIX-TRUCK",
      businessHours: "24/7",
      timezone: "America/New_York",
      maintenanceMode: false,
    },
    pricing: {
      emergencySurcharge: 25,
      nightSurcharge: 15,
      weekendSurcharge: 10,
      waterSourceSurcharge: 50,
      baseRates: [
        { service: "Emergency Repair", base: 150, perHour: 125 },
        { service: "Truck Wash", base: 75, perTruck: 60 },
        { service: "PM Service", base: 200, perHour: 100 },
        { service: "Tire Service", base: 175, perTire: 150 },
      ],
      fleetDiscounts: {
        standard: 0,
        silver: 5,
        gold: 10,
        platinum: 15,
      },
      distanceTiers: [
        { miles: 10, multiplier: 1.0 },
        { miles: 25, multiplier: 1.2 },
        { miles: 50, multiplier: 1.5 },
        { miles: 100, multiplier: 2.0 },
      ],
    },
    integrations: {
      stripe: {
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
        enabled: true,
      },
      twilio: {
        accountSid: "",
        authToken: "",
        phoneNumber: "",
        enabled: true,
      },
      openai: {
        apiKey: "",
        model: "gpt-4",
        enabled: true,
      },
      email: {
        provider: "smtp",
        host: "smtp.gmail.com",
        port: 587,
        username: "",
        password: "",
        from: "noreply@truckfixgo.com",
      },
    },
    features: {
      enableReferrals: true,
      enableSurgePricing: true,
      enableFleetAccounts: true,
      enableWashServices: true,
      enableScheduledServices: true,
      autoAssignContractors: true,
      requirePhotoProof: true,
      allowGuestBooking: true,
    },
  };

  const handleSaveSettings = (section: string, data: any) => {
    saveMutation.mutate({
      section,
      data,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Platform Settings">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Platform Settings"
      breadcrumbs={[{ label: "Settings" }]}
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="areas">Service Areas</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure platform name, contact info, and business hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    defaultValue={currentSettings.general.platformName}
                    placeholder="TruckFixGo"
                    data-testid="input-platform-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select defaultValue={currentSettings.general.timezone}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue={currentSettings.general.supportEmail}
                    placeholder="support@truckfixgo.com"
                    data-testid="input-support-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    defaultValue={currentSettings.general.supportPhone}
                    placeholder="1-800-FIX-TRUCK"
                    data-testid="input-support-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <Input
                    id="businessHours"
                    defaultValue={currentSettings.general.businessHours}
                    placeholder="24/7 or Mon-Fri 9am-5pm"
                    data-testid="input-business-hours"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    defaultChecked={currentSettings.general.maintenanceMode}
                    data-testid="switch-maintenance-mode"
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('general', currentSettings.general)}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-general"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Surcharges */}
          <Card>
            <CardHeader>
              <CardTitle>Surcharge Configuration</CardTitle>
              <CardDescription>Configure various surcharge percentages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Emergency Surcharge: {currentSettings.pricing.emergencySurcharge}%</Label>
                  <Slider
                    defaultValue={[currentSettings.pricing.emergencySurcharge]}
                    max={50}
                    step={5}
                    className="w-full"
                    data-testid="slider-emergency-surcharge"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Night Surcharge: {currentSettings.pricing.nightSurcharge}%</Label>
                  <Slider
                    defaultValue={[currentSettings.pricing.nightSurcharge]}
                    max={30}
                    step={5}
                    className="w-full"
                    data-testid="slider-night-surcharge"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekend Surcharge: {currentSettings.pricing.weekendSurcharge}%</Label>
                  <Slider
                    defaultValue={[currentSettings.pricing.weekendSurcharge]}
                    max={30}
                    step={5}
                    className="w-full"
                    data-testid="slider-weekend-surcharge"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Water Source Surcharge: ${currentSettings.pricing.waterSourceSurcharge}</Label>
                  <Slider
                    defaultValue={[currentSettings.pricing.waterSourceSurcharge]}
                    max={100}
                    step={10}
                    className="w-full"
                    data-testid="slider-water-surcharge"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Base Service Rates</CardTitle>
              <CardDescription>Configure base rates for each service type</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Per Hour/Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSettings.pricing.baseRates.map((rate, index) => (
                    <TableRow key={index}>
                      <TableCell>{rate.service}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={rate.base}
                          className="w-24"
                          data-testid={`input-base-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={rate.perHour || rate.perTruck || rate.perTire}
                          className="w-24"
                          data-testid={`input-per-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Service Type
              </Button>
            </CardContent>
          </Card>

          {/* Fleet Discounts */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Tier Discounts</CardTitle>
              <CardDescription>Configure discount percentages for fleet tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(currentSettings.pricing.fleetDiscounts).map(([tier, discount]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <Label className="capitalize">{tier} Tier</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={discount}
                        className="w-20"
                        data-testid={`input-discount-${tier}`}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => handleSaveSettings('pricing', currentSettings.pricing)}
              disabled={saveMutation.isPending}
              data-testid="button-save-pricing"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Pricing Settings
            </Button>
          </div>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Stripe */}
          <Card>
            <CardHeader>
              <CardTitle>Stripe Payment Integration</CardTitle>
              <CardDescription>Configure Stripe API keys for payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">Publishable Key</Label>
                <Input
                  id="stripePublicKey"
                  type="password"
                  placeholder="pk_live_..."
                  defaultValue={currentSettings.integrations.stripe.publicKey}
                  data-testid="input-stripe-public"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Secret Key</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  placeholder="sk_live_..."
                  defaultValue={currentSettings.integrations.stripe.secretKey}
                  data-testid="input-stripe-secret"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
                <Input
                  id="stripeWebhookSecret"
                  type="password"
                  placeholder="whsec_..."
                  defaultValue={currentSettings.integrations.stripe.webhookSecret}
                  data-testid="input-stripe-webhook"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stripeEnabled"
                    defaultChecked={currentSettings.integrations.stripe.enabled}
                    data-testid="switch-stripe-enabled"
                  />
                  <Label htmlFor="stripeEnabled">Enable Stripe Payments</Label>
                </div>
                <Button
                  variant="outline"
                  onClick={() => testApiConnection('stripe')}
                  disabled={testingApi === 'stripe'}
                  data-testid="button-test-stripe"
                >
                  {testingApi === 'stripe' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Twilio */}
          <Card>
            <CardHeader>
              <CardTitle>Twilio SMS Integration</CardTitle>
              <CardDescription>Configure Twilio for SMS notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilioAccountSid">Account SID</Label>
                <Input
                  id="twilioAccountSid"
                  type="password"
                  placeholder="AC..."
                  defaultValue={currentSettings.integrations.twilio.accountSid}
                  data-testid="input-twilio-sid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilioAuthToken">Auth Token</Label>
                <Input
                  id="twilioAuthToken"
                  type="password"
                  placeholder="Your auth token"
                  defaultValue={currentSettings.integrations.twilio.authToken}
                  data-testid="input-twilio-token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilioPhone">Phone Number</Label>
                <Input
                  id="twilioPhone"
                  placeholder="+1234567890"
                  defaultValue={currentSettings.integrations.twilio.phoneNumber}
                  data-testid="input-twilio-phone"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="twilioEnabled"
                    defaultChecked={currentSettings.integrations.twilio.enabled}
                    data-testid="switch-twilio-enabled"
                  />
                  <Label htmlFor="twilioEnabled">Enable SMS Notifications</Label>
                </div>
                <Button
                  variant="outline"
                  onClick={() => testApiConnection('twilio')}
                  disabled={testingApi === 'twilio'}
                  data-testid="button-test-twilio"
                >
                  {testingApi === 'twilio' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI */}
          <Card>
            <CardHeader>
              <CardTitle>OpenAI Integration</CardTitle>
              <CardDescription>Configure OpenAI for AI-powered features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiKey">API Key</Label>
                <Input
                  id="openaiKey"
                  type="password"
                  placeholder="sk-..."
                  defaultValue={currentSettings.integrations.openai.apiKey}
                  data-testid="input-openai-key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openaiModel">Model</Label>
                <Select defaultValue={currentSettings.integrations.openai.model}>
                  <SelectTrigger data-testid="select-openai-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="openaiEnabled"
                    defaultChecked={currentSettings.integrations.openai.enabled}
                    data-testid="switch-openai-enabled"
                  />
                  <Label htmlFor="openaiEnabled">Enable AI Features</Label>
                </div>
                <Button
                  variant="outline"
                  onClick={() => testApiConnection('openai')}
                  disabled={testingApi === 'openai'}
                  data-testid="button-test-openai"
                >
                  {testingApi === 'openai' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => handleSaveSettings('integrations', currentSettings.integrations)}
              disabled={saveMutation.isPending}
              data-testid="button-save-integrations"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Integration Settings
            </Button>
          </div>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(currentSettings.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={key} className="text-base">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'enableReferrals' && 'Allow users to refer others and earn rewards'}
                        {key === 'enableSurgePricing' && 'Automatically increase prices during high demand'}
                        {key === 'enableFleetAccounts' && 'Allow fleet companies to create accounts'}
                        {key === 'enableWashServices' && 'Offer truck washing services'}
                        {key === 'enableScheduledServices' && 'Allow scheduling services in advance'}
                        {key === 'autoAssignContractors' && 'Automatically assign nearest available contractor'}
                        {key === 'requirePhotoProof' && 'Require photo proof for job completion'}
                        {key === 'allowGuestBooking' && 'Allow booking without creating an account'}
                      </p>
                    </div>
                    <Switch
                      id={key}
                      defaultChecked={enabled as boolean}
                      data-testid={`switch-${key}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => handleSaveSettings('features', currentSettings.features)}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-features"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Areas */}
        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle>Service Area Configuration</CardTitle>
              <CardDescription>Configure coverage zones and area-based pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Interactive map for service area configuration
                  </p>
                  <Button variant="outline">
                    Open Map Editor
                  </Button>
                </div>
                
                {/* Zone List */}
                <div className="space-y-2">
                  <h3 className="font-medium">Configured Service Zones</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Downtown District</p>
                        <p className="text-sm text-muted-foreground">1.2x pricing multiplier</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Airport Zone</p>
                        <p className="text-sm text-muted-foreground">1.5x pricing multiplier</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service Zone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}