import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Trophy,
  Zap,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
  Info
} from "lucide-react";
import { format, subDays } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar } from "recharts";

interface PerformanceData {
  currentTier: "bronze" | "silver" | "gold";
  tierProgress: {
    currentPoints: number;
    nextTierPoints: number;
    progressPercentage: number;
    daysInTier: number;
    nextTierRequirements: {
      minRating: number;
      minJobs: number;
      maxResponseTime: number;
      completionRate: number;
    };
  };
  metrics: {
    totalJobsCompleted: number;
    weeklyJobsCompleted: number;
    monthlyJobsCompleted: number;
    averageRating: number;
    totalRatings: number;
    averageResponseTime: number;
    onTimeArrivalRate: number;
    completionRate: number;
    customerSatisfaction: number;
    repeatCustomerRate: number;
  };
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  performanceTrends: Array<{
    date: string;
    jobs: number;
    rating: number;
    responseTime: number;
    earnings: number;
  }>;
  recentReviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    review: string;
    date: string;
    jobType: string;
    helpful: number;
    response?: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress?: number;
  }>;
  improvementAreas: Array<{
    area: string;
    score: number;
    suggestion: string;
    impact: "high" | "medium" | "low";
  }>;
  comparisons: {
    vsLastWeek: {
      jobs: number;
      rating: number;
      responseTime: number;
      earnings: number;
    };
    vsOtherContractors: {
      percentile: number;
      betterThan: number;
    };
  };
}

const tierColors = {
  bronze: "#D97706",
  silver: "#6B7280",
  gold: "#F59E0B"
};

const tierIcons = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇"
};

