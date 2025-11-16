import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Target, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Activity,
  Zap,
  Award,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface AssignmentScore {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  score: number;
  factors: {
    proximityScore: number;
    availabilityScore: number;
    ratingScore: number;
    specializationScore: number;
    performanceScore: number;
    workloadScore: number;
    preferenceScore: number;
    experienceScore: number;
  };
  recommendation: string;
  calculatedAt: string;
  wasAssigned: boolean;
}

interface AssignmentEffectiveness {
  period: string;
  metrics: {
    totalAssignments: number;
    successfulAssignments: number;
    failedAssignments: number;
    successRate: number;
    averageScore: number;
  };
  lastUpdated: string;
}

interface Job {
  id: string;
  jobNumber: string;
  serviceType: string;
  locationAddress: string;
  status: string;
  customerId: string;
  contractorId?: string;
  createdAt: string;
}

export default function AIDispatchDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState({
    autoAssignEnabled: true,
    minScoreThreshold: 60,
    progressiveAssignmentEnabled: true,
    maxProgressiveAttempts: 3,
    fallbackToRoundRobin: true,
    learningEnabled: true,
    factorWeights: {
      proximity: 30,
      availability: 15,
      rating: 25,
      specialization: 20,
      performance: 10
    }
  });

  // Fetch assignment effectiveness metrics
  const { data: effectiveness, refetch: refetchEffectiveness } = useQuery({
    queryKey: ['/api/analytics/assignment-effectiveness', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/assignment-effectiveness?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch effectiveness');
      return response.json() as Promise<AssignmentEffectiveness>;
    }
  });

  // Fetch unassigned jobs
  const { data: unassignedJobs } = useQuery({
    queryKey: ['/api/jobs', { status: 'new' }],
    queryFn: async () => {
      const response = await fetch('/api/jobs?status=new', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      return data.jobs as Job[];
    }
  });

  // Fetch assignment scores for selected job
  const { data: assignmentScores } = useQuery({
    queryKey: ['/api/jobs', selectedJob, 'assignment-scores'],
    queryFn: async () => {
      if (!selectedJob) return null;
      const response = await fetch(`/api/jobs/${selectedJob}/assignment-scores`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch scores');
      const data = await response.json();
      return data.scores as AssignmentScore[];
    },
    enabled: !!selectedJob
  });

  // AI assign mutation
  const aiAssignMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest(`/api/jobs/${jobId}/ai-assign`, {
        method: 'POST'
      });
    },
    onSuccess: (data, jobId) => {
      toast({
        title: "AI Assignment Successful",
        description: `Job assigned to contractor with score ${data.score}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/assignment-effectiveness'] });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reassign mutation
  const reassignMutation = useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: string; reason?: string }) => {
      return await apiRequest(`/api/jobs/${jobId}/reassign-ai`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },
    onSuccess: () => {
      toast({
        title: "Reassignment Successful",
        description: "Job has been reassigned to the next best contractor",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Reassignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Prepare chart data
  const scoreDistribution = assignmentScores ? 
    assignmentScores.map(s => ({
      contractor: s.contractorName.split(' ')[0],
      score: s.score,
      rating: s.contractorRating
    })).slice(0, 5) : [];

  const factorBreakdown = assignmentScores && assignmentScores[0] ?
    Object.entries(assignmentScores[0].factors).map(([key, value]) => ({
      factor: key.replace('Score', '').charAt(0).toUpperCase() + key.replace('Score', '').slice(1),
      value: value
    })) : [];

  const effectivenessData = effectiveness ? [
    { name: 'Successful', value: effectiveness.metrics.successfulAssignments, color: '#10b981' },
    { name: 'Failed', value: effectiveness.metrics.failedAssignments, color: '#ef4444' }
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            AI Dispatch Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor and configure intelligent job assignment</p>
        </div>
        <Button
          onClick={() => refetchEffectiveness()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveness?.metrics.successRate.toFixed(1)}%
            </div>
            <Progress value={effectiveness?.metrics.successRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveness?.metrics.totalAssignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">This {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveness?.metrics.averageScore.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Jobs</CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unassignedJobs?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">Live Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="scoring">AI Scoring</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Jobs</CardTitle>
              <CardDescription>Jobs waiting for AI assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unassignedJobs?.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{job.jobNumber}</Badge>
                        <span className="font-medium">{job.serviceType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {job.locationAddress}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Created {new Date(job.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJob(job.id)}
                        data-testid={`button-view-scores-${job.id}`}
                      >
                        View Scores
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => aiAssignMutation.mutate(job.id)}
                        disabled={aiAssignMutation.isPending}
                        data-testid={`button-ai-assign-${job.id}`}
                      >
                        <Brain className="w-3 h-3 mr-1" />
                        AI Assign
                      </Button>
                    </div>
                  </div>
                ))}
                {(!unassignedJobs || unassignedJobs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No unassigned jobs at the moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label>Period:</Label>
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-32" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={effectivenessData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {effectivenessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium">{effectiveness?.metrics.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={effectiveness?.metrics.successRate || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Average AI Score</span>
                      <span className="text-sm font-medium">{effectiveness?.metrics.averageScore.toFixed(1)}</span>
                    </div>
                    <Progress value={effectiveness?.metrics.averageScore || 0} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                      <p className="text-lg font-bold">{effectiveness?.metrics.successfulAssignments || 0}</p>
                      <p className="text-xs text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                      <p className="text-lg font-bold">{effectiveness?.metrics.failedAssignments || 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-blue-600 mx-auto" />
                      <p className="text-lg font-bold">{effectiveness?.metrics.totalAssignments || 0}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          {selectedJob && assignmentScores ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>AI Scoring Breakdown</CardTitle>
                  <CardDescription>Contractor scores for selected job</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="contractor" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8b5cf6" name="AI Score" />
                      <Bar dataKey="rating" fill="#fbbf24" name="Rating" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scoring Factor Analysis</CardTitle>
                  <CardDescription>How different factors contribute to the score</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={factorBreakdown}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="factor" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contractor Rankings</CardTitle>
                  <CardDescription>Detailed scoring for each contractor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignmentScores.map((score, index) => (
                      <div key={score.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "outline"}>
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{score.contractorName}</span>
                            {score.wasAssigned && <Badge variant="secondary">Assigned</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Star className="w-3 h-3" />
                              {score.contractorRating.toFixed(1)}
                            </Badge>
                            <Badge variant="outline">
                              {score.contractorCompletedJobs} jobs
                            </Badge>
                            <span className="text-lg font-bold">{score.score.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{score.recommendation}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Proximity:</span>
                            <span className="ml-1 font-medium">{score.factors.proximityScore.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Availability:</span>
                            <span className="ml-1 font-medium">{score.factors.availabilityScore.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rating:</span>
                            <span className="ml-1 font-medium">{score.factors.ratingScore.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Specialization:</span>
                            <span className="ml-1 font-medium">{score.factors.specializationScore.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Select a job from the "Live Assignments" tab to view AI scoring details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Adjust AI dispatch system parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Assignment</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign jobs using AI
                    </p>
                  </div>
                  <Switch
                    checked={aiConfig.autoAssignEnabled}
                    onCheckedChange={(checked) => 
                      setAiConfig(prev => ({ ...prev, autoAssignEnabled: checked }))
                    }
                    data-testid="switch-auto-assign"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Progressive Assignment</Label>
                    <p className="text-sm text-muted-foreground">
                      Try multiple contractors in order of score
                    </p>
                  </div>
                  <Switch
                    checked={aiConfig.progressiveAssignmentEnabled}
                    onCheckedChange={(checked) => 
                      setAiConfig(prev => ({ ...prev, progressiveAssignmentEnabled: checked }))
                    }
                    data-testid="switch-progressive"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fallback to Round-Robin</Label>
                    <p className="text-sm text-muted-foreground">
                      Use round-robin if AI scoring fails
                    </p>
                  </div>
                  <Switch
                    checked={aiConfig.fallbackToRoundRobin}
                    onCheckedChange={(checked) => 
                      setAiConfig(prev => ({ ...prev, fallbackToRoundRobin: checked }))
                    }
                    data-testid="switch-fallback"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Learning Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Learn from assignment outcomes to improve
                    </p>
                  </div>
                  <Switch
                    checked={aiConfig.learningEnabled}
                    onCheckedChange={(checked) => 
                      setAiConfig(prev => ({ ...prev, learningEnabled: checked }))
                    }
                    data-testid="switch-learning"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Minimum Score Threshold</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Minimum AI score required for assignment: {aiConfig.minScoreThreshold}
                  </p>
                  <Slider
                    value={[aiConfig.minScoreThreshold]}
                    onValueChange={([value]) => 
                      setAiConfig(prev => ({ ...prev, minScoreThreshold: value }))
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-min-score"
                  />
                </div>

                <div>
                  <Label>Max Progressive Attempts</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Number of contractors to try: {aiConfig.maxProgressiveAttempts}
                  </p>
                  <Slider
                    value={[aiConfig.maxProgressiveAttempts]}
                    onValueChange={([value]) => 
                      setAiConfig(prev => ({ ...prev, maxProgressiveAttempts: value }))
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    data-testid="slider-max-attempts"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Scoring Factor Weights</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Adjust the importance of different factors in AI scoring
                </p>
                
                {Object.entries(aiConfig.factorWeights).map(([factor, weight]) => (
                  <div key={factor}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize">{factor}</span>
                      <span className="text-sm font-medium">{weight}%</span>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={([value]) => 
                        setAiConfig(prev => ({ 
                          ...prev, 
                          factorWeights: { ...prev.factorWeights, [factor]: value }
                        }))
                      }
                      min={0}
                      max={50}
                      step={5}
                      className="w-full"
                      data-testid={`slider-weight-${factor}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}