import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Zap } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.emailOrUsername.includes('@') ? formData.emailOrUsername : `${formData.emailOrUsername}@temp.com`,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Login failed",
            description: error.message || "Invalid credentials",
            variant: "destructive",
          });
        } else if (data.user) {
          toast({
            title: "Success",
            description: "Logged in successfully!",
          });
          window.location.href = "/";
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              first_name: formData.firstName,
              last_name: formData.lastName,
            },
          },
        });

        if (error) {
          toast({
            title: "Registration failed",
            description: error.message || "Could not create account",
            variant: "destructive",
          });
        } else if (data.user) {
          toast({
            title: "Success",
            description: "Account created! Please check your email to verify your account.",
          });
          window.location.href = "/";
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">2Mins Challenge</h1>
          </div>
          <p className="text-muted-foreground">
            Build better habits, one 2-minute challenge at a time
          </p>
        </div>

        <Card data-testid="card-auth">
          <CardHeader>
            <CardTitle data-testid="text-auth-title">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription data-testid="text-auth-description">
              {isLogin
                ? "Sign in to continue your wellness journey"
                : "Start your wellness journey today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="emailOrUsername">Email or Username</Label>
                    <Input
                      id="emailOrUsername"
                      data-testid="input-email-or-username"
                      type="text"
                      placeholder="Enter your email or username"
                      value={formData.emailOrUsername}
                      onChange={(e) =>
                        setFormData({ ...formData, emailOrUsername: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        data-testid="input-first-name"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        data-testid="input-last-name"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      data-testid="input-username"
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Password</Label>
                    <Input
                      id="registerPassword"
                      data-testid="input-register-password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="button-submit-auth"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
                data-testid="button-toggle-auth-mode"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