export default function ContractorPerformance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("month");
  const [activeReviewFilter, setActiveReviewFilter] = useState("all");

  // Fetch performance data
  const { data: performanceData, isLoading } = useQuery<PerformanceData>({
    queryKey: ["/api/contractor/performance", timeFilter]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTier = performanceData?.currentTier || "bronze";
  const tierProgress = performanceData?.tierProgress;
  const metrics = performanceData?.metrics;
  const ratingDistribution = performanceData?.ratingDistribution || {};
  const performanceTrends = performanceData?.performanceTrends || [];
  const recentReviews = performanceData?.recentReviews || [];
  const achievements = performanceData?.achievements || [];
  const improvementAreas = performanceData?.improvementAreas || [];
  const comparisons = performanceData?.comparisons;

  const ratingData = Object.entries(ratingDistribution).map(([stars, count]) => ({
    stars: parseInt(stars),
    count,
    percentage: (count / (metrics?.totalRatings || 1)) * 100
  })).reverse();

  const pieData = [
    { name: "On Time", value: metrics?.onTimeArrivalRate || 0, color: "#10b981" },
    { name: "Late", value: 100 - (metrics?.onTimeArrivalRate || 0), color: "#ef4444" }
  ];

  const radialData = [
    {
      name: "Rating",
      value: ((metrics?.averageRating || 0) / 5) * 100,
      fill: "#10b981"
    },
    {
      name: "Response",
      value: Math.max(0, 100 - ((metrics?.averageResponseTime || 0) / 30) * 100),
      fill: "#3b82f6"
    },
    {
      name: "Completion",
      value: metrics?.completionRate || 0,
      fill: "#f59e0b"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Performance Metrics</h1>
              <p className="text-muted-foreground">Track your performance and progress</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32" data-testid="select-time-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => navigate("/contractor/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tier Progress */}
        <Card className="border-2" style={{ borderColor: tierColors[currentTier] }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{tierIcons[currentTier]}</div>
                <div>
                  <CardTitle className="text-2xl">
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Tier
                  </CardTitle>
                  <CardDescription>
                    Member for {tierProgress?.daysInTier || 0} days
                  </CardDescription>
                </div>
              </div>
              <Badge className="text-white" style={{ backgroundColor: tierColors[currentTier] }}>
                <Trophy className="w-3 h-3 mr-1" />
                {tierProgress?.currentPoints || 0} Points
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {currentTier === 'bronze' ? 'Silver' : currentTier === 'silver' ? 'Gold' : 'Platinum'}</span>
                <span className="font-medium">
                  {tierProgress?.currentPoints || 0} / {tierProgress?.nextTierPoints || 100}
                </span>
              </div>
              <Progress 
                value={tierProgress?.progressPercentage || 0} 
                className="h-3"
                data-testid="progress-tier"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Min Rating</p>
                <p className="text-lg font-bold flex items-center gap-1">
                  {tierProgress?.nextTierRequirements?.minRating || 0}
                  <Star className="w-4 h-4 text-yellow-500" />
                </p>
                <p className="text-xs text-muted-foreground">
                  Current: {metrics?.averageRating?.toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Min Jobs</p>
                <p className="text-lg font-bold">{tierProgress?.nextTierRequirements?.minJobs || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {metrics?.monthlyJobsCompleted}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Response Time</p>
                <p className="text-lg font-bold">&lt;{tierProgress?.nextTierRequirements?.maxResponseTime || 0}min</p>
                <p className="text-xs text-muted-foreground">
                  Current: {metrics?.averageResponseTime}min
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-lg font-bold">{tierProgress?.nextTierRequirements?.completionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  Current: {metrics?.completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-jobs-completed">
                {metrics?.totalJobsCompleted || 0}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {comparisons?.vsLastWeek?.jobs && comparisons.vsLastWeek.jobs > 0 ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">{comparisons.vsLastWeek.jobs}%</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">{Math.abs(comparisons?.vsLastWeek?.jobs || 0)}%</span>
                  </>
                )}
                <span className="ml-1">vs last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1" data-testid="text-avg-rating">
                {metrics?.averageRating?.toFixed(1) || "0.0"}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(metrics?.averageRating || 0)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                From {metrics?.totalRatings || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-response-time">
                {metrics?.averageResponseTime || 0} min
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {comparisons?.vsLastWeek?.responseTime && comparisons.vsLastWeek.responseTime < 0 ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Improved {Math.abs(comparisons.vsLastWeek.responseTime)}%</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">Slower {comparisons?.vsLastWeek?.responseTime || 0}%</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Arrival</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-on-time">
                {metrics?.onTimeArrivalRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate: {metrics?.completionRate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Jobs"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ratingData.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium">{item.stars}</span>
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Punctuality</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
              <CardTitle>Contractor Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">
                    Top {comparisons?.vsOtherContractors?.percentile || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Better than {comparisons?.vsOtherContractors?.betterThan || 0}% of contractors
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">{metrics?.customerSatisfaction || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Repeat Customers</span>
                    <span className="font-medium">{metrics?.repeatCustomerRate || 0}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews and Improvements */}
        <Tabs defaultValue="reviews">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews" data-testid="tab-reviews">Customer Reviews</TabsTrigger>
            <TabsTrigger value="improvements" data-testid="tab-improvements">Improvements</TabsTrigger>
            <TabsTrigger value="achievements" data-testid="tab-achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Customer Reviews</CardTitle>
                  <Select value={activeReviewFilter} onValueChange={setActiveReviewFilter}>
                    <SelectTrigger className="w-32" data-testid="select-review-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="positive">Positive (4-5)</SelectItem>
                      <SelectItem value="negative">Negative (1-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {recentReviews
                      .filter(review => {
                        if (activeReviewFilter === "positive") return review.rating >= 4;
                        if (activeReviewFilter === "negative") return review.rating <= 3;
                        return true;
                      })
                      .map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback>
                                    {review.customerName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{review.customerName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {review.jobType} • {format(new Date(review.date), 'PPP')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm mb-3">{review.review}</p>
                            {review.response && (
                              <div className="pl-4 border-l-2 border-muted">
                                <p className="text-xs font-medium mb-1">Your Response:</p>
                                <p className="text-sm text-muted-foreground">{review.response}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({review.helpful})
                              </button>
                              {!review.response && (
                                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                  <MessageSquare className="w-3 h-3" />
                                  Respond
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>
                  Personalized suggestions to boost your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {improvementAreas.map((area, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium">{area.area}</h4>
                        </div>
                        <Badge variant={
                          area.impact === 'high' ? 'destructive' :
                          area.impact === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {area.impact} impact
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={area.score} className="h-2" />
                        <p className="text-sm text-muted-foreground">{area.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Milestones</CardTitle>
                <CardDescription>
                  Track your progress and unlock rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} className={achievement.unlockedAt ? '' : 'opacity-50'}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            {achievement.unlockedAt ? (
                              <p className="text-xs text-green-600 mt-1">
                                Unlocked {format(new Date(achievement.unlockedAt), 'PPP')}
                              </p>
                            ) : achievement.progress !== undefined ? (
                              <div className="mt-2">
                                <Progress value={achievement.progress} className="h-1" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {achievement.progress}% complete
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">Locked</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}