import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, DollarSign, MapPin, Calendar, Gavel, Trophy, CheckCircle2, 
  XCircle, AlertCircle, Filter, Briefcase, Timer, Users, TrendingUp,
  Target, Settings, Info, BarChart3, FileText, Award, Activity,
  Eye, EyeOff, Shield, RefreshCw, ArrowUpRight, ArrowDownRight, Ban
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const biddingConfigSchema = z.object({
  defaultBiddingDuration: z.number().min(30).max(480),
  minimumBidCount: z.number().min(1).max(20),
  maxBidsPerContractor: z.number().min(1).max(10),
  antiSnipingExtension: z.number().min(0).max(30),
  platformFeePercent: z.number().min(0).max(50),
  minBidIncrement: z.number().min(0),
  bidRetractionPeriod: z.number().min(0).max(60),
  autoAcceptEnabled: z.boolean(),
  requireDeposit: z.boolean(),
  depositPercent: z.number().min(0).max(100),
  cooldownPeriod: z.number().min(0).max(1440)
});

type BiddingConfig = z.infer<typeof biddingConfigSchema>;

function AdminBiddingPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Fetch bidding jobs
  const { data: biddingJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['/api/jobs', { allowBidding: true }],
    enabled: selectedTab === 'active-jobs'
  });

  // Fetch bidding configuration
  const { data: biddingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['/api/bidding-config']
  });

  // Fetch bid analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/bid-analytics', dateRange],
    enabled: selectedTab === 'analytics'
  });

  const configForm = useForm<BiddingConfig>({
    resolver: zodResolver(biddingConfigSchema),
    defaultValues: biddingConfig?.config || {
      defaultBiddingDuration: 120,
      minimumBidCount: 3,
      maxBidsPerContractor: 1,
      antiSnipingExtension: 10,
      platformFeePercent: 10,
      minBidIncrement: 5,
      bidRetractionPeriod: 30,
      autoAcceptEnabled: false,
      requireDeposit: false,
      depositPercent: 10,
      cooldownPeriod: 60
    }
  });

  // Update bidding configuration
  const updateConfigMutation = useMutation({
    mutationFn: (data: BiddingConfig) =>
      apiRequest('/api/bidding-config', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: 'Configuration updated',
        description: 'Bidding configuration has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bidding-config'] });
    }
  });

  // Override bid selection
  const overrideBidMutation = useMutation({
    mutationFn: ({ jobId, bidId }: { jobId: string; bidId: string }) =>
      apiRequest(`/api/bids/${bidId}/accept`, {
        method: 'PUT',
        body: JSON.stringify({ override: true })
      }),
    onSuccess: () => {
      toast({
        title: 'Bid overridden',
        description: 'The bid has been manually accepted.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    }
  });

  // Cancel bidding on a job
  const cancelBiddingMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiRequest(`/api/jobs/${jobId}/cancel-bidding`, {
        method: 'PUT'
      }),
    onSuccess: () => {
      toast({
        title: 'Bidding cancelled',
        description: 'Bidding has been cancelled for this job.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    }
  });

  const handleConfigSubmit = (data: BiddingConfig) => {
    updateConfigMutation.mutate(data);
  };

  // Calculate bidding metrics
  const calculateMetrics = () => {
    if (!analytics?.analytics) return null;

    const { averageBidAmount, totalBids, acceptanceRate, averageTimeToFirstBid } = analytics.analytics;

    return {
      avgBidAmount: averageBidAmount || 0,
      totalBids: totalBids || 0,
      acceptanceRate: acceptanceRate || 0,
      avgTimeToFirstBid: averageTimeToFirstBid || 0
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data
  const bidTrendData = analytics?.analytics?.bidTrends || [];
  const serviceTypeData = analytics?.analytics?.byServiceType || [];
  const contractorPerformanceData = analytics?.analytics?.contractorPerformance || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bidding Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage the bidding system
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bidding Jobs</p>
                <p className="text-2xl font-bold">
                  {biddingJobs?.jobs?.filter((j: any) => j.allowBidding && j.status === 'new').length || 0}
                </p>
              </div>
              <Gavel className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bids Today</p>
                <p className="text-2xl font-bold">{metrics?.totalBids || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Bid Amount</p>
                <p className="text-2xl font-bold">${metrics?.avgBidAmount.toFixed(2) || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold">{metrics?.acceptanceRate.toFixed(1) || 0}%</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="active-jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            Active Jobs
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bidding Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bidding Activity</CardTitle>
                <CardDescription>Latest bids across all jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {/* This would be populated with recent bid data */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Live bidding activity will appear here
                      </AlertDescription>
                    </Alert>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Bidding system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket Connections</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notification Service</span>
                  <Badge variant="default">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-Accept Engine</span>
                  <Badge variant={biddingConfig?.config?.autoAcceptEnabled ? 'default' : 'secondary'}>
                    {biddingConfig?.config?.autoAcceptEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform Fee</span>
                  <span className="font-medium">{biddingConfig?.config?.platformFeePercent || 10}%</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Bidding Rooms</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Connected Contractors</span>
                    <span className="font-medium">87</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Bids</span>
                    <span className="font-medium">34</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col" data-testid="button-refresh-cache">
                  <RefreshCw className="h-5 w-5 mb-2" />
                  <span className="text-xs">Refresh Cache</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" data-testid="button-export-data">
                  <FileText className="h-5 w-5 mb-2" />
                  <span className="text-xs">Export Data</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" data-testid="button-clear-expired">
                  <Ban className="h-5 w-5 mb-2" />
                  <span className="text-xs">Clear Expired</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" data-testid="button-run-analytics">
                  <BarChart3 className="h-5 w-5 mb-2" />
                  <span className="text-xs">Run Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-jobs" className="space-y-4">
          {loadingJobs ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-pulse">Loading active bidding jobs...</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {biddingJobs?.jobs?.filter((j: any) => j.allowBidding).map((job: any) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {job.jobNumber} - {job.description.slice(0, 50)}...
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {job.scheduledAt ? format(new Date(job.scheduledAt), 'MMM dd, HH:mm') : 'Flexible'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {job.currentBidCount || 0} bids
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={job.status === 'new' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        {job.biddingDeadline && new Date(job.biddingDeadline) > new Date() ? (
                          <Badge variant="outline">
                            <Timer className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(job.biddingDeadline))} left
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs">Customer</Label>
                        <p className="font-medium">{job.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Lowest Bid</Label>
                        <p className="font-medium">
                          {job.lowestBidAmount ? `$${job.lowestBidAmount}` : 'No bids'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Average Bid</Label>
                        <p className="font-medium">
                          {job.averageBidAmount ? `$${job.averageBidAmount}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Reserve Price</Label>
                        <p className="font-medium">
                          {job.reservePrice ? `$${job.reservePrice}` : 'Not set'}
                        </p>
                      </div>
                    </div>

                    {job.currentBidCount > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bid Competition</span>
                          <span>{job.currentBidCount} / {job.minimumBidCount || 3} minimum</span>
                        </div>
                        <Progress 
                          value={Math.min((job.currentBidCount / (job.minimumBidCount || 3)) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowBidDetails(true);
                      }}
                      data-testid={`button-view-bids-${job.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Bids
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => cancelBiddingMutation.mutate(job.id)}
                      disabled={job.status !== 'new'}
                      data-testid={`button-cancel-bidding-${job.id}`}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Cancel Bidding
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-extend-deadline-${job.id}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Extend Deadline
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  data-testid="input-date-from"
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  data-testid="input-date-to"
                />
                <Button variant="outline" data-testid="button-apply-filter">
                  Apply Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bid Trends</CardTitle>
                <CardDescription>Daily bid activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bidTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bids" stroke="#8884d8" />
                    <Line type="monotone" dataKey="accepted" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bids by Service Type</CardTitle>
                <CardDescription>Distribution of bids across services</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Contractors</CardTitle>
                <CardDescription>By bid success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contractorPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="winRate" fill="#8884d8" />
                    <Bar dataKey="totalBids" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Bidding system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Average Time to First Bid</span>
                  <span className="font-medium">{metrics?.avgTimeToFirstBid || 0} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bid Acceptance Rate</span>
                  <span className="font-medium">{metrics?.acceptanceRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Bids per Job</span>
                  <span className="font-medium">4.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Contractor Participation</span>
                  <span className="font-medium">67%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Platform Revenue (MTD)</span>
                  <span className="font-bold text-green-600">$12,450</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bidding System Configuration</CardTitle>
              <CardDescription>
                Configure global bidding rules and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(handleConfigSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={configForm.control}
                      name="defaultBiddingDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Bidding Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-bidding-duration"
                            />
                          </FormControl>
                          <FormDescription>
                            How long bidding stays open by default
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="minimumBidCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Bid Count</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-min-bid-count"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum bids required before acceptance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="platformFeePercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Fee (%)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              step="0.1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-platform-fee"
                            />
                          </FormControl>
                          <FormDescription>
                            Fee charged on successful bids
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="antiSnipingExtension"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anti-Sniping Extension (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-anti-sniping"
                            />
                          </FormControl>
                          <FormDescription>
                            Time added if bid placed in final minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="minBidIncrement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Bid Increment ($)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              step="0.01"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-min-increment"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum amount to underbid current lowest
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="maxBidsPerContractor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Bids per Contractor</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-max-bids"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum bids a contractor can place per job
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="bidRetractionPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bid Retraction Period (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-retraction-period"
                            />
                          </FormControl>
                          <FormDescription>
                            Time allowed to withdraw a bid after submission
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="cooldownPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooldown Period (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-cooldown"
                            />
                          </FormControl>
                          <FormDescription>
                            Wait time between consecutive bids
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    
                    <FormField
                      control={configForm.control}
                      name="autoAcceptEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Auto-Accept Bids
                            </FormLabel>
                            <FormDescription>
                              Automatically accept qualifying bids based on rules
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-auto-accept"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="requireDeposit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Bid Deposit
                            </FormLabel>
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

                    {configForm.watch('requireDeposit') && (
                      <FormField
                        control={configForm.control}
                        name="depositPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Percentage</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="1"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-deposit-percent"
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of bid amount required as deposit
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateConfigMutation.isPending}
                    data-testid="button-save-config"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Bids Dialog */}
      <Dialog open={showBidDetails} onOpenChange={setShowBidDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bid Details for Job {selectedJob?.jobNumber}</DialogTitle>
            <DialogDescription>
              Review and manage bids for this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Bid details would be displayed here */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Bid details and management options will be displayed here
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBiddingPage;