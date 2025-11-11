import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Home, FileText, ArrowRight } from "lucide-react";

export default function FleetApplicationPending() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-full">
              <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Fleet Application Under Review</CardTitle>
          <CardDescription className="text-base mt-2">
            Thank you for applying to join our fleet management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Your fleet application has been successfully submitted and is currently being reviewed by our team.
              We'll notify you via email once your application has been processed.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold">What happens next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">Our team will review your fleet application within 1-2 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">You'll receive an email notification with the decision</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">Once approved, you'll be able to access the fleet dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">You can then add vehicles and manage scheduled maintenance</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Application reference will be sent to your email address
            </p>
            <div className="flex gap-3">
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-home"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}