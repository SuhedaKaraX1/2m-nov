import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Activity, Brain, BookOpen, DollarSign, Heart, Zap } from "lucide-react";

type ChallengeCategory = "physical" | "mental" | "learning" | "finance" | "relationships";

const categories: { value: ChallengeCategory; label: string; icon: typeof Activity }[] = [
  { value: "physical", label: "Physical", icon: Activity },
  { value: "mental", label: "Mental", icon: Brain },
  { value: "learning", label: "Learning", icon: BookOpen },
  { value: "finance", label: "Finance", icon: DollarSign },
  { value: "relationships", label: "Relationships", icon: Heart },
];

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<{
    preferredCategories: ChallengeCategory[];
    hasMentalHealthConcerns: string;
    mentalHealthDetails: string;
    preferredDays: number[];
  }>({
    preferredCategories: [],
    hasMentalHealthConcerns: "no",
    mentalHealthDetails: "",
    preferredDays: [],
  });

  const toggleCategory = (category: ChallengeCategory) => {
    setPreferences((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter((c) => c !== category)
        : [...prev.preferredCategories, category],
    }));
  };

  const toggleDay = (day: number) => {
    setPreferences((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d) => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  const handleNext = () => {
    if (step === 1 && preferences.preferredCategories.length === 0) {
      toast({
        title: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    // Skip mental health questions if mental category is not selected
    if (step === 1 && !preferences.preferredCategories.includes("mental")) {
      setStep(3);
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (preferences.preferredDays.length === 0) {
      toast({
        title: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/onboarding", preferences);

      if (response.ok) {
        // Invalidate user query to refresh user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.href = "/";
      } else {
        toast({
          title: "Failed to save preferences",
          variant: "destructive",
        });
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
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to 2Mins Challenge</h1>
          </div>
          <p className="text-muted-foreground">
            Let's personalize your experience in just a few steps
          </p>
        </div>

        <Card data-testid="card-onboarding">
          <CardHeader>
            <CardTitle data-testid="text-onboarding-title">
              {step === 1 && "Select Your Challenge Categories"}
              {step === 2 && "Mental Health Assessment"}
              {step === 3 && "Choose Your Challenge Days"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Pick the areas you want to focus on"}
              {step === 2 && "Help us provide better mental wellness challenges"}
              {step === 3 && "When do you prefer to do challenges?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleCategory(value)}
                    className={`p-4 rounded-md border-2 transition-all hover-elevate ${
                      preferences.preferredCategories.includes(value)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-testid={`button-category-${value}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="font-medium">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label>Do you have any mental health concerns we should know about?</Label>
                <RadioGroup
                  value={preferences.hasMentalHealthConcerns}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, hasMentalHealthConcerns: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" data-testid="radio-no-concerns" />
                    <Label htmlFor="no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" data-testid="radio-yes-concerns" />
                    <Label htmlFor="yes">Yes</Label>
                  </div>
                </RadioGroup>

                {preferences.hasMentalHealthConcerns === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="details">
                      Please share any details that would help us provide better challenges
                      (optional)
                    </Label>
                    <Textarea
                      id="details"
                      data-testid="textarea-mental-health-details"
                      placeholder="E.g., anxiety, depression, stress management needs..."
                      value={preferences.mentalHealthDetails}
                      onChange={(e) =>
                        setPreferences({ ...preferences, mentalHealthDetails: e.target.value })
                      }
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This information is private and will only be used to personalize your
                      challenges
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label>Select the days you'd like to receive challenges</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daysOfWeek.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(value)}
                      className={`p-3 rounded-md border-2 transition-all hover-elevate ${
                        preferences.preferredDays.includes(value)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      data-testid={`button-day-${value}`}
                    >
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 3 && !preferences.preferredCategories.includes("mental")) {
                    setStep(1);
                  } else {
                    setStep(step - 1);
                  }
                }}
                disabled={step === 1 || loading}
                data-testid="button-back"
              >
                Back
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} data-testid="button-next">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} data-testid="button-finish">
                  {loading ? "Saving..." : "Finish Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
