import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RatingDisplay,
  RatingBadge,
  RatingBreakdown,
  PerformanceMetrics,
  RatingSummaryCard
} from "@/components/rating-display";
import { ReviewItem } from "@/components/review-item";
import { Map } from "@/components/map";
import {
  Phone,
  MapPin,
  Clock,
  Shield,
  Award,
  CheckCircle,
  Calendar,
  MessageSquare,
  Camera,
  Truck,
  Wrench,
  Battery,
  Fuel,
  AlertTriangle,
  Settings,
  Star,
  Users,
  Target,
  TrendingUp,
  Share2,
  Bookmark,
  ChevronLeft,
  ExternalLink,
  User
} from "lucide-react";
import { format } from "date-fns";

interface ContractorProfileData {
  contractor: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
    phone: string;
    email: string;
    bio?: string;
    experience: number;
    certifications?: string[];
    languages?: string[];
    profilePhoto?: string;
    performanceTier: "bronze" | "silver" | "gold";
    averageRating: number;
    totalReviews: number;
    totalJobsCompleted: number;
    responseTime: number;
    onTimeRate: number;
    satisfactionScore: number;
    responseRate: number;
    completionRate: number;
    categoryRatings: {
      timeliness: number;
      professionalism: number;
      quality: number;
      value: number;
    };
    serviceArea: {
      center: { lat: number; lng: number };
      radius: number;
    };
    availability: {
      days: string[];
      hours: { start: string; end: string };
      emergency24x7: boolean;
    };
    services: Array<{
      type: string;
      description: string;
      basePrice: number;
      averageTime: number;
    }>;
    portfolioPhotos?: string[];
    badges: string[];
    joinedDate: string;
    lastActive: string;
    isVerified: boolean;
    insuranceVerified: boolean;
    backgroundCheckPassed: boolean;
  };
  reviews: any[];
  ratingDistribution: Record<string, number>;
  stats: {
    monthlyJobs: number;
    repeatCustomers: number;
    avgJobValue: number;
  };
}

const serviceIcons: Record<string, any> = {
  'tire_change': Truck,
  'battery_jumpstart': Battery,
  'fuel_delivery': Fuel,
  'minor_repair': Wrench,
  'brake_service': AlertTriangle,
  'engine_diagnostics': Settings,
  'default': Truck
};

