import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parseISO, addDays } from "date-fns";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Clock, 
  MapPin, 
  Zap, 
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Settings,
  TestTube,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Upload,
  BarChart,
  Activity,
  Target,
  Percent,
  Hash,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
  Save,
  X,
  Calculator
} from "lucide-react";

// Schema for pricing rule form
const pricingRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ruleType: z.enum(["time_based", "location_based", "urgency_based", "demand_based", "customer_based", "fleet_based"]),
  priority: z.number().min(0).max(1000),
  multiplier: z.number().min(0.1).max(10).optional(),
  fixedAmount: z.number().min(-1000).max(1000).optional(),
  isActive: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  conditions: z.object({
    timeOfDay: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    dayOfWeek: z.array(z.string()).optional(),
    location: z.object({
      type: z.enum(['zone', 'distance', 'state', 'city', 'coordinates']),
      value: z.union([z.string(), z.number(), z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number()
      })])
    }).optional(),
    urgency: z.object({
      type: z.enum(['immediate', 'within_hours', 'scheduled']),
      hours: z.number().optional()
    }).optional(),
    demand: z.object({
      activeJobs: z.number(),
      availableContractors: z.number(),
      surgeZone: z.string().optional()
    }).optional(),
    customerType: z.enum(['new', 'returning', 'vip', 'fleet']).optional(),
    fleetTier: z.enum(['standard', 'silver', 'gold', 'platinum']).optional(),
    serviceType: z.array(z.string()).optional(),
    vehicleCount: z.number().optional(),
    referralCode: z.string().optional(),
    loyaltyPoints: z.number().optional()
  })
});

type PricingRuleFormData = z.infer<typeof pricingRuleSchema>;

