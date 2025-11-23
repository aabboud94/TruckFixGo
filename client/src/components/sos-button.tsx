import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Phone, CheckCircle, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface SOSButtonProps {
  jobId?: string;
  className?: string;
  variant?: "default" | "floating";
}

export function SOSButton({ jobId, className, variant = "default" }: SOSButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alertType, setAlertType] = useState<string>("other");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<string>("high");
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  let holdTimer: NodeJS.Timeout | null = null;
  let progressInterval: NodeJS.Timeout | null = null;

  // Get user's location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to get your location. Please enable location services.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Update location periodically when alert is active
  useEffect(() => {
    if (!activeAlertId) return;

    const updateLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          try {
            await apiRequest(`/api/emergency/sos/${activeAlertId}/location`, {
              method: "PATCH",
              body: JSON.stringify({ location: newLocation }),
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        },
        (error) => {
          console.error("Error getting location update:", error);
        },
        { enableHighAccuracy: true }
      );
    };

    const interval = setInterval(updateLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [activeAlertId]);

  const handleMouseDown = () => {
    setIsHolding(true);
    setHoldProgress(0);
    getCurrentLocation();

    let progress = 0;
    progressInterval = setInterval(() => {
      progress += 3.33; // Increase by 3.33% every 100ms for 3 seconds
      setHoldProgress(Math.min(progress, 100));

      if (progress >= 100) {
        if (progressInterval) clearInterval(progressInterval);
        setShowConfirmDialog(true);
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    }, 100);

    holdTimer = setTimeout(() => {
      setIsHolding(false);
    }, 3000);
  };

  const handleMouseUp = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (progressInterval) clearInterval(progressInterval);
    setIsHolding(false);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const handleSendAlert = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Unable to send SOS without your location. Please enable location services.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("/api/emergency/sos", {
        method: "POST",
        body: JSON.stringify({
          location,
          alertType,
          message: message || `Emergency SOS: ${alertType}`,
          severity,
          jobId,
        }),
      });

      if (response.success) {
        setActiveAlertId(response.alert.id);
        setAlertSent(true);
        setShowConfirmDialog(false);
        toast({
          title: "SOS Alert Sent",
          description: "Help is on the way. Stay calm and stay safe.",
        });

        // Keep the success message visible for a while
        setTimeout(() => {
          setAlertSent(false);
          setHoldProgress(0);
        }, 10000);
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      toast({
        title: "Error",
        description: "Failed to send SOS alert. Please try again or call 911.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setHoldProgress(0);
    setAlertType("other");
    setMessage("");
    setSeverity("high");
  };

  if (alertSent) {
    return (
      <div className={cn("relative", className)} data-testid="sos-alert-sent">
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>SOS Alert Sent!</strong>
            <br />
            Help is on the way. Stay safe and keep your phone nearby.
            <br />
            Your location is being shared with responders.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <>
          <div
            className={cn(
              "fixed bottom-6 right-6 z-50",
              className
            )}
            data-testid="sos-button-floating"
          >
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
            className={cn(
              "relative w-20 h-20 rounded-full bg-red-600 hover-elevate active-elevate-2",
              "flex items-center justify-center shadow-lg transition-all",
              "focus:outline-none focus:ring-4 focus:ring-red-300",
              isHolding && "scale-110"
            )}
            data-testid="button-sos-panic"
          >
            <div
              className="absolute inset-0 rounded-full bg-white opacity-30"
              style={{
                clipPath: `polygon(0 100%, 0 ${100 - holdProgress}%, 100% ${100 - holdProgress}%, 100% 100%)`,
              }}
            />
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 text-white mb-1" />
              <span className="text-white text-xs font-bold">SOS</span>
            </div>
          </button>
          {isHolding && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-red-600">
              Hold 3 sec...
            </div>
          )}
        </div>
        {renderConfirmDialog()}
      </>
    );
  }

  return (
    <>
      <div className={cn("relative", className)} data-testid="sos-button-container">
        <Button
          variant="destructive"
          size="lg"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={cn(
            "relative overflow-hidden",
            isHolding && "scale-105"
          )}
          data-testid="button-sos-emergency"
        >
          <div
            className="absolute inset-0 bg-white opacity-30"
            style={{
              width: `${holdProgress}%`,
              transition: "width 100ms linear",
            }}
          />
          <AlertTriangle className="mr-2 h-5 w-5" />
          {isHolding ? `Hold ${Math.ceil((100 - holdProgress) / 33.33)}s...` : "Emergency SOS"}
        </Button>
      </div>
      {renderConfirmDialog()}
    </>
  );

  function renderConfirmDialog() {
    return (
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-sos-confirm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Send Emergency SOS Alert?
            </DialogTitle>
            <DialogDescription>
              This will immediately notify nearby responders, fleet managers, and emergency contacts
              of your location and situation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="text-sm font-medium">Alert Type</label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger data-testid="select-alert-type">
                  <SelectValue placeholder="Select alert type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="accident">Vehicle Accident</SelectItem>
                  <SelectItem value="threat">Security Threat</SelectItem>
                  <SelectItem value="mechanical">Mechanical Breakdown</SelectItem>
                  <SelectItem value="other">Other Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger data-testid="select-severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical - Life Threatening</SelectItem>
                  <SelectItem value="high">High - Immediate Help Needed</SelectItem>
                  <SelectItem value="medium">Medium - Assistance Required</SelectItem>
                  <SelectItem value="low">Low - Non-urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Additional Information</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your emergency situation..."
                className="min-h-20"
                data-testid="textarea-emergency-message"
              />
            </div>

            {location ? (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Location acquired (accuracy: {location.accuracy?.toFixed(0)}m)
                </AlertDescription>
              </Alert>
            ) : locationError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Getting your location...</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSendAlert}
              disabled={isSubmitting || !location}
              data-testid="button-send-alert"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Send SOS Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}