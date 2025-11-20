import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, Save, TestTube, Plus, Trash2, Edit, MapPin, DollarSign, 
  Settings2, Zap, Users, Bell, Building, Key, Shield, TrendingUp,
  MessageSquare, CreditCard, Clock, Award, AlertTriangle, ChevronRight
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [showAddServiceType, setShowAddServiceType] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<any>(null);
  const [newServiceType, setNewServiceType] = useState({
    name: '',
    description: '',
    baseRate: 0,
    perUnit: 0,
    unitType: 'hour' as 'hour' | 'mile' | 'truck' | 'tire' | 'service',
    isActive: true,
    emergencyAvailable: true,
    scheduledAvailable: true,
    categories: [] as string[]
  });
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});
  
  // Commission Settings State
  const [commissionType, setCommissionType] = useState<'percentage' | 'flat'>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(15);

  // Query for current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
  });

  // Query for commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['/api/admin/commission-settings'],
  });

  // Initialize feature states when settings are loaded
  useEffect(() => {
    if (settings?.features && Object.keys(featureStates).length === 0) {
      setFeatureStates(settings.features);
    }
  }, [settings]);

  // Initialize commission settings when loaded
  useEffect(() => {
    if (commissionSettings) {
      setCommissionType(commissionSettings.commissionType || 'percentage');
      setCommissionValue(parseFloat(commissionSettings.commissionValue) || 15);
    }
  }, [commissionSettings]);

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/admin/settings', data);
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

  // Mutation for saving commission settings
  const saveCommissionMutation = useMutation({
    mutationFn: async (data: { commissionType: 'percentage' | 'flat', commissionValue: number }) => {
      return apiRequest('PUT', '/api/admin/commission-settings', {
        commissionType: data.commissionType,
        commissionValue: String(data.commissionValue)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission-settings'] });
      toast({
        title: "Commission settings saved",
        description: "Commission settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save commission settings",
        description: error.message,
      });
    },
  });

  // Mutation for managing service types
  const serviceTypeMutation = useMutation({
    mutationFn: async ({ action, serviceType }: { action: 'add' | 'update' | 'delete', serviceType: any }) => {
      if (action === 'delete') {
        return apiRequest('DELETE', `/api/admin/service-types/${serviceType.id}`);
      } else if (action === 'update') {
        // Transform the data to match backend expectations
        const updateData = {
          name: serviceType.service || serviceType.name,
          description: serviceType.description,
          basePrice: serviceType.base || serviceType.baseRate || serviceType.basePrice,
          perHourRate: serviceType.perHour || serviceType.perHourRate,
          perMileRate: serviceType.perMile || serviceType.perMileRate,
          isActive: serviceType.isActive,
          isEmergency: serviceType.emergencyAvailable || serviceType.isEmergency,
          isSchedulable: serviceType.scheduledAvailable || serviceType.isSchedulable,
        };
        return apiRequest('PUT', `/api/admin/service-types/${serviceType.id}`, updateData);
      } else {
        return apiRequest('POST', '/api/admin/service-types', serviceType);
      }
    },
    onSuccess: async () => {
      // Invalidate all related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/service-types'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/public/services-with-pricing'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/settings'] });
      setShowAddServiceType(false);
      setEditingServiceType(null);
      toast({
        title: "Service type updated",
        description: "Service type has been saved successfully",
      });
      setNewServiceType({
        name: '',
        description: '',
        baseRate: 0,
        perUnit: 0,
        unitType: 'hour',
        isActive: true,
        emergencyAvailable: true,
        scheduledAvailable: true,
        categories: []
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save service type",
        description: error.message,
      });
    },
  });

  // Test API connection
  const testApiConnection = async (service: string) => {
    setTestingApi(service);
    try {
      const response = await apiRequest('POST', `/api/admin/test-integration/${service}`, {});
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
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto min-w-max p-1">
            <TabsTrigger value="general" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="pricing" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Pricing</TabsTrigger>
            <TabsTrigger value="surge" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Surge Rules</TabsTrigger>
            <TabsTrigger value="integrations" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Integrations</TabsTrigger>
            <TabsTrigger value="contractors" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Contractors</TabsTrigger>
            <TabsTrigger value="notifications" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="fleet" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Fleet Policies</TabsTrigger>
            <TabsTrigger value="features" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Features</TabsTrigger>
            <TabsTrigger value="areas" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Service Areas</TabsTrigger>
            <TabsTrigger value="auto-assignment" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Assignment</TabsTrigger>
            <TabsTrigger value="monitoring" className="min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm">Monitoring</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure platform name, contact info, and business hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName" className="text-sm">Platform Name</Label>
                  <Input
                    id="platformName"
                    defaultValue={currentSettings.general.platformName}
                    placeholder="TruckFixGo"
                    className="min-h-[44px]"
                    data-testid="input-platform-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm">Time Zone</Label>
                  <Select defaultValue={currentSettings.general.timezone}>
                    <SelectTrigger className="min-h-[44px]" data-testid="select-timezone">
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
                  <Label htmlFor="supportEmail" className="text-sm">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue={currentSettings.general.supportEmail}
                    placeholder="support@truckfixgo.com"
                    className="min-h-[44px]"
                    data-testid="input-support-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone" className="text-sm">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    type="tel"
                    defaultValue={currentSettings.general.supportPhone}
                    placeholder="1-800-FIX-TRUCK"
                    className="min-h-[44px]"
                    data-testid="input-support-phone"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="businessHours" className="text-sm">Business Hours</Label>
                  <Input
                    id="businessHours"
                    defaultValue={currentSettings.general.businessHours}
                    placeholder="24/7 or Mon-Fri 9am-5pm"
                    className="min-h-[44px]"
                    data-testid="input-business-hours"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:col-span-2">
                  <Switch
                    id="maintenanceMode"
                    defaultChecked={currentSettings.general.maintenanceMode}
                    className="min-h-[24px] min-w-[44px]"
                    data-testid="switch-maintenance-mode"
                  />
                  <Label htmlFor="maintenanceMode" className="text-sm">Maintenance Mode</Label>
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

          {/* Service Type Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Type Management</CardTitle>
                  <CardDescription>Configure all service types and their pricing</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddServiceType(true)}
                  data-testid="button-add-service-type"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Service Name</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[150px]">Description</TableHead>
                      <TableHead className="min-w-[80px]">Base Rate</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[80px]">Per Unit</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[80px]">Unit Type</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[100px]">Availability</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {currentSettings.pricing.baseRates.map((rate, index) => {
                    // Generate a stable ID based on service name if not present
                    const serviceId = rate.id || `service-${rate.service.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                      <TableRow key={serviceId}>
                        <TableCell className="font-medium text-xs sm:text-sm">{rate.service}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground">
                          {rate.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">${rate.base}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                          ${rate.perHour || rate.perTruck || rate.perTire || rate.perUnit || 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                          {rate.unitType || (rate.perHour ? 'hour' : rate.perTruck ? 'truck' : rate.perTire ? 'tire' : 'service')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {rate.emergencyAvailable !== false && <Badge variant="outline" className="text-xs">Emergency</Badge>}
                            {rate.scheduledAvailable !== false && <Badge variant="outline" className="text-xs">Scheduled</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rate.isActive !== false ? "default" : "secondary"} className="text-xs">
                            {rate.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setEditingServiceType({...rate, id: serviceId});
                                setShowAddServiceType(true);
                              }}
                              data-testid={`button-edit-service-${index}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this service type?')) {
                                  serviceTypeMutation.mutate({ 
                                    action: 'delete', 
                                    serviceType: { id: serviceId }
                                  });
                                }
                              }}
                              data-testid={`button-delete-service-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Service Type Dialog */}
          {showAddServiceType && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{editingServiceType ? 'Edit' : 'Add New'} Service Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name *</Label>
                    <Input
                      id="service-name"
                      placeholder="e.g., Emergency Repair"
                      value={editingServiceType?.service || newServiceType.name}
                      onChange={(e) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, service: e.target.value});
                        } else {
                          setNewServiceType({...newServiceType, name: e.target.value});
                        }
                      }}
                      data-testid="input-service-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-type">Unit Type *</Label>
                    <Select 
                      value={editingServiceType?.unitType || newServiceType.unitType}
                      onValueChange={(value) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, unitType: value});
                        } else {
                          setNewServiceType({...newServiceType, unitType: value as any});
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-unit-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Per Hour</SelectItem>
                        <SelectItem value="truck">Per Truck</SelectItem>
                        <SelectItem value="tire">Per Tire</SelectItem>
                        <SelectItem value="mile">Per Mile</SelectItem>
                        <SelectItem value="service">Per Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base-rate">Base Rate ($) *</Label>
                    <Input
                      id="base-rate"
                      type="number"
                      placeholder="150"
                      value={editingServiceType?.base || newServiceType.baseRate}
                      onChange={(e) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, base: parseFloat(e.target.value)});
                        } else {
                          setNewServiceType({...newServiceType, baseRate: parseFloat(e.target.value)});
                        }
                      }}
                      data-testid="input-base-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="per-unit">Per Unit Rate ($) *</Label>
                    <Input
                      id="per-unit"
                      type="number"
                      placeholder="125"
                      value={editingServiceType?.perHour || editingServiceType?.perTruck || editingServiceType?.perTire || editingServiceType?.perUnit || newServiceType.perUnit}
                      onChange={(e) => {
                        if (editingServiceType) {
                          const unitType = editingServiceType.unitType || 'hour';
                          if (unitType === 'hour') {
                            setEditingServiceType({...editingServiceType, perHour: parseFloat(e.target.value)});
                          } else if (unitType === 'truck') {
                            setEditingServiceType({...editingServiceType, perTruck: parseFloat(e.target.value)});
                          } else if (unitType === 'tire') {
                            setEditingServiceType({...editingServiceType, perTire: parseFloat(e.target.value)});
                          } else {
                            setEditingServiceType({...editingServiceType, perUnit: parseFloat(e.target.value)});
                          }
                        } else {
                          setNewServiceType({...newServiceType, perUnit: parseFloat(e.target.value)});
                        }
                      }}
                      data-testid="input-per-unit"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this service type..."
                    value={editingServiceType?.description || newServiceType.description}
                    onChange={(e) => {
                      if (editingServiceType) {
                        setEditingServiceType({...editingServiceType, description: e.target.value});
                      } else {
                        setNewServiceType({...newServiceType, description: e.target.value});
                      }
                    }}
                    data-testid="textarea-service-description"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={editingServiceType?.isActive !== false && newServiceType.isActive}
                      onCheckedChange={(checked) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, isActive: checked});
                        } else {
                          setNewServiceType({...newServiceType, isActive: checked});
                        }
                      }}
                      data-testid="switch-is-active"
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emergency-available"
                      checked={editingServiceType?.emergencyAvailable !== false && newServiceType.emergencyAvailable}
                      onCheckedChange={(checked) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, emergencyAvailable: checked});
                        } else {
                          setNewServiceType({...newServiceType, emergencyAvailable: checked});
                        }
                      }}
                      data-testid="switch-emergency-available"
                    />
                    <Label htmlFor="emergency-available">Available for Emergency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="scheduled-available"
                      checked={editingServiceType?.scheduledAvailable !== false && newServiceType.scheduledAvailable}
                      onCheckedChange={(checked) => {
                        if (editingServiceType) {
                          setEditingServiceType({...editingServiceType, scheduledAvailable: checked});
                        } else {
                          setNewServiceType({...newServiceType, scheduledAvailable: checked});
                        }
                      }}
                      data-testid="switch-scheduled-available"
                    />
                    <Label htmlFor="scheduled-available">Available for Scheduled</Label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAddServiceType(false);
                      setEditingServiceType(null);
                      setNewServiceType({
                        name: '',
                        description: '',
                        baseRate: 0,
                        perUnit: 0,
                        unitType: 'hour',
                        isActive: true,
                        emergencyAvailable: true,
                        scheduledAvailable: true,
                        categories: []
                      });
                    }}
                    data-testid="button-cancel-service-type"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      const data = editingServiceType || newServiceType;
                      if (!data.name && !editingServiceType?.service) {
                        toast({
                          variant: "destructive",
                          title: "Validation Error",
                          description: "Service name is required"
                        });
                        return;
                      }
                      serviceTypeMutation.mutate({
                        action: editingServiceType ? 'update' : 'add',
                        serviceType: editingServiceType || {
                          ...newServiceType,
                          service: newServiceType.name,
                          base: newServiceType.baseRate,
                          perHour: newServiceType.unitType === 'hour' ? newServiceType.perUnit : undefined,
                          perTruck: newServiceType.unitType === 'truck' ? newServiceType.perUnit : undefined,
                          perTire: newServiceType.unitType === 'tire' ? newServiceType.perUnit : undefined,
                          perUnit: !['hour', 'truck', 'tire'].includes(newServiceType.unitType) ? newServiceType.perUnit : undefined,
                        }
                      });
                    }}
                    disabled={serviceTypeMutation.isPending}
                    data-testid="button-save-service-type"
                  >
                    {serviceTypeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {editingServiceType ? 'Update' : 'Add'} Service Type
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>Configure how contractors are charged commission on completed jobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display current commission settings */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Commission:</span>
                  <span className="font-medium">
                    {commissionType === 'percentage' 
                      ? `${commissionValue}%` 
                      : `$${commissionValue} flat fee`}
                  </span>
                </div>
              </div>

              {/* Commission Type Selection */}
              <div className="space-y-3">
                <Label>Commission Type</Label>
                <RadioGroup
                  value={commissionType}
                  onValueChange={(value) => setCommissionType(value as 'percentage' | 'flat')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="percentage" 
                      id="percentage" 
                      data-testid="radio-commission-percentage" 
                    />
                    <Label htmlFor="percentage" className="font-normal cursor-pointer">
                      Percentage of job value
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="flat" 
                      id="flat" 
                      data-testid="radio-commission-flat" 
                    />
                    <Label htmlFor="flat" className="font-normal cursor-pointer">
                      Flat fee per job
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Commission Value Input */}
              <div className="space-y-2">
                <Label htmlFor="commission-value">
                  Commission Value {commissionType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <div className="flex items-center gap-2">
                  {commissionType === 'flat' && (
                    <span className="text-sm text-muted-foreground">$</span>
                  )}
                  <Input
                    id="commission-value"
                    type="number"
                    min={0}
                    step={commissionType === 'percentage' ? 0.1 : 1}
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                    className="w-32"
                    placeholder={commissionType === 'percentage' ? '15' : '25'}
                    data-testid="input-commission-value"
                  />
                  {commissionType === 'percentage' && (
                    <span className="text-sm text-muted-foreground">%</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {commissionType === 'percentage' 
                    ? 'Percentage charged on each completed job'
                    : 'Fixed amount charged for each completed job'}
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    saveCommissionMutation.mutate({
                      commissionType: commissionType,
                      commissionValue: commissionValue
                    });
                  }}
                  disabled={saveCommissionMutation.isPending}
                  data-testid="button-save-commission"
                >
                  {saveCommissionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Commission Settings
                </Button>
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
                      checked={featureStates[key] ?? enabled}
                      onCheckedChange={(checked) => {
                        setFeatureStates(prev => ({
                          ...prev,
                          [key]: checked
                        }));
                      }}
                      data-testid={`switch-${key}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => handleSaveSettings('features', featureStates)}
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

        {/* Auto-Assignment Rules */}
        <TabsContent value="auto-assignment">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Assignment Rules</CardTitle>
              <CardDescription>Configure automatic job assignment escalation and timeouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Auto-Assignment</Label>
                  <Switch
                    defaultChecked={currentSettings.features.autoAssignContractors}
                    data-testid="switch-auto-assign-enabled"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Escalation Timeouts</h3>
                
                <div className="space-y-2">
                  <Label>Admin Alert Time (minutes): 5</Label>
                  <Slider
                    defaultValue={[5]}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                    data-testid="slider-admin-alert-time"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time to wait before alerting admins about unassigned jobs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Customer Notice Time (minutes): 7</Label>
                  <Slider
                    defaultValue={[7]}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                    data-testid="slider-customer-notice-time"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time to wait before notifying customer about assignment delays
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Auto-Assignment Time (minutes): 10</Label>
                  <Slider
                    defaultValue={[10]}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                    data-testid="slider-auto-assign-time"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time to wait before automatically assigning to next available contractor
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assignment Priority</h3>
                
                <div className="space-y-2">
                  <Label>Assignment Algorithm</Label>
                  <Select defaultValue="rating_distance">
                    <SelectTrigger data-testid="select-assignment-algorithm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest">Nearest Contractor</SelectItem>
                      <SelectItem value="highest_rating">Highest Rating</SelectItem>
                      <SelectItem value="rating_distance">Rating + Distance Balance</SelectItem>
                      <SelectItem value="least_busy">Least Busy</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Distance (miles): 50</Label>
                  <Slider
                    defaultValue={[50]}
                    min={10}
                    max={200}
                    step={10}
                    className="w-full"
                    data-testid="slider-max-distance"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Contractor Rating: 4.0</Label>
                  <Slider
                    defaultValue={[4.0]}
                    min={3.0}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                    data-testid="slider-min-rating"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cooldown Periods</h3>
                
                <div className="space-y-2">
                  <Label>Admin Alert Cooldown (minutes): 30</Label>
                  <Slider
                    defaultValue={[30]}
                    min={10}
                    max={120}
                    step={10}
                    className="w-full"
                    data-testid="slider-admin-cooldown"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum time between sending admin alerts for the same job
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Customer Notification Cooldown (minutes): 15</Label>
                  <Slider
                    defaultValue={[15]}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                    data-testid="slider-customer-cooldown"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum time between sending customer notifications
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Contractor Rejection Cooldown (minutes): 60</Label>
                  <Slider
                    defaultValue={[60]}
                    min={15}
                    max={240}
                    step={15}
                    className="w-full"
                    data-testid="slider-rejection-cooldown"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time before re-offering job to contractor who rejected it
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('auto-assignment', {})}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-auto-assignment"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Auto-Assignment Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surge Rules Configuration */}
        <TabsContent value="surge">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Pricing & Surge Configuration</CardTitle>
                <CardDescription>Configure surge pricing rules and demand-based multipliers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Surge Pricing</Label>
                    <Switch
                      defaultChecked={true}
                      data-testid="switch-surge-enabled"
                    />
                  </div>
                </div>

                {/* Time-Based Surge Rules */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Time-Based Surge Rules</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time Period</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Multiplier</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Rush Hour Morning</TableCell>
                        <TableCell>Mon-Fri</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="1.3" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Rush Hour Evening</TableCell>
                        <TableCell>Mon-Fri</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="1.5" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Weekend Peak</TableCell>
                        <TableCell>Sat-Sun</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="1.2" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Time-Based Rule
                  </Button>
                </div>

                {/* Demand-Based Surge */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Demand-Based Surge</h3>
                  <div className="space-y-2">
                    <Label>Auto-Surge Threshold (active jobs per contractor): 3</Label>
                    <Slider
                      defaultValue={[3]}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      data-testid="slider-surge-threshold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Surge Multiplier: 2.5x</Label>
                    <Slider
                      defaultValue={[2.5]}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full"
                      data-testid="slider-max-surge"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Surge Ramp-Up Speed</Label>
                    <Select defaultValue="moderate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (5% per 10 min)</SelectItem>
                        <SelectItem value="moderate">Moderate (10% per 10 min)</SelectItem>
                        <SelectItem value="fast">Fast (20% per 10 min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service-Specific Overrides */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service-Specific Surge Limits</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Max Surge</TableHead>
                        <TableHead>Surge Exempt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Emergency Repair</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="3.0" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={false} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>PM Service</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="1.5" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Truck Wash</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="1.0" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSaveSettings('surge', {})}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-surge"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Surge Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contractor Management Configuration */}
        <TabsContent value="contractors">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Management Configuration</CardTitle>
                <CardDescription>Configure contractor tiers, rating criteria, and availability rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Performance Tiers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Performance Tiers</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier Name</TableHead>
                        <TableHead>Min Rating</TableHead>
                        <TableHead>Min Jobs</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">Gold</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="4.8" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="100" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="75" className="w-20" />%
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Highest</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-400">Silver</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="4.5" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="50" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="70" className="w-20" />%
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">High</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-600">Bronze</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="4.0" className="w-20" step="0.1" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="10" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="65" className="w-20" />%
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Standard</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Performance Tier
                  </Button>
                </div>

                {/* Rating Criteria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rating Criteria Weights</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Customer Rating Weight: 40%</Label>
                      <Slider
                        defaultValue={[40]}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>On-Time Arrival Weight: 25%</Label>
                      <Slider
                        defaultValue={[25]}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Completion Rate: 20%</Label>
                      <Slider
                        defaultValue={[20]}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Response Time Weight: 15%</Label>
                      <Slider
                        defaultValue={[15]}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Rules */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Availability Rules</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Maximum Simultaneous Jobs</Label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Break Between Jobs (minutes)</Label>
                      <Input type="number" defaultValue="15" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Daily Hours</Label>
                      <Input type="number" defaultValue="12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Weekly Hours</Label>
                      <Input type="number" defaultValue="60" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked={true} />
                    <Label>Enforce Department of Transportation (DOT) Hours of Service Rules</Label>
                  </div>
                </div>

                {/* Contractor Penalties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Penalty Configuration</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Violation Type</TableHead>
                        <TableHead>Penalty Points</TableHead>
                        <TableHead>Suspension Threshold</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>No-Show</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="10" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="30" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Late Arrival (&gt;15 min)</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="5" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="50" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Customer Complaint</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="7" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="40" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Switch defaultChecked={true} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSaveSettings('contractors', {})}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-contractors"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Contractor Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Templates */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>Customize SMS and Email notification templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Categories */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Template Category:</Label>
                    <Select defaultValue="job-assignment">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job-assignment">Job Assignment</SelectItem>
                        <SelectItem value="customer-updates">Customer Updates</SelectItem>
                        <SelectItem value="payment">Payment Notifications</SelectItem>
                        <SelectItem value="contractor">Contractor Alerts</SelectItem>
                        <SelectItem value="fleet">Fleet Communications</SelectItem>
                        <SelectItem value="emergency">Emergency Alerts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* SMS Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">SMS Templates</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Job Assignment - Customer</Label>
                      <Textarea
                        defaultValue="Your TruckFixGo technician {{contractor_name}} is on the way! ETA: {{eta_time}}. Track: {{tracking_link}}"
                        className="min-h-[80px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Variables: {'{{contractor_name}}'}, {'{{eta_time}}'}, {'{{tracking_link}}'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Job Assignment - Contractor</Label>
                      <Textarea
                        defaultValue="New job assigned! {{service_type}} at {{location}}. Customer: {{customer_name}}. Accept: {{accept_link}}"
                        className="min-h-[80px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Variables: {'{{service_type}}'}, {'{{location}}'}, {'{{customer_name}}'}, {'{{accept_link}}'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Confirmation</Label>
                      <Textarea
                        defaultValue="Payment of ${{amount}} received for job #{{job_id}}. Thank you for using TruckFixGo!"
                        className="min-h-[80px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Variables: {'{{amount}}'}, {'{{job_id}}'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Templates</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Subject - Job Completion</Label>
                      <Input
                        defaultValue="Your TruckFixGo Service is Complete - Job #{{job_id}}"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body - Job Completion</Label>
                      <Textarea
                        defaultValue={`Dear {{customer_name}},

Your {{service_type}} service has been completed successfully.

Job Details:
- Service: {{service_type}}
- Date: {{job_date}}
- Technician: {{contractor_name}}
- Total Cost: ${'{{total_amount}}'}

View your invoice: {{invoice_link}}

Thank you for choosing TruckFixGo!

Best regards,
The TruckFixGo Team`}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Timing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Timing</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Send contractor arrival notification (minutes before)</Label>
                      <Input type="number" defaultValue="15" />
                    </div>
                    <div className="space-y-2">
                      <Label>Send job reminder (hours before)</Label>
                      <Input type="number" defaultValue="2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Send review request (hours after)</Label>
                      <Input type="number" defaultValue="24" />
                    </div>
                    <div className="space-y-2">
                      <Label>Send payment reminder (days after)</Label>
                      <Input type="number" defaultValue="3" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Templates
                  </Button>
                  <Button 
                    onClick={() => handleSaveSettings('notifications', {})}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-notifications"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fleet Account Policies */}
        <TabsContent value="fleet">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Account Policies</CardTitle>
                <CardDescription>Configure commercial account billing and credit policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Tiers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fleet Account Tiers</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead>Monthly Volume</TableHead>
                        <TableHead>Credit Limit</TableHead>
                        <TableHead>Payment Terms</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Badge className="bg-purple-500">Enterprise</Badge>
                        </TableCell>
                        <TableCell>$50,000+</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="100000" className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Select defaultValue="net-60">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="net-15">NET 15</SelectItem>
                              <SelectItem value="net-30">NET 30</SelectItem>
                              <SelectItem value="net-45">NET 45</SelectItem>
                              <SelectItem value="net-60">NET 60</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="15" className="w-16" />%
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge className="bg-blue-500">Corporate</Badge>
                        </TableCell>
                        <TableCell>$20,000-$50,000</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="50000" className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Select defaultValue="net-30">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="net-15">NET 15</SelectItem>
                              <SelectItem value="net-30">NET 30</SelectItem>
                              <SelectItem value="net-45">NET 45</SelectItem>
                              <SelectItem value="net-60">NET 60</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="10" className="w-16" />%
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge>Standard</Badge>
                        </TableCell>
                        <TableCell>Up to $20,000</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="20000" className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Select defaultValue="net-15">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="net-15">NET 15</SelectItem>
                              <SelectItem value="net-30">NET 30</SelectItem>
                              <SelectItem value="net-45">NET 45</SelectItem>
                              <SelectItem value="net-60">NET 60</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" defaultValue="5" className="w-16" />%
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* EFS/Comdata Integration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fuel Card Integration</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">EFS Configuration</h4>
                      <div className="space-y-2">
                        <Label>EFS Merchant ID</Label>
                        <Input type="password" placeholder="Enter merchant ID" />
                      </div>
                      <div className="space-y-2">
                        <Label>EFS API Key</Label>
                        <Input type="password" placeholder="Enter API key" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={false} />
                        <Label>Enable EFS Payments</Label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Comdata Configuration</h4>
                      <div className="space-y-2">
                        <Label>Comdata Customer ID</Label>
                        <Input type="password" placeholder="Enter customer ID" />
                      </div>
                      <div className="space-y-2">
                        <Label>Comdata API Secret</Label>
                        <Input type="password" placeholder="Enter API secret" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={false} />
                        <Label>Enable Comdata Payments</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Cycles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Billing Cycle Configuration</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Default Billing Cycle</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Generation Day</Label>
                      <Select defaultValue="1">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st of Month</SelectItem>
                          <SelectItem value="15">15th of Month</SelectItem>
                          <SelectItem value="last">Last Day of Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Late Payment Fee (%)</Label>
                      <Input type="number" defaultValue="1.5" step="0.1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Grace Period (days)</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                </div>

                {/* Credit Policies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Credit Policies</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Require Credit Check for New Fleet Accounts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Auto-Suspend on Credit Limit Exceed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={false} />
                      <Label>Allow Temporary Credit Limit Increase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Send Credit Limit Warnings at 80%</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSaveSettings('fleet', {})}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-fleet"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Fleet Policies
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring & Compliance */}
        <TabsContent value="monitoring">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring & Compliance Settings</CardTitle>
                <CardDescription>Configure system monitoring, audit logs, and compliance reporting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* System Monitoring */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">System Monitoring</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enable Performance Monitoring</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enable Error Tracking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enable API Usage Monitoring</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enable Database Performance Monitoring</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Threshold - Response Time (ms)</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Threshold - Error Rate (%)</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Audit Log Configuration</h3>
                  <div className="space-y-2">
                    <Label>Log Retention Period</Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="730">2 Years</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Events to Log</Label>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>User Login/Logout</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>Payment Transactions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>Settings Changes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>User Profile Changes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>Job Status Changes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>Contractor Actions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={false} />
                        <Label>API Calls (Verbose)</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Reporting */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Compliance Reporting</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Report Generation Schedule</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Report Recipients</Label>
                      <Input placeholder="compliance@company.com, admin@company.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Compliance Standards</Label>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>DOT Compliance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>PCI DSS (Payment Card Industry)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={true} />
                        <Label>GDPR (General Data Protection)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked={false} />
                        <Label>HIPAA (Health Information)</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Privacy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Privacy & Security</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Data Encryption Standard</Label>
                      <Select defaultValue="aes-256">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aes-128">AES-128</SelectItem>
                          <SelectItem value="aes-256">AES-256</SelectItem>
                          <SelectItem value="rsa-2048">RSA-2048</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password Expiry (days)</Label>
                      <Input type="number" defaultValue="90" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Login Attempts</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enforce Two-Factor Authentication</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Anonymize User Data in Logs</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked={true} />
                      <Label>Enable Data Export Restrictions</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Run Security Audit
                  </Button>
                  <Button 
                    onClick={() => handleSaveSettings('monitoring', {})}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-monitoring"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Monitoring Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}