import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
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
import { 
  Clock, DollarSign, MapPin, Calendar, Gavel, Star, CheckCircle2, 
  XCircle, AlertCircle, Plus, Briefcase, Timer, Users, TrendingUp,
  Camera, Upload, FileText, Award, MessageSquare, Info
} from 'lucide-react';

const createBiddingJobSchema = z.object({
  serviceTypeId: z.string().min(1, 'Please select a service type'),
  description: z.string().min(10, 'Please provide a detailed description'),
  location: z.string().min(1, 'Location is required'),
  locationAddress: z.string().min(1, 'Address is required'),
  scheduledAt: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  vehicleInfo: z.string().min(1, 'Vehicle information is required'),
  // Bidding specific fields
  biddingDuration: z.number().min(30).max(480).default(120),
  maximumBidAmount: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  minimumBidCount: z.number().min(1).max(10).default(3),
  biddingStrategy: z.enum(['lowest_price', 'best_value', 'fastest_completion', 'manual']).default('manual'),
  autoAcceptBids: z.enum(['never', 'lowest', 'lowest_with_rating', 'best_value']).default('never')
});

type CreateBiddingJobForm = z.infer<typeof createBiddingJobSchema>;

function BiddingJobsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('create');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  // Fetch user's bidding jobs
  const { data: biddingJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['/api/jobs', { allowBidding: true }],
    enabled: selectedTab === 'my-jobs'
  });

  // Fetch service types
  const { data: serviceTypes } = useQuery({
    queryKey: ['/api/service-types'],
  });

  // Fetch bids for selected job
  const { data: jobBids, isLoading: loadingBids } = useQuery({
    queryKey: selectedJobId ? [`/api/bids/job/${selectedJobId}`] : null,
    enabled: !!selectedJobId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const form = useForm<CreateBiddingJobForm>({
    resolver: zodResolver(createBiddingJobSchema),
    defaultValues: {
      serviceTypeId: '',
      description: '',
      location: '',
      locationAddress: '',
      priority: 'medium',
      vehicleInfo: '',
      biddingDuration: 120,
      minimumBidCount: 3,
      biddingStrategy: 'manual',
      autoAcceptBids: 'never'
    }
  });

  const createBiddingJobMutation = useMutation({
    mutationFn: (data: CreateBiddingJobForm) => 
      apiRequest('/api/jobs/bidding', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          jobType: 'scheduled',
          allowBidding: true
        })
      }),
    onSuccess: () => {
      toast({
        title: 'Bidding job created',
        description: 'Contractors will be notified to submit their bids.'
      });
      form.reset();
      setSelectedTab('my-jobs');
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create bidding job'
      });
    }
  });

  const acceptBidMutation = useMutation({
    mutationFn: (bidId: string) => 
      apiRequest(`/api/bids/${bidId}/accept`, {
        method: 'PUT'
      }),
    onSuccess: () => {
      toast({
        title: 'Bid accepted',
        description: 'The contractor has been notified and assigned to the job.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bids/job/${selectedJobId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      setAcceptingBidId(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept bid'
      });
      setAcceptingBidId(null);
    }
  });

  const rejectBidMutation = useMutation({
    mutationFn: ({ bidId, reason }: { bidId: string; reason: string }) => 
      apiRequest(`/api/bids/${bidId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      }),
    onSuccess: () => {
      toast({
        title: 'Bid rejected',
        description: 'The contractor has been notified.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bids/job/${selectedJobId}`] });
    }
  });

  const handleSubmit = (data: CreateBiddingJobForm) => {
    createBiddingJobMutation.mutate(data);
  };

  const formatTimeRemaining = (deadline: Date | string) => {
    const timeRemaining = new Date(deadline).getTime() - Date.now();
    if (timeRemaining <= 0) return 'Bidding closed';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bidding System</h1>
        <p className="text-muted-foreground">
          Get competitive pricing from multiple contractors for your scheduled repairs
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Request Bids
          </TabsTrigger>
          <TabsTrigger value="my-jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            My Bidding Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bidding Job</CardTitle>
              <CardDescription>
                Describe your repair needs and let contractors compete for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="serviceTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes?.serviceTypes?.filter((st: any) => !st.emergencyOnly).map((type: any) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
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
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low - Can wait</SelectItem>
                              <SelectItem value="medium">Medium - Soon</SelectItem>
                              <SelectItem value="high">High - Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Information</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., 2020 Freightliner Cascadia"
                              data-testid="input-vehicle-info"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduledAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Schedule (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local"
                              data-testid="input-scheduled-at"
                            />
                          </FormControl>
                          <FormDescription>
                            When you'd prefer the work to be done
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Denver, CO"
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="123 Main St, Denver, CO 80202"
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description of Work Needed</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide detailed description of the repair needed..."
                            className="min-h-[100px]"
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormDescription>
                          The more details you provide, the more accurate bids you'll receive
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Bidding Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="biddingDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bidding Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="30"
                                max="480"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-bidding-duration"
                              />
                            </FormControl>
                            <FormDescription>
                              How long contractors have to submit bids (30-480 min)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minimumBidCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Bids Required</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                max="10"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-min-bids"
                              />
                            </FormControl>
                            <FormDescription>
                              Wait for at least this many bids before choosing
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maximumBidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Acceptable Price (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                step="0.01"
                                placeholder="e.g., 1000.00"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                data-testid="input-max-price"
                              />
                            </FormControl>
                            <FormDescription>
                              Bids above this amount will be automatically rejected
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reservePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reserve Price (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                step="0.01"
                                placeholder="e.g., 500.00"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                data-testid="input-reserve-price"
                              />
                            </FormControl>
                            <FormDescription>
                              Your target price (not shown to contractors)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="biddingStrategy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selection Strategy</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-strategy">
                                  <SelectValue placeholder="How to evaluate bids" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manual">Manual - I'll choose</SelectItem>
                                <SelectItem value="lowest_price">Lowest price wins</SelectItem>
                                <SelectItem value="best_value">Best value (price + rating)</SelectItem>
                                <SelectItem value="fastest_completion">Fastest completion</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoAcceptBids"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-Accept Setting</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-auto-accept">
                                  <SelectValue placeholder="Auto-accept policy" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="never">Never - I'll review all bids</SelectItem>
                                <SelectItem value="lowest">Auto-accept lowest bid</SelectItem>
                                <SelectItem value="lowest_with_rating">Auto-accept lowest with 4+ stars</SelectItem>
                                <SelectItem value="best_value">Auto-accept best value</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createBiddingJobMutation.isPending}
                    data-testid="button-create-bidding-job"
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    {createBiddingJobMutation.isPending ? 'Creating...' : 'Start Bidding Process'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-jobs" className="space-y-4">
          {loadingJobs ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-pulse">Loading your bidding jobs...</div>
              </CardContent>
            </Card>
          ) : biddingJobs?.jobs?.filter((j: any) => j.allowBidding)?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No bidding jobs found</p>
                <Button onClick={() => setSelectedTab('create')} data-testid="button-create-first-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bidding Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Bidding Jobs</h3>
                {biddingJobs?.jobs?.filter((j: any) => j.allowBidding).map((job: any) => (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer transition-colors ${selectedJobId === job.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{job.description.slice(0, 50)}...</CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant={job.status === 'new' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {job.currentBidCount || 0} bids
                          </span>
                          {job.lowestBidAmount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              From ${job.lowestBidAmount}
                            </span>
                          )}
                        </div>
                        {job.biddingDeadline && new Date(job.biddingDeadline) > new Date() ? (
                          <Badge variant="outline" className="text-xs">
                            <Timer className="w-3 h-3 mr-1" />
                            {formatTimeRemaining(job.biddingDeadline)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Bidding closed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedJobId && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bids Received</h3>
                  {loadingBids ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <div className="animate-pulse">Loading bids...</div>
                      </CardContent>
                    </Card>
                  ) : !jobBids?.bids || jobBids.bids.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No bids received yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Contractors will be notified about this opportunity
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4 pr-4">
                        {jobBids.bids.map((bid: any) => (
                          <Card key={bid.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    ${bid.bidAmount}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2 mt-1">
                                    {bid.contractorName || 'Contractor'}
                                    {bid.contractorRating && (
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                        {bid.contractorRating}
                                      </span>
                                    )}
                                  </CardDescription>
                                </div>
                                <Badge variant={
                                  bid.status === 'accepted' ? 'default' :
                                  bid.status === 'rejected' ? 'destructive' :
                                  bid.status === 'countered' ? 'outline' :
                                  'secondary'
                                }>
                                  {bid.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Completion time: {bid.estimatedHours || 'N/A'} hours</span>
                              </div>
                              {bid.message && (
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-sm">{bid.message}</p>
                                </div>
                              )}
                              {bid.materialsBreakdown && (
                                <div className="text-sm space-y-1">
                                  <Label>Materials breakdown:</Label>
                                  <p className="text-muted-foreground">{bid.materialsBreakdown}</p>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Submitted {formatDistanceToNow(new Date(bid.createdAt))} ago
                              </div>
                            </CardContent>
                            {bid.status === 'pending' && (
                              <CardFooter className="gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      disabled={acceptingBidId === bid.id}
                                      data-testid={`button-accept-bid-${bid.id}`}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      {acceptingBidId === bid.id ? 'Accepting...' : 'Accept Bid'}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Bid Acceptance</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to accept this bid for ${bid.bidAmount}?
                                        This will assign the job to the contractor and reject all other bids.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button 
                                        variant="outline"
                                        onClick={() => {}}
                                        data-testid="button-cancel-accept"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={() => {
                                          setAcceptingBidId(bid.id);
                                          acceptBidMutation.mutate(bid.id);
                                        }}
                                        data-testid="button-confirm-accept"
                                      >
                                        Confirm Acceptance
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => rejectBidMutation.mutate({ 
                                    bidId: bid.id, 
                                    reason: 'Not selected' 
                                  })}
                                  data-testid={`button-reject-bid-${bid.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  data-testid={`button-message-contractor-${bid.id}`}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message
                                </Button>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BiddingJobsPage;