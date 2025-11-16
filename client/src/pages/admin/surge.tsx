import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Zap, TrendingUp, Clock, MapPin, AlertTriangle, BarChart3, 
  Calendar, DollarSign, Info, Loader2, Save, Target, Activity,
  Eye, Plus, X, Edit, Trash2, History, Settings
} from "lucide-react";

// Mock data for historical visualization
const mockHistoricalData = {
  surgeHistory: [
    { date: "Mon", multiplier: 1.2, jobs: 45, revenue: 5400 },
    { date: "Tue", multiplier: 1.5, jobs: 62, revenue: 8200 },
    { date: "Wed", multiplier: 1.3, jobs: 53, revenue: 6500 },
    { date: "Thu", multiplier: 1.8, jobs: 78, revenue: 11200 },
    { date: "Fri", multiplier: 2.0, jobs: 95, revenue: 15800 },
    { date: "Sat", multiplier: 1.6, jobs: 71, revenue: 9800 },
    { date: "Sun", multiplier: 1.4, jobs: 58, revenue: 7200 },
  ],
  zonePerformance: [
    { zone: "Dallas Downtown", activations: 28, avgMultiplier: 1.7, revenue: 4200 },
    { zone: "Fort Worth Airport", activations: 35, avgMultiplier: 1.9, revenue: 5800 },
    { zone: "Houston Port", activations: 21, avgMultiplier: 1.5, revenue: 3100 },
    { zone: "Austin Tech", activations: 18, avgMultiplier: 1.4, revenue: 2600 },
    { zone: "San Antonio", activations: 15, avgMultiplier: 1.3, revenue: 2100 },
  ]
};

export default function AdminSurgePricing() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ surge: data })
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Surge pricing configuration has been updated",
      });
    }
  });
  
  const handleSave = (data: any) => {
    saveMutation.mutate(data);
  };
  
  return (
    <AdminLayout 
      title="Surge Pricing Configuration"
      breadcrumbs={[{ label: "Settings" }, { label: "Surge Pricing" }]}
    >
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Surge</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-bold">1.5x</div>
              <Badge variant="destructive">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">In 3 areas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Demand Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Above threshold</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Time-based surges</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18%</div>
            <p className="text-xs text-muted-foreground">From surge pricing</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="zones">Active Zones</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="schedule">Time Schedule</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Settings</CardTitle>
                <CardDescription>Main surge pricing controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Surge Pricing Enabled</Label>
                  <Switch defaultChecked data-testid="switch-surge-enabled" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Automatic Detection</Label>
                  <Switch defaultChecked data-testid="switch-auto-detection" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Weather-Based Surge</Label>
                  <Switch defaultChecked data-testid="switch-weather-surge" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Notify Customers</Label>
                  <Switch defaultChecked data-testid="switch-notify-customers" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Activity</CardTitle>
                <CardDescription>Real-time surge status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Load</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '75%' }} />
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contractor Availability</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '25%' }} />
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Surge Recommended</AlertTitle>
                    <AlertDescription>
                      High demand detected in 3 zones. Consider activating surge pricing.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Configuration Tab */}
        <TabsContent value="configuration">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Triggers</CardTitle>
                <CardDescription>Conditions that activate surge pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>High Demand Threshold</Label>
                    <Badge variant="outline">1.2x - 2.0x</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Jobs per hour</span>
                      <span>10+ jobs</span>
                    </div>
                    <Slider defaultValue={[10]} max={50} step={5} data-testid="slider-demand-threshold" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Low Contractor Availability</Label>
                    <Badge variant="outline">1.3x - 2.5x</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Available contractors</span>
                      <span>&lt; 5 contractors</span>
                    </div>
                    <Slider defaultValue={[5]} max={20} step={1} data-testid="slider-contractor-threshold" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Weather Events</Label>
                    <Switch defaultChecked data-testid="switch-weather-events" />
                  </div>
                  <Select defaultValue="1.5">
                    <SelectTrigger data-testid="select-weather-multiplier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.2">1.2x multiplier</SelectItem>
                      <SelectItem value="1.5">1.5x multiplier</SelectItem>
                      <SelectItem value="2.0">2.0x multiplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Surge Limits</CardTitle>
                <CardDescription>Maximum surge multipliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="max-surge">Global Maximum</Label>
                    <Input
                      id="max-surge"
                      type="number"
                      defaultValue="3.0"
                      step="0.1"
                      data-testid="input-max-surge"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fleet-max">Fleet Account Maximum</Label>
                    <Input
                      id="fleet-max"
                      type="number"
                      defaultValue="1.5"
                      step="0.1"
                      data-testid="input-fleet-max"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-threshold">Notification Threshold</Label>
                    <Input
                      id="notification-threshold"
                      type="number"
                      defaultValue="1.5"
                      step="0.1"
                      data-testid="input-notification-threshold"
                    />
                  </div>
                </div>
                
                <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm">
                      Surge pricing above 2.0x requires manual approval and sends alerts to all admins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Active Zones Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Active Surge Areas</CardTitle>
              <CardDescription>Real-time surge pricing by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Dallas Downtown", "Fort Worth Airport", "Houston Port"].map((area, index) => (
                  <div key={area} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <Zap className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{area}</p>
                        <p className="text-sm text-muted-foreground">
                          12 jobs waiting • 3 contractors available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{index === 0 ? "1.8x" : "1.5x"}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-override-${area.toLowerCase().replace(' ', '-')}`}
                      >
                        Override
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Button variant="outline" className="w-full" data-testid="button-add-surge-zone">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual Surge Zone
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Historical Data Tab */}
        <TabsContent value="historical">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Surge Activity Over Time</CardTitle>
                <CardDescription>7-day surge multiplier and revenue impact</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockHistoricalData.surgeHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="multiplier" 
                      stroke="#8884d8" 
                      name="Surge Multiplier"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#82ca9d" 
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
                <CardDescription>Surge zone statistics for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockHistoricalData.zonePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="activations" fill="#8884d8" name="Activations" />
                    <Bar dataKey="avgMultiplier" fill="#82ca9d" name="Avg Multiplier" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Surge Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$64,100</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Multiplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.54x</div>
                  <p className="text-xs text-muted-foreground">Across all zones</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Peak Surge Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6-9 PM</div>
                  <p className="text-xs text-muted-foreground">Most active period</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Time Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Time-Based Surge Schedule</CardTitle>
              <CardDescription>Scheduled surge pricing periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekday Rush</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span>6:00 AM - 9:00 AM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surge: </span>
                    <span>1.3x</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Evening Peak</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span>5:00 PM - 8:00 PM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surge: </span>
                    <span>1.5x</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekend Nights</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span>10:00 PM - 2:00 AM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surge: </span>
                    <span>1.8x</span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" data-testid="button-add-time-surge">
                <Plus className="mr-2 h-4 w-4" />
                Add Time Period
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button 
          onClick={() => handleSave({})}
          disabled={saveMutation.isPending}
          data-testid="button-save-surge-config"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}