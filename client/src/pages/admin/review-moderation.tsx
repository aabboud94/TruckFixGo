import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RatingDisplay } from "@/components/rating-display";
import { ReviewItem } from "@/components/review-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Flag,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  User,
  TrendingUp,
  AlertOctagon,
  FileWarning,
  Gavel,
  Bot,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";

interface FlaggedReview {
  id: string;
  review: any;
  flagCount: number;
  flagReasons: string[];
  flaggedBy: string[];
  firstFlaggedAt: Date;
  moderationStatus: "pending" | "approved" | "rejected" | "escalated";
  moderatorNotes?: string;
  autoFlagged: boolean;
  riskScore: number;
}

interface ModerationStats {
  pendingReviews: number;
  flaggedReviews: number;
  escalatedReviews: number;
  approvedToday: number;
  rejectedToday: number;
  averageResponseTime: string;
  falsePositiveRate: number;
  spamDetected: number;
}

const riskLevels = {
  low: { label: "Low Risk", color: "text-green-600", bgColor: "bg-green-50" },
  medium: { label: "Medium Risk", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  high: { label: "High Risk", color: "text-red-600", bgColor: "bg-red-50" },
  critical: { label: "Critical", color: "text-purple-600", bgColor: "bg-purple-50" }
};

export default function ReviewModeration() {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<FlaggedReview | null>(null);
  const [moderationAction, setModerationAction] = useState<string>("");
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Fetch moderation queue
  const { data: moderationData, isLoading } = useQuery<{
    queue: FlaggedReview[];
    stats: ModerationStats;
  }>({
    queryKey: ["/api/admin/reviews/moderation", filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/admin/reviews/moderation?status=${filterStatus}`);
      if (!response.ok) throw new Error("Failed to fetch moderation queue");
      return response.json();
    }
  });
  
  // Moderate review mutation
  const moderateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, action, notes }: {
      reviewId: string;
      action: "approve" | "reject" | "escalate";
      notes?: string;
    }) => {
      return apiRequest(`/api/reviews/${reviewId}/moderate`, "PATCH", {
        status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated",
        moderatorNotes: notes
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Review Moderated",
        description: `Review has been ${variables.action}d successfully`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/moderation"] });
      setSelectedReview(null);
      setModeratorNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Moderation Failed",
        description: error.message || "Failed to moderate review",
        variant: "destructive"
      });
    }
  });
  
  // Bulk moderation mutation
  const bulkModerateMutation = useMutation({
    mutationFn: async ({ reviewIds, action }: {
      reviewIds: string[];
      action: "approve" | "reject";
    }) => {
      return apiRequest("/api/admin/reviews/bulk-moderate", "POST", {
        reviewIds,
        action
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Bulk Moderation Complete",
        description: `${variables.reviewIds.length} reviews ${variables.action}ed`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/moderation"] });
    }
  });
  
  const getRiskLevel = (score: number) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };
  
  const handleModerateReview = (review: FlaggedReview, action: "approve" | "reject" | "escalate") => {
    setSelectedReview(review);
    setModerationAction(action);
    setShowDetailsDialog(true);
  };
  
  const submitModeration = () => {
    if (selectedReview && moderationAction) {
      moderateReviewMutation.mutate({
        reviewId: selectedReview.id,
        action: moderationAction as "approve" | "reject" | "escalate",
        notes: moderatorNotes
      });
      setShowDetailsDialog(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  const queue = moderationData?.queue || [];
  const stats = moderationData?.stats;
  
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <p className="text-muted-foreground">
          Manage flagged reviews and maintain content quality
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting moderation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flaggedReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              New flags today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageResponseTime || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              Average moderation time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.falsePositiveRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Auto-flag accuracy
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews by content, user, or contractor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-reviews"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="auto-flagged">Auto-flagged</SelectItem>
                <SelectItem value="spam">Spam Detected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Moderation Queue */}
      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">
            Moderation Queue
            {stats?.pendingReviews && stats.pendingReviews > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingReviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auto-flagged">Auto-flagged</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="space-y-4">
          {queue.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Queue is Clear!</h3>
                <p className="text-muted-foreground">
                  No reviews require moderation at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {queue.map((item) => {
                  const riskLevel = getRiskLevel(item.riskScore);
                  const risk = riskLevels[riskLevel];
                  
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <div className={`h-1 ${
                        riskLevel === 'critical' ? 'bg-purple-600' :
                        riskLevel === 'high' ? 'bg-red-600' :
                        riskLevel === 'medium' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`} />
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {item.review.isAnonymous ? "Anonymous" : item.review.customerName}
                                </h4>
                                <Badge className={`${risk.bgColor} ${risk.color} border-0`}>
                                  {risk.label} • {item.riskScore}%
                                </Badge>
                                {item.autoFlagged && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Bot className="h-3 w-3" />
                                    Auto-flagged
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Flagged {formatDistanceToNow(new Date(item.firstFlaggedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleModerateReview(item, "approve")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleModerateReview(item, "reject")}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleModerateReview(item, "escalate")}>
                                <AlertOctagon className="h-4 w-4 mr-2" />
                                Escalate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contact User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Review Content */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <RatingDisplay
                              rating={item.review.overallRating}
                              totalReviews={0}
                              size="sm"
                              showCount={false}
                            />
                            <span className="text-sm text-muted-foreground">
                              for {item.review.contractorName}
                            </span>
                          </div>
                          
                          {item.review.reviewTitle && (
                            <h5 className="font-medium">{item.review.reviewTitle}</h5>
                          )}
                          
                          <p className="text-sm">{item.review.reviewText}</p>
                          
                          {/* Flag Reasons */}
                          <div className="flex flex-wrap gap-2">
                            {item.flagReasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="gap-1">
                                <FileWarning className="h-3 w-3" />
                                {reason}
                              </Badge>
                            ))}
                            <Badge variant="outline">
                              Flagged {item.flagCount} times
                            </Badge>
                          </div>
                          
                          {/* Detection Details */}
                          {item.autoFlagged && (
                            <Card className="bg-muted/50">
                              <CardContent className="p-3">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Bot className="h-4 w-4" />
                                  Automated Detection
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Profanity Score:</span>
                                    <span className="ml-1 font-medium">
                                      {item.review.profanityScore || 0}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Spam Probability:</span>
                                    <span className="ml-1 font-medium">
                                      {item.review.spamScore || 0}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Velocity Check:</span>
                                    <span className="ml-1 font-medium">
                                      {item.review.velocityFlag ? "Failed" : "Passed"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Pattern Match:</span>
                                    <span className="ml-1 font-medium">
                                      {item.review.patternMatch || "None"}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleModerateReview(item, "approve")}
                              data-testid={`button-approve-${item.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleModerateReview(item, "reject")}
                              data-testid={`button-reject-${item.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerateReview(item, "escalate")}
                              data-testid={`button-escalate-${item.id}`}
                            >
                              <AlertOctagon className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        <TabsContent value="auto-flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-flagged Reviews</CardTitle>
              <CardDescription>
                Reviews automatically flagged by our detection systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Auto-flagged review queue implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="escalated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalated Reviews</CardTitle>
              <CardDescription>
                Reviews requiring senior moderator attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Escalated review queue implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation History</CardTitle>
              <CardDescription>
                Previously moderated reviews and actions taken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Moderation history implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Moderation Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderate Review</DialogTitle>
            <DialogDescription>
              Review the content and provide moderation notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <ReviewItem
                  review={selectedReview.review}
                  isAdmin={true}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Moderation Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about your moderation decision..."
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitModeration}>
                  Confirm {moderationAction}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}