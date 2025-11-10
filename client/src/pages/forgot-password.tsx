import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Home, Truck, KeyRound } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/forgot-password", {
        email: data.email
      });
      
      // Always show success message for security reasons
      // (don't reveal if email exists in system)
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      
      toast({
        title: "Reset Link Sent",
        description: "If an account exists with that email, a reset link has been sent."
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      
      // Even on error, show the same success message for security
      // unless it's a server error
      if (error instanceof Error && error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "Unable to process your request. Please try again later.",
          variant: "destructive"
        });
      } else {
        // For any other error, still show success for security
        setSubmittedEmail(data.email);
        setIsSuccess(true);
        
        toast({
          title: "Reset Link Sent",
          description: "If an account exists with that email, a reset link has been sent."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
    form.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                <Home className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                TruckFixGo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <KeyRound className="w-3 h-3 text-orange-500" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {isSuccess ? "Check Your Email" : "Forgot Password?"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? `We've sent password reset instructions to ${submittedEmail}`
                : "Enter your email to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSuccess ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-muted-foreground">
                      We'll send you an email with instructions to reset your password. 
                      Make sure to check your spam folder if you don't see it in your inbox.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="your@email.com"
                              disabled={isLoading}
                              autoComplete="email"
                              data-testid="input-email"
                              className="pl-10"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    disabled={isLoading}
                    data-testid="button-submit"
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Email Sent!</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    If an account exists with that email, a reset link has been sent. 
                    Please check your email and follow the instructions to reset your password.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Didn't receive an email?</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes for the email to arrive</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={handleReset}
                    data-testid="button-try-again"
                  >
                    Try Another Email
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            
            <div className="w-full space-y-3">
              <Link href="/login" data-testid="link-back-to-login">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>

            <Separator />
            
            <div className="text-center text-xs text-muted-foreground">
              <p className="mb-2">Need help?</p>
              <Link href="/contact">
                <span className="text-primary hover:underline cursor-pointer">Contact Support</span>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}