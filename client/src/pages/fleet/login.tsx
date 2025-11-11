import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function FleetLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Make actual API call to login endpoint
      const result = await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        password: data.password
      });
      
      // Check user role and redirect accordingly
      if (result.user && result.user.role) {
        const userRole = result.user.role;
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.firstName || result.user.email}!`
        });
        
        // Redirect based on role
        switch (userRole) {
          case "admin":
            // Admins should go to admin dashboard
            setLocation("/admin");
            break;
          case "fleet_manager":
            // Fleet managers go to fleet dashboard
            setLocation("/fleet/dashboard");
            break;
          case "contractor":
            // Contractors go to contractor dashboard
            setLocation("/contractor/dashboard");
            break;
          case "driver":
            // Drivers go to homepage or driver dashboard
            setLocation("/");
            break;
          default:
            // Default to fleet dashboard for fleet login page
            setLocation("/fleet/dashboard");
        }
      } else {
        // If no role returned, default to fleet dashboard
        toast({
          title: "Login Successful",
          description: "Welcome back to TruckFixGo"
        });
        setLocation("/fleet/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password. Please try again.";
      
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/fleet")}
                data-testid="button-back-to-fleet"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold text-primary">TruckFixGo Fleet</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Fleet Account Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your fleet dashboard
            </CardDescription>
          </CardHeader>
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
                          placeholder="fleet@company.com"
                          disabled={isLoading}
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
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <a href="#" className="text-primary hover:underline" data-testid="link-forgot-password">
                    Forgot password?
                  </a>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
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
            <div className="text-center text-sm">
              <p className="text-muted-foreground mb-2">
                Don't have a fleet account?
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/fleet/register")}
                data-testid="button-create-account"
              >
                Create Fleet Account
              </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground">
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