export default function ContractorProfile() {
  const params = useParams();
  const [, navigate] = useLocation();
  const contractorId = params.id;
  const [reviewFilter, setReviewFilter] = useState<string>("recent");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  
  // Fetch contractor profile data
  const { data: profileData, isLoading } = useQuery<ContractorProfileData>({
    queryKey: ["/api/contractors", contractorId, "public"],
    enabled: !!contractorId
  });
  
  // Fetch contractor reviews
  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews/contractor", contractorId, reviewFilter],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/contractor/${contractorId}?sortBy=${reviewFilter}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!contractorId
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Contractor Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This contractor profile doesn't exist or is no longer available.
            </p>
            <Button onClick={() => navigate("/contractors")}>
              Browse Contractors
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { contractor, reviews, ratingDistribution, stats } = profileData;
  const reviewsList = reviewsData?.reviews ?? [];
  const filteredReviews =
    ratingFilter !== null
      ? reviewsList.filter((review: any) => Math.round(review.rating) === ratingFilter)
      : reviewsList;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      
      {/* Profile Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={contractor.profilePhoto} />
                <AvatarFallback className="text-2xl">
                  {contractor.firstName[0]}{contractor.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">
                      {contractor.firstName} {contractor.lastName}
                    </h1>
                    {contractor.isVerified && (
                      <Badge className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    <Badge className={`gap-1 ${
                      contractor.performanceTier === 'gold' ? 'bg-yellow-500' :
                      contractor.performanceTier === 'silver' ? 'bg-gray-400' :
                      'bg-orange-600'
                    } text-white`}>
                      <Award className="h-3 w-3" />
                      {contractor.performanceTier.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground">{contractor.companyName}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <RatingDisplay
                    rating={contractor.averageRating}
                    totalReviews={contractor.totalReviews}
                    size="md"
                  />
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-sm text-muted-foreground">
                    {contractor.totalJobsCompleted} jobs completed
                  </span>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{contractor.responseTime} min response time</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contractor.serviceArea.radius} mile radius</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {format(new Date(contractor.joinedDate), 'MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                size="lg"
                onClick={() => navigate(`/book/${contractorId}`)}
                data-testid="button-book-now"
              >
                Book Service
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = `tel:${contractor.phone}`}
                data-testid="button-call"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t">
            {contractor.insuranceVerified && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Insured
              </Badge>
            )}
            {contractor.backgroundCheckPassed && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Background Checked
              </Badge>
            )}
            {contractor.availability.emergency24x7 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                24/7 Emergency
              </Badge>
            )}
            {contractor.experience >= 5 && (
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                {contractor.experience}+ Years Experience
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Services and Info */}
          <div className="space-y-6">
            {/* Services Offered */}
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contractor.services.map((service, index) => {
                  const Icon = serviceIcons[service.type] || serviceIcons.default;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedService === service.type 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedService(service.type)}
                      data-testid={`service-${service.type}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium">{service.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs">From ${service.basePrice}</span>
                            <span className="text-xs text-muted-foreground">~{service.averageTime} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* About */}
            {contractor.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{contractor.bio}</p>
                  
                  {contractor.certifications && contractor.certifications.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {contractor.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {contractor.languages && contractor.languages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {contractor.languages.map((lang, index) => (
                          <Badge key={index} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {contractor.availability.days.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {contractor.availability.hours.start} - {contractor.availability.hours.end}
                    </span>
                  </div>
                  {contractor.availability.emergency24x7 && (
                    <Badge variant="secondary" className="mt-2">
                      24/7 Emergency Service Available
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Service Area Map */}
            <Card>
              <CardHeader>
                <CardTitle>Service Area</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64">
                  <Map
                    center={contractor.serviceArea.center}
                    markers={[{
                      position: contractor.serviceArea.center,
                      label: contractor.companyName
                    }]}
                    circles={[{
                      center: contractor.serviceArea.center,
                      radius: contractor.serviceArea.radius * 1609.34 // Convert miles to meters
                    }]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Reviews and Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {contractor.onTimeRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">On-time Arrival</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {contractor.satisfactionScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {contractor.responseRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Response Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {contractor.completionRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Reviews Section */}
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Customer Reviews</CardTitle>
                        <div className="flex items-center gap-2">
                          {ratingFilter !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRatingFilter(null)}
                              data-testid="button-clear-rating-filter"
                            >
                              Clear {ratingFilter}-star filter
                            </Button>
                          )}
                          <Select value={reviewFilter} onValueChange={setReviewFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recent">Most Recent</SelectItem>
                              <SelectItem value="highest">Highest Rated</SelectItem>
                              <SelectItem value="lowest">Lowest Rated</SelectItem>
                              <SelectItem value="helpful">Most Helpful</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <RatingBreakdown
                        distribution={ratingDistribution}
                        totalReviews={contractor.totalReviews}
                        categoryAverages={contractor.categoryRatings}
                        selectedRating={ratingFilter}
                        onSelectRating={(rating) =>
                          setRatingFilter(current => (current === rating ? null : rating))
                        }
                      />
                    
                    <Separator />
                    
                      {filteredReviews.length > 0 ? (
                        <ScrollArea className="h-[600px] pr-4">
                          <div className="space-y-4">
                            {filteredReviews.map((review: any) => (
                              <ReviewItem
                                key={review.id}
                                review={review}
                                isContractor={false}
                            />
                          ))}
                        </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>
                            {ratingFilter !== null
                              ? `No ${ratingFilter}-star reviews found.`
                              : "No reviews yet"}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="portfolio" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contractor.portfolioPhotos && contractor.portfolioPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {contractor.portfolioPhotos.map((photo, index) => (
                          <div key={index} className="relative group cursor-pointer">
                            <img
                              src={photo}
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                              onClick={() => window.open(photo, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No portfolio photos available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">Monthly Jobs</h4>
                        </div>
                        <p className="text-2xl font-bold">{stats.monthlyJobs}</p>
                        <p className="text-xs text-muted-foreground">Average per month</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">Repeat Customers</h4>
                        </div>
                        <p className="text-2xl font-bold">{stats.repeatCustomers}%</p>
                        <p className="text-xs text-muted-foreground">Customer retention</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">Avg Job Value</h4>
                        </div>
                        <p className="text-2xl font-bold">${stats.avgJobValue}</p>
                        <p className="text-xs text-muted-foreground">Per service</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Achievements</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {contractor.badges.map((badge, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg border">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-sm">{badge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}