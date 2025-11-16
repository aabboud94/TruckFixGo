import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Truck, Shield, AlertCircle, Home, TestTube, User, UserCog, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // Check if test mode is enabled
  useEffect(() => {
    const checkTestMode = async () => {
      try {
        const response = await fetch('/api/test-mode');
        const data = await response.json();
        setIsTestMode(data.testMode === true);
      } catch (error) {
        console.error('Failed to check test mode:', error);
      }
    };
    checkTestMode();
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const quickLogin = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Make API call to test quick login endpoint
      const result = await apiRequest("POST", "/api/auth/test-login", {
        email,
        password,
        role
      });
      
      if (result.user && result.user.role) {
        const userName = result.user.firstName || result.user.companyName || result.user.email;
        
        toast({
          title: "Test Login Successful",
          description: `Logged in as ${role}: ${userName}`,
        });
        
        // Redirect based on user role
        switch (result.user.role) {
          case "admin":
          case "system_admin":
            setLocation("/admin");
            break;
          case "fleet_manager":
            setLocation("/fleet/dashboard");
            break;
          case "contractor":
            setLocation("/contractor/dashboard");
            break;
          case "driver":
            setLocation("/");
            break;
          default:
            setLocation("/");
        }
      }
    } catch (error) {
      console.error("Quick login error:", error);
      setLoginError("Quick login failed. Please try manual login.");
      
      toast({
        title: "Quick Login Failed",
        description: "Please ensure test users are created.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Make API call to generic login endpoint
      const result = await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        password: data.password
      });
      
      // Check if login was successful and user has a role
      if (result.user && result.user.role) {
        const userRole = result.user.role;
        const userName = result.user.firstName || result.user.companyName || result.user.email;
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userName}!`
        });
        
        // Redirect based on user role
        switch (userRole) {
          case "admin":
            setLocation("/admin");
            break;
          case "fleet_manager":
            setLocation("/fleet/dashboard");
            break;
          case "contractor":
            setLocation("/contractor/dashboard");
            break;
          case "driver":
            setLocation("/");
            break;
          default:
            // Fallback to homepage if role is unrecognized
            setLocation("/");
        }
      } else {
        // Handle unexpected response structure
        setLoginError("Login successful but unable to determine user role. Please contact support.");
        console.error("Unexpected response structure:", result);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Invalid email or password. Please try again.";
      
      setLoginError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
                  <Shield className="w-3 h-3 text-orange-500" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your TruckFixGo account
            </CardDescription>
          </CardHeader>
          
          {/* Test Mode Quick Login Section */}
          {isTestMode && (
            <CardContent className="pt-0 pb-4">
              <Alert className="bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800">
                <TestTube className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-300">
                  <div className="font-semibold mb-2">Test Mode Active - Quick Login Available</div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => quickLogin("testadmin@example.com", "Test123456!", "admin")}
                      disabled={isLoading}
                      data-testid="button-quick-login-admin"
                    >
                      <UserCog className="w-3 h-3 mr-1" />
                      Admin
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => quickLogin("testcontractor@example.com", "Test123456!", "contractor")}
                      disabled={isLoading}
                      data-testid="button-quick-login-contractor"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Contractor
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => quickLogin("testfleet@example.com", "Test123456!", "fleet_manager")}
                      disabled={isLoading}
                      data-testid="button-quick-login-fleet"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Fleet Manager
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => quickLogin("testdriver@example.com", "Test123456!", "driver")}
                      disabled={isLoading}
                      data-testid="button-quick-login-driver"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Driver
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder=""
                          disabled={isLoading}
                          autoComplete="email"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Enter your password"
                          disabled={isLoading}
                          autoComplete="current-password"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between text-sm">
                  <Link 
                    href="/forgot-password" 
                    className="text-primary hover:underline" 
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            
            {/* Quick Access Sections */}
            <div className="w-full space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-3">
                Need an account?
              </p>
              
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/fleet/register")}
                  disabled={isLoading}
                  data-testid="button-fleet-account"
                >
                  <Truck className="w-4 h-4 mr-2 text-primary" />
                  Create Fleet Account
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/contractor/apply")}
                  disabled={isLoading}
                  data-testid="button-contractor-apply"
                >
                  <Shield className="w-4 h-4 mr-2 text-orange-500" />
                  Apply as Contractor
                </Button>
              </div>
            </div>

            <Separator />
            
            {/* Emergency Booking */}
            <div className="w-full">
              <Button 
                variant="default"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setLocation("/emergency")}
                disabled={isLoading}
                data-testid="button-emergency-booking"
              >
                Need Emergency Repair?
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-2">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}