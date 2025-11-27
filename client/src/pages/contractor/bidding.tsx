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
import { Slider } from '@/components/ui/slider';
import { 
  Clock, DollarSign, MapPin, Calendar, Gavel, Trophy, CheckCircle2, 
  XCircle, AlertCircle, Filter, Briefcase, Timer, Users, TrendingUp,
  Target, MessageSquare, Info, Calculator, Zap, FileText, ChevronRight,
  Star, Award, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const submitBidSchema = z.object({
  jobId: z.string().min(1),
  bidAmount: z.number().positive('Bid amount must be greater than 0'),
  estimatedHours: z.number().min(1, 'Estimated hours must be at least 1'),
  message: z.string().min(10, 'Please provide a message to the customer').max(1000),
  materialsBreakdown: z.string().optional(),
  includesWarranty: z.boolean().default(false),
  warrantyDetails: z.string().optional()
});

type SubmitBidForm = z.infer<typeof submitBidSchema>;

function ContractorBiddingPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('available');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [filters, setFilters] = useState({
    serviceTypeId: '',
    maxDistance: 50,
    minPrice: 0
  });

  // Fetch available bidding jobs
  const { data: availableJobs, isLoading: loadingJobs } = useQuery<any>({
    queryKey: ['/api/jobs/bidding/available', filters],
    enabled: selectedTab === 'available'
  });

  // Fetch contractor's bids
  const { data: myBids, isLoading: loadingMyBids } = useQuery<any>({
    queryKey: ['/api/bids/my-bids'],
    enabled: selectedTab === 'my-bids'
  });

  // Fetch bid templates
  const { data: bidTemplates } = useQuery<any>({
    queryKey: ['/api/bid-templates']
  });

  // Fetch service types
  const { data: serviceTypes } = useQuery<any>({
    queryKey: ['/api/service-types']
  });

  const form = useForm<SubmitBidForm>({
    resolver: zodResolver(submitBidSchema),
    defaultValues: {
      jobId: '',
      bidAmount: 0,
      estimatedHours: 2,
      message: '',
      materialsBreakdown: '',
      includesWarranty: false,
      warrantyDetails: ''
    }
  });

  const submitBidMutation = useMutation({
    mutationFn: (data: SubmitBidForm) => 
      apiRequest('/api/bids', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: 'Bid submitted',
        description: 'Your bid has been sent to the customer.'
      });
      setShowBidDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/bidding/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bids/my-bids'] });
      setSelectedTab('my-bids');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit bid'
      });
    }
  });

  const withdrawBidMutation = useMutation({
    mutationFn: (bidId: string) => 
      apiRequest(`/api/bids/${bidId}/withdraw`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: 'Bid withdrawn',
        description: 'Your bid has been withdrawn successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bids/my-bids'] });
    }
  });

  const handleSubmitBid = (data: SubmitBidForm) => {
    submitBidMutation.mutate(data);
  };

  const openBidDialog = (job: any) => {
    setSelectedJob(job);
    form.setValue('jobId', job.id);
    // Pre-fill from template if available
    if (bidTemplates?.templates?.length > 0) {
      const relevantTemplate = bidTemplates.templates.find(
        (t: any) => t.serviceTypeId === job.serviceTypeId
      );
      if (relevantTemplate) {
        form.setValue('bidAmount', relevantTemplate.baseBidAmount);
        form.setValue('message', relevantTemplate.message);
      }
    }
    setShowBidDialog(true);
  };

  const calculateSuggestedBid = (job: any) => {
    // Simple algorithm for suggested bid amount
    let baseBid = 100;
    
    if (job.priority === 'high') baseBid *= 1.2;
    if (job.priority === 'low') baseBid *= 0.9;
    
    // Adjust based on current bids
    if (job.lowestBid) {
      baseBid = job.lowestBid * 0.95; // Bid 5% lower than current lowest
    } else if (job.averageBid) {
      baseBid = job.averageBid * 0.9; // Bid 10% lower than average
    }
    
    return Math.round(baseBid);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'countered': return 'outline';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bidding Center</h1>
        <p className="text-muted-foreground">
          Compete for jobs and grow your business
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bids</p>
                <p className="text-2xl font-bold">{myBids?.total || 0}</p>
              </div>
              <Gavel className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Won Bids</p>
                <p className="text-2xl font-bold">
                  {myBids?.bids?.filter((b: any) => b.status === 'accepted').length || 0}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">
                  {myBids?.bids?.length ? 
                    Math.round((myBids.bids.filter((b: any) => b.status === 'accepted').length / myBids.bids.length) * 100) : 0}%
                </p>
              </div>
              <Percent className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Bids</p>
                <p className="text-2xl font-bold">
                  {myBids?.bids?.filter((b: any) => b.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            <Briefcase className="w-4 h-4 mr-2" />
            Available Jobs ({availableJobs?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="my-bids">
            <Gavel className="w-4 h-4 mr-2" />
            My Bids ({myBids?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Service Type</Label>
                  <Select
                    value={filters.serviceTypeId || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        serviceTypeId: value === 'all' ? '' : value
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-filter-service">
                      <SelectValue placeholder="All services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All services</SelectItem>
                      {serviceTypes?.serviceTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Distance (miles)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[filters.maxDistance]}
                      onValueChange={(value) => setFilters({...filters, maxDistance: value[0]})}
                      max={100}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm font-medium">{filters.maxDistance}mi</span>
                  </div>
                </div>
                <div>
                  <Label>Min Price ($)</Label>
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
                    placeholder="0"
                    data-testid="input-filter-min-price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Jobs List */}
          {loadingJobs ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-pulse">Loading available jobs...</div>
              </CardContent>
            </Card>
          ) : !availableJobs?.jobs || availableJobs.jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No available bidding jobs</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for new opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableJobs.jobs.map((job: any) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{job.description}</CardTitle>
                        <CardDescription>
                          <div className="flex flex-wrap gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {job.scheduledAt ? format(new Date(job.scheduledAt), 'MMM dd, HH:mm') : 'Flexible'}
                            </span>
                            {job.vehicleInfo && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {job.vehicleInfo}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={job.priority === 'high' ? 'border-red-500' : ''}>
                          {job.priority} priority
                        </Badge>
                        {job.timeRemaining > 0 && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Timer className="w-3 h-3 mr-1" />
                              {job.timeRemaining < 60 ? `${job.timeRemaining}m` : `${Math.floor(job.timeRemaining / 60)}h ${job.timeRemaining % 60}m`}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-xs">Current Bids</Label>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{job.currentBidCount || 0}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Lowest Bid</Label>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {job.lowestBid ? `$${job.lowestBid}` : 'No bids yet'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Average Bid</Label>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {job.averageBid ? `$${job.averageBid}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bidding Competition Indicator */}
                    {job.currentBidCount > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Competition Level</span>
                          <span>{job.currentBidCount} contractors bidding</span>
                        </div>
                        <Progress 
                          value={Math.min(job.currentBidCount * 20, 100)} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Suggested Bid */}
                    <Alert className="mb-4">
                      <Calculator className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Suggested bid:</strong> ${calculateSuggestedBid(job)} based on current market conditions
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter className="bg-muted/50">
                    <Button 
                      className="w-full"
                      onClick={() => openBidDialog(job)}
                      disabled={job.timeRemaining <= 0}
                      data-testid={`button-place-bid-${job.id}`}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      {job.timeRemaining <= 0 ? 'Bidding Closed' : 'Place Bid'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-bids" className="space-y-4">
          {loadingMyBids ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-pulse">Loading your bids...</div>
              </CardContent>
            </Card>
          ) : !myBids?.bids || myBids.bids.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Gavel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No bids submitted yet</p>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedTab('available')}
                  data-testid="button-browse-jobs"
                >
                  Browse Available Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myBids.bids.map((bid: any) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {bid.job?.description || 'Job Details'}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {bid.job?.location || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {bid.job?.scheduledAt ? format(new Date(bid.job.scheduledAt), 'MMM dd') : 'Flexible'}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(bid.status)}>
                        {bid.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {bid.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {bid.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Your Bid</Label>
                        <p className="font-bold text-lg">${bid.bidAmount}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Estimated Hours</Label>
                        <p className="font-semibold">{bid.estimatedHours} hours</p>
                      </div>
                      <div>
                        <Label className="text-xs">Submitted</Label>
                        <p className="text-sm">{formatDistanceToNow(new Date(bid.createdAt))} ago</p>
                      </div>
                    </div>
                    {bid.message && (
                      <div className="mt-4">
                        <Label className="text-xs">Your Message</Label>
                        <p className="text-sm bg-muted p-2 rounded mt-1">{bid.message}</p>
                      </div>
                    )}
                    {bid.counterAmount && (
                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Customer countered with ${bid.counterAmount}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  {bid.status === 'pending' && (
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => withdrawBidMutation.mutate(bid.id)}
                        disabled={withdrawBidMutation.isPending}
                        data-testid={`button-withdraw-bid-${bid.id}`}
                      >
                        Withdraw Bid
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Provide competitive pricing and details to win this job
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitBid)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bid Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-bid-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        Suggested: ${selectedJob ? calculateSuggestedBid(selectedJob) : '0'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-estimated-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Customer</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Explain why you're the best choice for this job..."
                        className="min-h-[100px]"
                        data-testid="textarea-bid-message"
                      />
                    </FormControl>
                    <FormDescription>
                      Highlight your experience, availability, and value proposition
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialsBreakdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials Breakdown (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="List materials and their costs..."
                        data-testid="textarea-materials"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includesWarranty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1"
                        data-testid="checkbox-warranty"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Warranty</FormLabel>
                      <FormDescription>
                        Offer a warranty to make your bid more attractive
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('includesWarranty') && (
                <FormField
                  control={form.control}
                  name="warrantyDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Details</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="e.g., 90 days parts and labor"
                          data-testid="input-warranty-details"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBidDialog(false)}
                  data-testid="button-cancel-bid"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitBidMutation.isPending}
                  data-testid="button-submit-bid"
                >
                  {submitBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContractorBiddingPage;
