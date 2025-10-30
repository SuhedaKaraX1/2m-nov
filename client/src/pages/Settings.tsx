import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Activity, Brain, BookOpen, DollarSign, Heart } from "lucide-react";

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

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState<{
    preferredCategories: ChallengeCategory[];
    hasMentalHealthConcerns: string;
    mentalHealthDetails: string;
    preferredDays: number[];
  }>({
    preferredCategories: (user?.preferredCategories as ChallengeCategory[]) || [],
    hasMentalHealthConcerns: user?.hasMentalHealthConcerns || "no",
    mentalHealthDetails: user?.mentalHealthDetails || "",
    preferredDays: (user?.preferredDays as number[]) || [],
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

  const handleSave = async () => {
    if (preferences.preferredCategories.length === 0) {
      toast({
        title: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

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
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully",
        });
      } else {
        toast({
          title: "Failed to save settings",
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

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-settings-title">Settings</h1>

      <div className="space-y-6">
        {/* Category Preferences */}
        <Card data-testid="card-category-settings">
          <CardHeader>
            <CardTitle>Challenge Categories</CardTitle>
            <CardDescription>Select the categories you want to focus on</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Mental Health Assessment */}
        {preferences.preferredCategories.includes("mental") && (
          <Card data-testid="card-mental-health-settings">
            <CardHeader>
              <CardTitle>Mental Health</CardTitle>
              <CardDescription>Help us personalize your mental wellness challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Do you have any mental health concerns?</Label>
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
                    Please share any details (optional)
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
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Schedule Preferences */}
        <Card data-testid="card-schedule-settings">
          <CardHeader>
            <CardTitle>Challenge Schedule</CardTitle>
            <CardDescription>Select the days you'd like to receive challenges</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} data-testid="button-save-settings">
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
