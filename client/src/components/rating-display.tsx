import { Star, Clock, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  totalReviews: number;
  size?: "xs" | "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function RatingDisplay({
  rating,
  totalReviews,
  size = "md",
  showCount = true,
  className
}: RatingDisplayProps) {
  const sizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };
  
  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };
  
  const roundedRating = Math.round(rating * 10) / 10;
  
  return (
    <div className={cn("flex items-center gap-1", className)} data-testid="rating-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star === Math.ceil(rating) && rating % 1 !== 0
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-300"
          )}
        />
      ))}
      {showCount && (
        <span className={cn("ml-1 text-muted-foreground", textSizes[size])}>
          {roundedRating} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

interface RatingBadgeProps {
  rating: number;
  className?: string;
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  const getVariant = () => {
    if (rating >= 4.5) return "default";
    if (rating >= 3.5) return "secondary";
    return "outline";
  };
  
  const getLabel = () => {
    if (rating >= 4.8) return "Top Rated";
    if (rating >= 4.5) return "Highly Rated";
    if (rating >= 4.0) return "Well Rated";
    return "Average";
  };
  
  return (
    <Badge variant={getVariant()} className={className} data-testid="rating-badge">
      <Star className="h-3 w-3 mr-1 fill-current" />
      {rating.toFixed(1)} • {getLabel()}
    </Badge>
  );
}

interface RatingBreakdownProps {
  distribution: Record<string, number>;
  totalReviews: number;
  categoryAverages?: {
    timeliness: number;
    professionalism: number;
    quality: number;
    value: number;
  };
  onSelectRating?: (rating: number) => void;
  selectedRating?: number | null;
}

export function RatingBreakdown({
  distribution,
  totalReviews,
  categoryAverages,
  onSelectRating,
  selectedRating
}: RatingBreakdownProps) {
  const stars = [5, 4, 3, 2, 1];
  
  return (
    <div className="space-y-4" data-testid="rating-breakdown">
      <div className="space-y-2">
        {stars.map((star) => {
          const count = distribution[star.toString()] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          const isSelected = selectedRating === star;

          return (
            <div key={star} className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 min-w-[60px] text-sm hover:text-primary transition-colors",
                  isSelected && "text-primary font-semibold"
                )}
                data-testid={`filter-${star}-stars`}
                aria-pressed={isSelected}
                onClick={() => onSelectRating?.(star)}
              >
                <span>{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </button>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      
      {categoryAverages && (
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Category Ratings</h4>
          <div className="grid grid-cols-2 gap-3">
            <CategoryRating
              label="Timeliness"
              value={categoryAverages.timeliness}
              icon={Clock}
            />
            <CategoryRating
              label="Professionalism"
              value={categoryAverages.professionalism}
              icon={Users}
            />
            <CategoryRating
              label="Quality"
              value={categoryAverages.quality}
              icon={CheckCircle}
            />
            <CategoryRating
              label="Value"
              value={categoryAverages.value}
              icon={TrendingUp}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryRatingProps {
  label: string;
  value: number;
  icon: React.ElementType;
}

function CategoryRating({ label, value, icon: Icon }: CategoryRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex justify-between text-xs">
          <span>{label}</span>
          <span className="font-medium">{value.toFixed(1)}</span>
        </div>
        <Progress value={value * 20} className="h-1 mt-1" />
      </div>
    </div>
  );
}

interface PerformanceMetricsProps {
  onTimeRate?: number;
  satisfactionScore?: number;
  responseRate?: number;
  completionRate?: number;
  tier?: "bronze" | "silver" | "gold";
}

export function PerformanceMetrics({
  onTimeRate,
  satisfactionScore,
  responseRate,
  completionRate,
  tier
}: PerformanceMetricsProps) {
  const metrics = [
    { label: "On-time", value: onTimeRate, suffix: "%" },
    { label: "Satisfaction", value: satisfactionScore, suffix: "%" },
    { label: "Response Rate", value: responseRate, suffix: "%" },
    { label: "Completion", value: completionRate, suffix: "%" }
  ].filter(m => m.value !== undefined);
  
  const tierColors = {
    bronze: "border-orange-500 bg-orange-50",
    silver: "border-gray-400 bg-gray-50",
    gold: "border-yellow-500 bg-yellow-50"
  };
  
  const tierLabels = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold"
  };
  
  return (
    <div className="space-y-3" data-testid="performance-metrics">
      {tier && (
        <div className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
          tierColors[tier]
        )}>
          {tierLabels[tier]} Tier Contractor
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className="text-2xl font-bold text-primary">
              {metric.value?.toFixed(0)}{metric.suffix}
            </div>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RatingSummaryCardProps {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
  onTimeRate?: number;
  satisfactionScore?: number;
  className?: string;
}

export function RatingSummaryCard({
  averageRating,
  totalReviews,
  distribution,
  onTimeRate,
  satisfactionScore,
  className
}: RatingSummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <RatingDisplay 
            rating={averageRating} 
            totalReviews={totalReviews} 
            size="lg"
            showCount={false}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        {(onTimeRate !== undefined || satisfactionScore !== undefined) && (
          <div className="flex justify-around py-3 border-y">
            {onTimeRate !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold">{onTimeRate}%</div>
                <div className="text-xs text-muted-foreground">On-time</div>
              </div>
            )}
            {satisfactionScore !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold">{satisfactionScore}%</div>
                <div className="text-xs text-muted-foreground">Satisfaction</div>
              </div>
            )}
          </div>
        )}
        
        <RatingBreakdown
          distribution={distribution}
          totalReviews={totalReviews}
        />
      </CardContent>
    </Card>
  );
}