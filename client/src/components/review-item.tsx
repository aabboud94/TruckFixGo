import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingDisplay } from "./rating-display";
import { useToast } from "@/hooks/use-toast";
import {
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageSquare,
  CheckCircle,
  User,
  Clock,
  Star,
  Users,
  Wrench,
  DollarSign,
  Camera,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Review } from "@shared/schema";

interface ReviewItemProps {
  review: Review & {
    customerName?: string;
    contractorName?: string;
    serviceType?: string;
  };
  isContractor?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onFlagClick?: () => void;
  className?: string;
}

export function ReviewItem({
  review,
  isContractor = false,
  isAdmin = false,
  currentUserId,
  onFlagClick,
  className
}: ReviewItemProps) {
  const { toast } = useToast();
  const [showFullReview, setShowFullReview] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [showImages, setShowImages] = useState(false);
  
  const photos = Array.isArray(review.photoUrls) ? review.photoUrls : 
                 review.photoUrls ? JSON.parse(review.photoUrls as string) : [];
  
  const isOwner = currentUserId === review.customerId;
  
  // Vote helpful mutation
  const voteHelpfulMutation = useMutation({
    mutationFn: async (isHelpful: boolean) => {
      return apiRequest(`/api/reviews/${review.id}/helpful`, "POST", { isHelpful });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Vote recorded",
        description: "Thank you for your feedback"
      });
    }
  });
  
  // Contractor response mutation
  const respondMutation = useMutation({
    mutationFn: async (response: string) => {
      return apiRequest(`/api/reviews/${review.id}/response`, "POST", { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Response posted",
        description: "Your response has been added to the review"
      });
      setIsResponding(false);
      setResponseText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post response",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });
  
  // Flag review mutation
  const flagMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest(`/api/reviews/${review.id}/flag`, "POST", { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review flagged",
        description: "This review has been flagged for moderation"
      });
    }
  });
  
  // Moderate review mutation (admin only)
  const moderateMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      return apiRequest(`/api/reviews/${review.id}/moderate`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review moderated",
        description: `Review has been ${status === 'approved' ? 'approved' : 'rejected'}`
      });
    }
  });
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      timeliness: Clock,
      professionalism: Users,
      quality: Wrench,
      value: DollarSign
    };
    return icons[category] || Star;
  };
  
  const displayName = review.isAnonymous ? "Anonymous" : 
                      review.customerName || "Customer";
  
  const reviewTextTruncated = review.reviewText && review.reviewText.length > 300 
    ? `${review.reviewText.substring(0, 300)}...` 
    : review.reviewText;
    
  const shouldShowReadMore = review.reviewText && review.reviewText.length > 300;
  
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)} data-testid="review-item">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {!review.isAnonymous && (
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
              )}
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{displayName}</h4>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {review.isFlagged && isAdmin && (
                  <Badge variant="destructive" className="gap-1">
                    <Flag className="h-3 w-3" />
                    Flagged
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                {review.isEdited && " (edited)"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <RatingDisplay 
              rating={review.overallRating} 
              totalReviews={0}
              size="sm"
              showCount={false}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-review-menu">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Review
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Review
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isOwner && !isAdmin && (
                  <DropdownMenuItem onClick={() => onFlagClick?.()}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report as Inappropriate
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    {review.moderationStatus !== 'approved' && (
                      <DropdownMenuItem 
                        onClick={() => moderateMutation.mutate('approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {review.moderationStatus !== 'rejected' && (
                      <DropdownMenuItem 
                        onClick={() => moderateMutation.mutate('rejected')}
                        className="text-destructive"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Category ratings */}
        {(review.timelinessRating || review.professionalismRating || 
          review.qualityRating || review.valueRating) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {review.timelinessRating && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Timeliness:</span>
                <RatingDisplay 
                  rating={review.timelinessRating} 
                  totalReviews={0}
                  size="xs"
                  showCount={false}
                />
              </div>
            )}
            {review.professionalismRating && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Professionalism:</span>
                <RatingDisplay 
                  rating={review.professionalismRating} 
                  totalReviews={0}
                  size="xs"
                  showCount={false}
                />
              </div>
            )}
            {review.qualityRating && (
              <div className="flex items-center gap-1">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>Quality:</span>
                <RatingDisplay 
                  rating={review.qualityRating} 
                  totalReviews={0}
                  size="xs"
                  showCount={false}
                />
              </div>
            )}
            {review.valueRating && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Value:</span>
                <RatingDisplay 
                  rating={review.valueRating} 
                  totalReviews={0}
                  size="xs"
                  showCount={false}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Review title */}
        {review.reviewTitle && (
          <h3 className="font-semibold">{review.reviewTitle}</h3>
        )}
        
        {/* Review text */}
        {review.reviewText && (
          <div>
            <p className="text-sm whitespace-pre-wrap">
              {showFullReview ? review.reviewText : reviewTextTruncated}
            </p>
            {shouldShowReadMore && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto mt-1"
                onClick={() => setShowFullReview(!showFullReview)}
                data-testid="button-read-more"
              >
                {showFullReview ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Photos */}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.slice(0, showImages ? undefined : 3).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(photo, '_blank')}
                data-testid={`review-photo-${index}`}
              />
            ))}
            {photos.length > 3 && !showImages && (
              <Button
                variant="outline"
                size="sm"
                className="h-20"
                onClick={() => setShowImages(true)}
                data-testid="button-show-more-photos"
              >
                <Camera className="h-4 w-4 mr-1" />
                +{photos.length - 3} more
              </Button>
            )}
          </div>
        )}
        
        {/* Contractor response */}
        {review.contractorResponse && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 border-l-4 border-primary">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Response from {review.contractorName || "Contractor"}
            </div>
            <p className="text-sm">{review.contractorResponse}</p>
            {review.contractorResponseAt && (
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.contractorResponseAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )}
        
        {/* Add response (contractor only) */}
        {isContractor && !review.contractorResponse && (
          <>
            {!isResponding ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResponding(true)}
                data-testid="button-add-response"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Respond to Review
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write a professional response..."
                  className="min-h-[100px]"
                  maxLength={1000}
                  data-testid="textarea-response"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {responseText.length}/1000
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsResponding(false);
                        setResponseText("");
                      }}
                      data-testid="button-cancel-response"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondMutation.mutate(responseText)}
                      disabled={responseText.length < 10 || respondMutation.isPending}
                      data-testid="button-submit-response"
                    >
                      {respondMutation.isPending ? "Posting..." : "Post Response"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Helpful votes */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Was this review helpful?
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => voteHelpfulMutation.mutate(true)}
                disabled={voteHelpfulMutation.isPending}
                className="gap-1"
                data-testid="button-helpful-yes"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes ({review.helpfulVotes || 0})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => voteHelpfulMutation.mutate(false)}
                disabled={voteHelpfulMutation.isPending}
                className="gap-1"
                data-testid="button-helpful-no"
              >
                <ThumbsDown className="h-4 w-4" />
                No ({review.unhelpfulVotes || 0})
              </Button>
            </div>
          </div>
          
          {review.isFlagged && review.flagReason && isAdmin && (
            <Badge variant="destructive" className="text-xs">
              Flagged: {review.flagReason}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}