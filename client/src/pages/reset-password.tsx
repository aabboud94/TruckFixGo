import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Home, Truck, Shield, KeyRound } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

type TokenStatus = "loading" | "valid" | "invalid" | "success";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [userEmail, setUserEmail] = useState<string>("");
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiRequest("GET", `/api/auth/reset-password/${token}`);
        
        if (response.valid && response.email) {
          setUserEmail(response.email);
          setTokenStatus("valid");
        } else {
          setTokenStatus("invalid");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setTokenStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  // Handle redirect countdown
  useEffect(() => {
    if (redirectCountdown === null) return;

    if (redirectCountdown === 0) {
      setLocation("/login");
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, setLocation]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/auth/reset-password/${token}`, {
        password: data.password
      });
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. Redirecting to login..."
      });
      
      setTokenStatus("success");
      setRedirectCountdown(3);
    } catch (error) {
      console.error("Password reset error:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to reset password. Please try again.";
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(0, localPart.length - visibleChars));
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                <Home className="h-5 w-5" />
              </Button>
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent truncate">
                TruckFixGo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <KeyRound className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-center">
              {tokenStatus === "success" ? "Password Reset Complete" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {tokenStatus === "loading" && "Validating reset link..."}
              {tokenStatus === "valid" && `Enter a new password for ${maskEmail(userEmail)}`}
              {tokenStatus === "invalid" && "Invalid or expired reset link"}
              {tokenStatus === "success" && "Your password has been successfully reset"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Loading State */}
            {tokenStatus === "loading" && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {/* Invalid Token State */}
            {tokenStatus === "invalid" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid Reset Link</AlertTitle>
                  <AlertDescription>
                    This password reset link is invalid or has expired. Please request a new password reset.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation("/login")}
                    data-testid="button-back-to-login"
                  >
                    Back to Login
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => setLocation("/forgot-password")}
                    data-testid="button-request-new-reset"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              </div>
            )}

            {/* Valid Token - Password Reset Form */}
            {tokenStatus === "valid" && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Password Requirements:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3 w-3 ${form.watch("password")?.length >= 8 ? "text-green-500" : "text-muted-foreground"}`} />
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3 w-3 ${/[A-Z]/.test(form.watch("password") || "") ? "text-green-500" : "text-muted-foreground"}`} />
                        One uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3 w-3 ${/[a-z]/.test(form.watch("password") || "") ? "text-green-500" : "text-muted-foreground"}`} />
                        One lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3 w-3 ${/[0-9]/.test(form.watch("password") || "") ? "text-green-500" : "text-muted-foreground"}`} />
                        One number
                      </li>
                    </ul>
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              disabled={isSubmitting}
                              autoComplete="new-password"
                              data-testid="input-new-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isSubmitting}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              disabled={isSubmitting}
                              autoComplete="new-password"
                              data-testid="input-confirm-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={isSubmitting}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                    data-testid="button-reset-password"
                  >
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Success State */}
            {tokenStatus === "success" && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Success!</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Your password has been reset successfully. You can now log in with your new password.
                  </AlertDescription>
                </Alert>
                
                {redirectCountdown !== null && (
                  <p className="text-center text-sm text-muted-foreground">
                    Redirecting to login in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                  </p>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => setLocation("/login")}
                  data-testid="button-go-to-login"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}