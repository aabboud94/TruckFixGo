import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RatingDisplay } from "@/components/rating-display";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart2,
  Download,
  Filter,
  Calendar,
  ChevronUp,
  ChevronDown,
  Zap
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface PerformanceData {
  overview: {
    averageRating: number;
    totalReviews: number;
    monthlyReviews: number;
    responseRate: number;
    completionRate: number;
    onTimeRate: number;
    satisfactionScore: number;
    npsScore: number;
  };
  ratingTrends: Array<{
    date: string;
    rating: number;
    reviewCount: number;
  }>;
  categoryBreakdown: {
    timeliness: number;
    professionalism: number;
    quality: number;
    value: number;
  };
  serviceTypeRatings: Array<{
    serviceType: string;
    averageRating: number;
    jobCount: number;
  }>;
  topContractors: Array<{
    id: string;
    name: string;
    profilePhoto?: string;
    averageRating: number;
    totalReviews: number;
    tier: string;
    trend: "up" | "down" | "stable";
  }>;
  reviewSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  performanceTiers: {
    gold: number;
    silver: number;
    bronze: number;
  };
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
  responseTimeMetrics: {
    averageResponseTime: number;
    fastestResponseTime: number;
    slowestResponseTime: number;
  };
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  chart1: "#8b5cf6",
  chart2: "#3b82f6",
  chart3: "#10b981",
  chart4: "#f59e0b",
  chart5: "#ef4444"
};

