import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/quick-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok || response.status === 403) {
        // 403 means admin already exists, which is still a success for us
        setResult({
          success: true,
          message: data.message || 'Admin account is ready!'
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to setup admin account'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error - please check if the server is running'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Account Setup</CardTitle>
          <CardDescription>
            Initialize the TruckFixGo admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">This will create an admin account with:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Email: admin@truckfixgo.com</li>
              <li>• Password: Admin123!</li>
            </ul>
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ Change the password after first login for security
            </p>
          </div>

          {result && (
            <Alert className={result.success ? "border-green-500" : "border-red-500"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSetup}
            disabled={loading}
            className="w-full"
            size="lg"
            data-testid="button-setup-admin"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Setting up..." : "Create Admin Account"}
          </Button>

          {result?.success && (
            <Button 
              variant="outline"
              className="w-full"
              asChild
            >
              <a href="/admin/login" data-testid="link-admin-login">
                Go to Admin Login
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}