// Rule type icons and colors
const ruleTypeConfig = {
  time_based: { icon: Clock, color: "bg-blue-500", label: "Time-Based" },
  location_based: { icon: MapPin, color: "bg-green-500", label: "Location-Based" },
  urgency_based: { icon: Zap, color: "bg-orange-500", label: "Urgency-Based" },
  demand_based: { icon: TrendingUp, color: "bg-red-500", label: "Demand-Based" },
  customer_based: { icon: Users, color: "bg-purple-500", label: "Customer-Based" },
  fleet_based: { icon: Users, color: "bg-indigo-500", label: "Fleet-Based" }
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PricingRulesPage() {
  const { toast } = useToast();
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testScenarios, setTestScenarios] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedTab, setSelectedTab] = useState("active");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [conditionType, setConditionType] = useState<string>("");

  // Fetch pricing rules
  const { data: rulesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/pricing-rules', selectedTab],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/pricing-rules', {
        method: 'GET',
        params: { includeInactive: selectedTab === 'all' }
      });
      return response;
    }
  });

  // Fetch pricing analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/admin/pricing-analytics'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/pricing-analytics', {
        method: 'GET'
      });
      return response;
    }
  });

  // Create pricing rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: PricingRuleFormData) => {
      return apiRequest('/api/admin/pricing-rules', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      setShowCreateDialog(false);
      toast({
        title: "Pricing rule created",
        description: "The pricing rule has been created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating rule",
        description: error.message
      });
    }
  });

  // Update pricing rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PricingRuleFormData> }) => {
      return apiRequest(`/api/admin/pricing-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      setSelectedRule(null);
      toast({
        title: "Pricing rule updated",
        description: "The pricing rule has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating rule",
        description: error.message
      });
    }
  });

  // Delete pricing rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/pricing-rules/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Pricing rule deleted",
        description: "The pricing rule has been deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting rule",
        description: error.message
      });
    }
  });

  // Test pricing rules mutation
  const testRulesMutation = useMutation({
    mutationFn: async (scenarios: any[]) => {
      return apiRequest('/api/admin/pricing-rules/test', {
        method: 'POST',
        body: JSON.stringify({ scenarios })
      });
    },
    onSuccess: (data) => {
      setTestResults(data.results);
      toast({
        title: "Test completed",
        description: `Tested ${data.results.length} scenarios successfully`
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: error.message
      });
    }
  });

  // Initialize default rules
  const initializeRulesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/pricing-rules/initialize', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Default rules created",
        description: "Default pricing rules have been initialized successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: error.message
      });
    }
  });

  // Form for creating/editing rules
  const form = useForm<PricingRuleFormData>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      ruleType: "time_based",
      priority: 50,
      isActive: true,
      conditions: {}
    }
  });

  const onSubmit = (data: PricingRuleFormData) => {
    if (selectedRule) {
      updateRuleMutation.mutate({ id: selectedRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  // Filter and search rules
  const filteredRules = rulesData?.rules?.filter((rule: any) => {
    const matchesType = filterType === "all" || rule.ruleType === filterType;
    const matchesSearch = !searchQuery || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  // Toggle rule active status
  const toggleRuleStatus = (ruleId: string, isActive: boolean) => {
    updateRuleMutation.mutate({
      id: ruleId,
      data: { isActive }
    });
  };

  // Duplicate a rule
  const duplicateRule = (rule: any) => {
    const newRule = {
      ...rule,
      name: `${rule.name} (Copy)`,
      id: undefined
    };
    setSelectedRule(newRule);
    form.reset(newRule);
    setShowCreateDialog(true);
  };

  // Generate sample test scenarios
  const generateTestScenarios = () => {
    const scenarios = [
      {
        name: "Rush Hour Emergency",
        jobType: "emergency",
        serviceTypeId: "emergency-repair",
        location: { lat: 40.7128, lng: -74.0060 },
        scheduledFor: new Date(),
        estimatedDistance: 10,
        estimatedDuration: 60
      },
      {
        name: "Weekend Scheduled Service",
        jobType: "scheduled",
        serviceTypeId: "pm-service",
        location: { lat: 34.0522, lng: -118.2437 },
        scheduledFor: addDays(new Date(), 3), // Saturday
        estimatedDistance: 25,
        estimatedDuration: 120,
        fleetAccountId: "fleet-123"
      },
      {
        name: "Night Remote Emergency",
        jobType: "emergency",
        serviceTypeId: "emergency-repair",
        location: { lat: 41.8781, lng: -87.6298 },
        scheduledFor: new Date(new Date().setHours(23, 0, 0, 0)),
        estimatedDistance: 75,
        estimatedDuration: 90
      },
      {
        name: "First-Time Customer",
        jobType: "scheduled",
        serviceTypeId: "truck-wash",
        location: { lat: 33.4484, lng: -112.0740 },
        scheduledFor: addDays(new Date(), 1),
        estimatedDistance: 15,
        estimatedDuration: 45,
        isFirstTime: true
      }
    ];
    setTestScenarios(scenarios);
  };

  // Run test scenarios
  const runTests = () => {
    setIsTesting(true);
    testRulesMutation.mutate(testScenarios);
    setIsTesting(false);
  };

  // Render condition summary
  const renderConditionSummary = (conditions: any) => {
    const parts = [];
    
    if (conditions.timeOfDay) {
      parts.push(
        <div key="time" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{conditions.timeOfDay.start} - {conditions.timeOfDay.end}</span>
        </div>
      );
    }
    
    if (conditions.dayOfWeek?.length) {
      parts.push(
        <div key="days" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{conditions.dayOfWeek.join(", ")}</span>
        </div>
      );
    }
    
    if (conditions.location) {
      parts.push(
        <div key="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{conditions.location.type}: {
            typeof conditions.location.value === 'object' 
              ? `${conditions.location.value.radius}mi radius`
              : conditions.location.value
          }</span>
        </div>
      );
    }
    
    if (conditions.urgency) {
      parts.push(
        <div key="urgency" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>{conditions.urgency.type}</span>
        </div>
      );
    }
    
    if (conditions.customerType) {
      parts.push(
        <div key="customer" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{conditions.customerType}</span>
        </div>
      );
    }
    
    return parts.length > 0 ? (
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {parts}
      </div>
    ) : (
      <span className="text-sm text-muted-foreground">No conditions set</span>
    );
  };

  // Render pricing impact
  const renderPricingImpact = (rule: any) => {
    if (rule.multiplier) {
      const percentage = (parseFloat(rule.multiplier) - 1) * 100;
      const isIncrease = percentage > 0;
      return (
        <div className="flex items-center gap-2">
          {isIncrease ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
          )}
          <span className={isIncrease ? "text-red-500" : "text-green-500"}>
            {isIncrease ? "+" : ""}{percentage.toFixed(0)}%
          </span>
        </div>
      );
    }
    
    if (rule.fixedAmount) {
      const amount = parseFloat(rule.fixedAmount);
      const isIncrease = amount > 0;
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className={isIncrease ? "text-red-500" : "text-green-500"}>
            {isIncrease ? "+" : ""}${Math.abs(amount).toFixed(0)}
          </span>
        </div>
      );
    }
    
    return null;
  };

  // Condition builder dialog
  const ConditionBuilder = () => {
    const [timeStart, setTimeStart] = useState("06:00");
    const [timeEnd, setTimeEnd] = useState("09:00");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [distanceValue, setDistanceValue] = useState(50);
    const [urgencyType, setUrgencyType] = useState("immediate");
    const [customerType, setCustomerType] = useState("new");

    const addCondition = () => {
      const currentConditions = form.getValues("conditions") || {};
      let newConditions = { ...currentConditions };

      switch (conditionType) {
        case "time":
          newConditions.timeOfDay = { start: timeStart, end: timeEnd };
          break;
        case "days":
          newConditions.dayOfWeek = selectedDays;
          break;
        case "distance":
          newConditions.location = { type: 'distance' as const, value: distanceValue };
          break;
        case "urgency":
          newConditions.urgency = { type: urgencyType as any };
          break;
        case "customer":
          newConditions.customerType = customerType as any;
          break;
      }

      form.setValue("conditions", newConditions);
      setShowConditionBuilder(false);
      setConditionType("");
    };

    return (
      <Dialog open={showConditionBuilder} onOpenChange={setShowConditionBuilder}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Rule Condition</DialogTitle>
            <DialogDescription>
              Configure the conditions that will trigger this pricing rule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!conditionType ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setConditionType("time")}
                  className="flex flex-col items-center gap-2 h-24"
                  data-testid="button-condition-time"
                >
                  <Clock className="h-6 w-6" />
                  <span>Time of Day</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConditionType("days")}
                  className="flex flex-col items-center gap-2 h-24"
                  data-testid="button-condition-days"
                >
                  <Calendar className="h-6 w-6" />
                  <span>Day of Week</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConditionType("distance")}
                  className="flex flex-col items-center gap-2 h-24"
                  data-testid="button-condition-distance"
                >
                  <MapPin className="h-6 w-6" />
                  <span>Distance</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConditionType("urgency")}
                  className="flex flex-col items-center gap-2 h-24"
                  data-testid="button-condition-urgency"
                >
                  <Zap className="h-6 w-6" />
                  <span>Urgency</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConditionType("customer")}
                  className="flex flex-col items-center gap-2 h-24"
                  data-testid="button-condition-customer"
                >
                  <Users className="h-6 w-6" />
                  <span>Customer Type</span>
                </Button>
              </div>
            ) : (
              <>
                {conditionType === "time" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        data-testid="input-time-start"
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        data-testid="input-time-end"
                      />
                    </div>
                  </div>
                )}

                {conditionType === "days" && (
                  <div className="space-y-2">
                    <Label>Select Days</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDays([...selectedDays, day]);
                              } else {
                                setSelectedDays(selectedDays.filter(d => d !== day));
                              }
                            }}
                            className="rounded"
                            data-testid={`checkbox-day-${day.toLowerCase()}`}
                          />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {conditionType === "distance" && (
                  <div className="space-y-4">
                    <Label>Distance from base (miles): {distanceValue}</Label>
                    <Slider
                      value={[distanceValue]}
                      onValueChange={(values) => setDistanceValue(values[0])}
                      min={10}
                      max={200}
                      step={10}
                      data-testid="slider-distance"
                    />
                    <p className="text-sm text-muted-foreground">
                      Apply this rule when service location is more than {distanceValue} miles from base
                    </p>
                  </div>
                )}

                {conditionType === "urgency" && (
                  <div className="space-y-2">
                    <Label>Urgency Type</Label>
                    <Select value={urgencyType} onValueChange={setUrgencyType}>
                      <SelectTrigger data-testid="select-urgency-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (Emergency)</SelectItem>
                        <SelectItem value="within_hours">Within Hours</SelectItem>
                        <SelectItem value="scheduled">Scheduled (24hr+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {conditionType === "customer" && (
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select value={customerType} onValueChange={setCustomerType}>
                      <SelectTrigger data-testid="select-customer-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Customer</SelectItem>
                        <SelectItem value="returning">Returning Customer</SelectItem>
                        <SelectItem value="vip">VIP Customer</SelectItem>
                        <SelectItem value="fleet">Fleet Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {conditionType && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setConditionType("")}
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button onClick={addCondition} data-testid="button-add-condition">
                  Add Condition
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <AdminLayout
      title="Pricing Rules Management"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Pricing Rules" }
      ]}
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">
                  {rulesData?.rules?.filter((r: any) => r.isActive)?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Price Impact</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.analytics?.averagePrice ? 
                    `$${analyticsData.analytics.averagePrice.toFixed(0)}` : 
                    '$0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Surge Frequency</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.analytics?.surgeFrequency ? 
                    `${(analyticsData.analytics.surgeFrequency * 100).toFixed(0)}%` : 
                    '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price Elasticity</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.analytics?.priceElasticity ? 
                    analyticsData.analytics.priceElasticity.toFixed(1) : 
                    '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[300px]"
              data-testid="input-search-rules"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="time_based">Time-Based</SelectItem>
              <SelectItem value="location_based">Location-Based</SelectItem>
              <SelectItem value="urgency_based">Urgency-Based</SelectItem>
              <SelectItem value="demand_based">Demand-Based</SelectItem>
              <SelectItem value="customer_based">Customer-Based</SelectItem>
              <SelectItem value="fleet_based">Fleet-Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            size="icon"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTestDialog(true)}
            data-testid="button-test"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Rules
          </Button>
          {(!rulesData?.rules || rulesData.rules.length === 0) && (
            <Button
              variant="outline"
              onClick={() => initializeRulesMutation.mutate()}
              data-testid="button-initialize"
            >
              <Upload className="h-4 w-4 mr-2" />
              Initialize Defaults
            </Button>
          )}
          <Button
            onClick={() => {
              setSelectedRule(null);
              form.reset();
              setShowCreateDialog(true);
            }}
            data-testid="button-create-rule"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Rules Tabs */}
      <Tabs defaultValue="active" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Rules</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="all">All Rules</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-96">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pricing rules found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first pricing rule or initialize default rules
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedRule(null);
                      form.reset();
                      setShowCreateDialog(true);
                    }}
                    data-testid="button-create-first-rule"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => initializeRulesMutation.mutate()}
                    data-testid="button-initialize-first"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Initialize Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRules.map((rule: any) => {
                const config = ruleTypeConfig[rule.ruleType as keyof typeof ruleTypeConfig];
                const Icon = config?.icon || Settings;

                return (
                  <Card key={rule.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${config?.color || 'bg-gray-500'} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 ${config?.color?.replace('bg-', 'text-') || 'text-gray-500'}`} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{rule.name}</h3>
                              <Badge variant={rule.isActive ? "default" : "secondary"}>
                                {rule.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">{config?.label}</Badge>
                              <Badge variant="outline">Priority: {rule.priority}</Badge>
                            </div>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderPricingImpact(rule)}
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                            data-testid={`switch-rule-${rule.id}`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Conditions Summary */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Conditions</h4>
                          {renderConditionSummary(rule.conditions)}
                        </div>

                        {/* Date Range */}
                        {(rule.startDate || rule.endDate) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {rule.startDate && format(parseISO(rule.startDate), 'MMM d, yyyy')}
                              {rule.startDate && rule.endDate && ' - '}
                              {rule.endDate && format(parseISO(rule.endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRule(rule);
                              form.reset(rule);
                              setShowCreateDialog(true);
                            }}
                            data-testid={`button-edit-${rule.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateRule(rule)}
                            data-testid={`button-duplicate-${rule.id}`}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this rule?')) {
                                deleteRuleMutation.mutate(rule.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-600"
                            data-testid={`button-delete-${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}</DialogTitle>
            <DialogDescription>
              Configure pricing rules to dynamically adjust service prices based on various conditions
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Rush Hour Surcharge" data-testid="input-rule-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe when and why this rule applies"
                          data-testid="textarea-rule-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ruleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-rule-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="time_based">Time-Based</SelectItem>
                            <SelectItem value="location_based">Location-Based</SelectItem>
                            <SelectItem value="urgency_based">Urgency-Based</SelectItem>
                            <SelectItem value="demand_based">Demand-Based</SelectItem>
                            <SelectItem value="customer_based">Customer-Based</SelectItem>
                            <SelectItem value="fleet_based">Fleet-Based</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (0-1000)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-rule-priority"
                          />
                        </FormControl>
                        <FormDescription>Higher priority rules are applied first</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing Impact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing Impact</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiplier</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 1.5 for 50% increase"
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-rule-multiplier"
                          />
                        </FormControl>
                        <FormDescription>1.5 = 50% increase, 0.9 = 10% discount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixed Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 25 for $25 surcharge"
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-rule-fixed-amount"
                          />
                        </FormControl>
                        <FormDescription>Positive for surcharge, negative for discount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Conditions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConditionBuilder(true)}
                    data-testid="button-add-conditions"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {/* Display current conditions */}
                <div className="rounded-lg border p-4">
                  {renderConditionSummary(form.watch("conditions"))}
                </div>
              </div>

              {/* Activation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activation</h3>
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this rule immediately upon saving
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-rule-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            data-testid="input-rule-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            data-testid="input-rule-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  data-testid="button-save-rule"
                >
                  {createRuleMutation.isPending || updateRuleMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {selectedRule ? 'Update Rule' : 'Create Rule'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Test Rules Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Pricing Rules</DialogTitle>
            <DialogDescription>
              Run test scenarios to see how your pricing rules affect different situations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Test Scenarios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Scenarios</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTestScenarios}
                  data-testid="button-generate-scenarios"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Generate Samples
                </Button>
              </div>

              {testScenarios.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No test scenarios configured</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={generateTestScenarios}
                    data-testid="button-generate-first-scenario"
                  >
                    Generate Sample Scenarios
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {testScenarios.map((scenario, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {scenario.jobType} • {scenario.estimatedDistance} miles • {scenario.estimatedDuration} mins
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTestScenarios(testScenarios.filter((_, i) => i !== index));
                        }}
                        data-testid={`button-remove-scenario-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{testScenarios[index]?.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                              ${result.totalAmount.toFixed(2)}
                            </span>
                            {result.confidence && (
                              <Badge variant={
                                result.confidence === 'high' ? 'default' : 
                                result.confidence === 'medium' ? 'secondary' : 
                                'outline'
                              }>
                                {result.confidence} confidence
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>${result.basePrice.toFixed(2)}</span>
                          </div>
                          {result.distanceCharge && (
                            <div className="flex justify-between">
                              <span>Distance Charge:</span>
                              <span>${result.distanceCharge.toFixed(2)}</span>
                            </div>
                          )}
                          {result.timeCharge && (
                            <div className="flex justify-between">
                              <span>Time Charge:</span>
                              <span>${result.timeCharge.toFixed(2)}</span>
                            </div>
                          )}
                          {result.rulesApplied.map((rule: any, i: number) => (
                            <div key={i} className="flex justify-between text-orange-600 dark:text-orange-400">
                              <span>{rule.ruleName}:</span>
                              <span>
                                {rule.impact > 0 ? '+' : ''}${rule.impact.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {result.surgeAmount && (
                            <div className="flex justify-between text-red-600 dark:text-red-400">
                              <span>Surge Pricing:</span>
                              <span>+${result.surgeAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {result.discountAmount && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                              <span>Discounts:</span>
                              <span>-${result.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t">
                            <span>Tax:</span>
                            <span>${result.taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>${result.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTestDialog(false)}
              data-testid="button-close-test"
            >
              Close
            </Button>
            <Button 
              onClick={runTests}
              disabled={isTesting || testScenarios.length === 0}
              data-testid="button-run-tests"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Condition Builder */}
      <ConditionBuilder />
    </AdminLayout>
  );
}