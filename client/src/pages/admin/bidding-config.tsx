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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Clock,
  DollarSign,
  Settings,
  Gavel,
  TrendingUp,
  Target,
  Shield,
  Info,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calculator,
  Users,
  Award
} from "lucide-react";

const biddingConfigSchema = z.object({
  defaultBiddingDuration: z.number().min(30).max(480),
  minimumBidCount: z.number().min(1).max(20),
  maximumBidCount: z.number().min(1).max(50),
  maxBidsPerContractor: z.number().min(1).max(10),
  minBidIncrement: z.number().min(1).max(100),
  maxBidAmount: z.number().min(100).max(10000),
  reservePriceEnabled: z.boolean(),
  defaultReservePrice: z.number().min(0).max(5000),
  biddingStrategy: z.enum(["lowest_price", "best_value", "fastest_completion", "manual"]),
  autoAcceptRules: z.enum(["never", "lowest", "lowest_with_rating", "best_value"]),
  antiSnipingExtension: z.number().min(0).max(30),
  bidRetractionPeriod: z.number().min(0).max(60),
  requireDeposit: z.boolean(),
  depositPercent: z.number().min(0).max(50),
  platformFeePercent: z.number().min(0).max(30),
  cooldownPeriod: z.number().min(0).max(1440),
  allowCounterOffers: z.boolean(),
  maxCounterOffers: z.number().min(1).max(5),
  notifyOnNewBid: z.boolean(),
  notifyOnOutbid: z.boolean(),
  requireApprovalAboveThreshold: z.boolean(),
  approvalThreshold: z.number().min(100).max(5000),
});

type BiddingConfigFormData = z.infer<typeof biddingConfigSchema>;