export default function PerformanceMetrics() {
  const [dateRange, setDateRange] = useState("30");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  
  // Fetch performance data
  const { data, isLoading } = useQuery<PerformanceData>({
    queryKey: ["/api/analytics/performance", dateRange, serviceTypeFilter],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/performance?days=${dateRange}&serviceType=${serviceTypeFilter}`
      );
      if (!response.ok) throw new Error("Failed to fetch performance data");
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p>No performance data available</p>
      </div>
    );
  }
  
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Average Rating,Review Count\n"
      + data.ratingTrends.map(row => 
          `${row.date},${row.rating},${row.reviewCount}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `performance_metrics_${dateRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Track contractor ratings, customer satisfaction, and service quality metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageRating.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {data.overview.totalReviews} total reviews
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+0.2 from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.satisfactionScore}%</div>
            <Progress value={data.overview.satisfactionScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Customer satisfaction rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.onTimeRate}%</div>
            <Progress value={data.overview.onTimeRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Arrived within promised time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.npsScore}</div>
            <p className="text-xs text-muted-foreground">
              Net Promoter Score
            </p>
            <Badge className={`mt-2 ${
              data.overview.npsScore >= 50 ? 'bg-green-100 text-green-800' :
              data.overview.npsScore >= 0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {data.overview.npsScore >= 50 ? 'Excellent' :
               data.overview.npsScore >= 0 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Rating Trends</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="services">Service Types</TabsTrigger>
          <TabsTrigger value="contractors">Top Performers</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating Trends Over Time</CardTitle>
              <CardDescription>
                Average rating and review volume trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.ratingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis yAxisId="left" domain={[0, 5]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="rating"
                    stroke={COLORS.chart1}
                    strokeWidth={2}
                    name="Average Rating"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="reviewCount"
                    stroke={COLORS.chart2}
                    strokeWidth={2}
                    name="Review Count"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                Performance across different rating categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={[
                  { category: 'Timeliness', value: data.categoryBreakdown.timeliness },
                  { category: 'Professionalism', value: data.categoryBreakdown.professionalism },
                  { category: 'Quality', value: data.categoryBreakdown.quality },
                  { category: 'Value', value: data.categoryBreakdown.value }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="Average Rating"
                    dataKey="value"
                    stroke={COLORS.chart3}
                    fill={COLORS.chart3}
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                {Object.entries(data.categoryBreakdown).map(([category, rating]) => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <RatingDisplay
                        rating={rating}
                        size="sm"
                        showCount={false}
                        totalReviews={data.overview.totalReviews}
                      />
                    </div>
                    <div className="text-2xl font-bold">{rating.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ratings by Service Type</CardTitle>
              <CardDescription>
                Average rating comparison across different services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.serviceTypeRatings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="serviceType"
                    tickFormatter={(value) => value.replace(/_/g, ' ')}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="averageRating" fill={COLORS.chart4} />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="space-y-2 mt-4">
                {data.serviceTypeRatings.map(service => (
                  <div key={service.serviceType} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {service.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <Badge variant="outline">{service.jobCount} jobs</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingDisplay
                        rating={service.averageRating}
                        size="sm"
                        showCount={false}
                        totalReviews={service.jobCount}
                      />
                      <span className="text-sm font-semibold">{service.averageRating.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contractors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Contractors</CardTitle>
              <CardDescription>
                Contractors with highest ratings this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topContractors.map((contractor, index) => (
                  <div key={contractor.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={contractor.profilePhoto} />
                      <AvatarFallback>
                        {contractor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{contractor.name}</h4>
                      <div className="flex items-center gap-3">
                        <RatingDisplay
                          rating={contractor.averageRating}
                          totalReviews={contractor.totalReviews}
                          size="sm"
                        />
                        <Badge className={`gap-1 ${
                          contractor.tier === 'gold' ? 'bg-yellow-500' :
                          contractor.tier === 'silver' ? 'bg-gray-400' :
                          'bg-orange-600'
                        } text-white`}>
                          {contractor.tier.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {contractor.trend === 'up' && (
                        <>
                          <ChevronUp className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Trending Up</span>
                        </>
                      )}
                      {contractor.trend === 'down' && (
                        <>
                          <ChevronDown className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600">Trending Down</span>
                        </>
                      )}
                      {contractor.trend === 'stable' && (
                        <span className="text-xs text-muted-foreground">Stable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Tiers Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Tier Distribution</CardTitle>
              <CardDescription>
                Number of contractors in each performance tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Gold', value: data.performanceTiers.gold, color: '#fbbf24' },
                      { name: 'Silver', value: data.performanceTiers.silver, color: '#9ca3af' },
                      { name: 'Bronze', value: data.performanceTiers.bronze, color: '#fb923c' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { color: '#fbbf24' },
                      { color: '#9ca3af' },
                      { color: '#fb923c' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Sentiment Analysis</CardTitle>
              <CardDescription>
                Distribution of review sentiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive', value: data.reviewSentiment.positive, color: COLORS.chart3 },
                      { name: 'Neutral', value: data.reviewSentiment.neutral, color: COLORS.chart4 },
                      { name: 'Negative', value: data.reviewSentiment.negative, color: COLORS.chart5 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { color: COLORS.chart3 },
                      { color: COLORS.chart4 },
                      { color: COLORS.chart5 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.reviewSentiment.positive}%
                  </div>
                  <p className="text-sm text-muted-foreground">Positive</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.reviewSentiment.neutral}%
                  </div>
                  <p className="text-sm text-muted-foreground">Neutral</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.reviewSentiment.negative}%
                  </div>
                  <p className="text-sm text-muted-foreground">Negative</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Retention</CardTitle>
              <CardDescription>
                New vs returning customer analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">New Customers</h4>
                  </div>
                  <p className="text-2xl font-bold">{data.customerRetention.newCustomers}</p>
                  <p className="text-xs text-muted-foreground">This period</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Returning</h4>
                  </div>
                  <p className="text-2xl font-bold">{data.customerRetention.returningCustomers}</p>
                  <p className="text-xs text-muted-foreground">Repeat customers</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Retention Rate</h4>
                  </div>
                  <p className="text-2xl font-bold">{data.customerRetention.retentionRate}%</p>
                  <Progress value={data.customerRetention.retentionRate} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            AI-powered recommendations to improve ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Strength: High On-Time Rate</h4>
                <p className="text-sm text-green-700">
                  Your contractors maintain a {data.overview.onTimeRate}% on-time arrival rate. 
                  This is 12% above industry average. Continue prioritizing punctuality.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Opportunity: Value Perception</h4>
                <p className="text-sm text-yellow-700">
                  Value ratings ({data.categoryBreakdown.value.toFixed(1)}) lag behind other categories. 
                  Consider transparent pricing, offering loyalty discounts, or highlighting cost savings.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Recommendation: Response Rate</h4>
                <p className="text-sm text-blue-700">
                  Contractors responding to reviews see 23% higher repeat bookings. 
                  Encourage contractors to respond within 48 hours of receiving reviews.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