export default function BiddingConfigPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("general");
  
  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/admin/bidding-config"]
  });
  
  // Form setup
  const form = useForm<BiddingConfigFormData>({
    resolver: zodResolver(biddingConfigSchema),
    defaultValues: config || {
      defaultBiddingDuration: 120,
      minimumBidCount: 3,
      maximumBidCount: 20,
      maxBidsPerContractor: 1,
      minBidIncrement: 5,
      maxBidAmount: 5000,
      reservePriceEnabled: false,
      defaultReservePrice: 0,
      biddingStrategy: "lowest_price",
      autoAcceptRules: "never",
      antiSnipingExtension: 10,
      bidRetractionPeriod: 30,
      requireDeposit: false,
      depositPercent: 10,
      platformFeePercent: 10,
      cooldownPeriod: 60,
      allowCounterOffers: true,
      maxCounterOffers: 3,
      notifyOnNewBid: true,
      notifyOnOutbid: true,
      requireApprovalAboveThreshold: false,
      approvalThreshold: 1000,
    }
  });
  
  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: BiddingConfigFormData) => {
      return apiRequest("PUT", "/api/admin/bidding-config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bidding-config"] });
      toast({
        title: "Configuration saved",
        description: "Bidding configuration has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save configuration",
        description: error.message,
      });
    }
  });
  
  const onSubmit = (data: BiddingConfigFormData) => {
    updateConfigMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Bidding Configuration">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout 
      title="Bidding Configuration"
      breadcrumbs={[{ label: "Settings" }, { label: "Bidding Configuration" }]}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="limits">Limits & Rules</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Bidding Settings</CardTitle>
                  <CardDescription>Configure the basic bidding system parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="defaultBiddingDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Bidding Duration (minutes)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={30}
                            max={480}
                            step={30}
                            className="flex-1"
                            data-testid="slider-bidding-duration"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-bidding-duration"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          {Math.floor(field.value / 60)}h {field.value % 60}m - How long bidding remains open for new jobs
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minimumBidCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Bid Count Required</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-min-bid-count"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum number of bids required before a winner can be selected
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maximumBidCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Bid Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-bid-count"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of bids allowed per job
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxBidsPerContractor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Bids Per Contractor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-bids-per-contractor"
                          />
                        </FormControl>
                        <FormDescription>
                          How many times a single contractor can bid on the same job
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="antiSnipingExtension"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anti-Sniping Extension (minutes)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0}
                            max={30}
                            step={5}
                            className="flex-1"
                            data-testid="slider-anti-sniping"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-anti-sniping"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Extend bidding time if a bid is placed in the last minutes
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bidRetractionPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Retraction Period (minutes)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0}
                            max={60}
                            step={5}
                            className="flex-1"
                            data-testid="slider-retraction-period"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-retraction-period"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Time window during which contractors can retract their bids
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Bidding Strategies */}
            <TabsContent value="strategies">
              <Card>
                <CardHeader>
                  <CardTitle>Bidding Strategies</CardTitle>
                  <CardDescription>Configure how bids are evaluated and accepted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="biddingStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Bidding Strategy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bidding-strategy">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lowest_price">Lowest Price</SelectItem>
                            <SelectItem value="best_value">Best Value (Price + Rating)</SelectItem>
                            <SelectItem value="fastest_completion">Fastest Completion</SelectItem>
                            <SelectItem value="manual">Manual Selection</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How the system evaluates and ranks bids
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="autoAcceptRules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-Acceptance Rules</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-auto-accept">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">Never Auto-Accept</SelectItem>
                            <SelectItem value="lowest">Accept Lowest Bid</SelectItem>
                            <SelectItem value="lowest_with_rating">Accept Lowest with Min Rating</SelectItem>
                            <SelectItem value="best_value">Accept Best Value</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When to automatically accept bids without manual review
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Strategy Impact</AlertTitle>
                    <AlertDescription>
                      The selected strategy affects how contractors compete and how jobs are assigned.
                      "Best Value" considers both price and contractor rating, while "Lowest Price" only looks at cost.
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="allowCounterOffers"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Counter Offers</FormLabel>
                          <FormDescription>
                            Let contractors submit counter offers after initial bidding
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-counter-offers"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("allowCounterOffers") && (
                    <FormField
                      control={form.control}
                      name="maxCounterOffers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Counter Offers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-max-counter-offers"
                            />
                          </FormControl>
                          <FormDescription>
                            How many counter offers each contractor can submit
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Limits & Rules */}
            <TabsContent value="limits">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Limits & Rules</CardTitle>
                  <CardDescription>Set boundaries and constraints for the bidding system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="minBidIncrement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Bid Increment ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-min-bid-increment"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum amount by which a new bid must differ from existing bids
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxBidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Bid Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-bid-amount"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum allowed bid amount for any job
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reservePriceEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Reserve Prices</FormLabel>
                          <FormDescription>
                            Allow setting minimum acceptable prices for jobs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-reserve-price"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("reservePriceEnabled") && (
                    <FormField
                      control={form.control}
                      name="defaultReservePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Reserve Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-default-reserve-price"
                            />
                          </FormControl>
                          <FormDescription>
                            Default minimum price if not specified per job (0 for no default)
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="cooldownPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooldown Period (minutes)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0}
                            max={1440}
                            step={60}
                            className="flex-1"
                            data-testid="slider-cooldown-period"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-cooldown-period"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Time before contractor can bid again after winning a job
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Financial Settings */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription>Configure deposits, fees, and payment rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="requireDeposit"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Require Bid Deposits</FormLabel>
                          <FormDescription>
                            Contractors must place a deposit to bid
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-deposit"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("requireDeposit") && (
                    <FormField
                      control={form.control}
                      name="depositPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Percentage (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={0}
                              max={50}
                              step={5}
                              className="flex-1"
                              data-testid="slider-deposit-percent"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-deposit-percent"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Percentage of bid amount required as deposit
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="platformFeePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Fee (%)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0}
                            max={30}
                            step={1}
                            className="flex-1"
                            data-testid="slider-platform-fee"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-platform-fee"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Platform fee charged on winning bids
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requireApprovalAboveThreshold"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Require Approval for Large Bids</FormLabel>
                          <FormDescription>
                            Manual approval required for bids above threshold
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-approval"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("requireApprovalAboveThreshold") && (
                    <FormField
                      control={form.control}
                      name="approvalThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approval Threshold ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-approval-threshold"
                            />
                          </FormControl>
                          <FormDescription>
                            Bids above this amount require manual approval
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Revenue Impact</AlertTitle>
                    <AlertDescription>
                      Platform fee of {form.watch("platformFeePercent")}% will generate approximately ${(5000 * form.watch("platformFeePercent") / 100).toFixed(0)} per $5,000 job
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure when and how bid notifications are sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="notifyOnNewBid"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Notify on New Bids</FormLabel>
                          <FormDescription>
                            Send notifications when new bids are placed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-notify-new-bid"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notifyOnOutbid"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Notify When Outbid</FormLabel>
                          <FormDescription>
                            Alert contractors when they are outbid
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-notify-outbid"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Notification Channels</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked data-testid="checkbox-email-notifications" />
                          <span>Email Notifications</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked data-testid="checkbox-sms-notifications" />
                          <span>SMS Notifications</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked data-testid="checkbox-push-notifications" />
                          <span>Push Notifications</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked data-testid="checkbox-websocket-notifications" />
                          <span>Real-time WebSocket Updates</span>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              size="lg"
              disabled={updateConfigMutation.isPending}
              data-testid="button-save-bidding-config"
            >
              {updateConfigMutation.isPending ? (
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
        </form>
      </Form>
    </AdminLayout>
  );
}