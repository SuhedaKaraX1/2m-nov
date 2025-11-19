"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  User as UserIcon,
  Mail,
  Globe,
  Shield,
  Bell,
  Palette,
  Camera,
  Save,
  Trash2,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTheme } from "@/contexts/ThemeContext";

type SettingsData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  language: string;
  theme: "system" | "light" | "dark";
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklySummary: boolean;
  profileVisibility: "public" | "friends" | "private";
  dataSharing: boolean;
  profileImageUrl?: string;
  enableNotifications?: boolean;
  challengeScheduleTimes?: string[];
};

const DEFAULTS: SettingsData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  language: "en",
  theme: "system",
  emailNotifications: true,
  pushNotifications: true,
  weeklySummary: true,
  profileVisibility: "friends",
  dataSharing: false,
  profileImageUrl: undefined,
  enableNotifications: false,
  challengeScheduleTimes: [],
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const [form, setForm] = useState<SettingsData>(data ?? DEFAULTS);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SettingsData) => {
      const response = await apiRequest("POST", "/api/settings", payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not save settings",
        variant: "destructive",
      });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (payload: { enableNotifications: boolean; challengeScheduleTimes: string[] }) => {
      const response = await apiRequest("PUT", "/api/settings/schedule", payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save schedule settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Schedule settings saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not save schedule settings",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, profileImageUrl: url }));
  };

  const initials =
    (form.firstName?.[0] || "") +
    (form.lastName?.[0] || form.username?.[0] || "U");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <Button asChild variant="ghost" size="sm" data-testid="button-back-home">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <Card
          className="bg-card/30 border-border rounded-2xl mb-8"
          data-testid="card-profile"
        >
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserIcon className="h-5 w-5 opacity-80" />
              Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Update your basic information and profile photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.profileImageUrl || ""} />
                <AvatarFallback>{initials.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-3">
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
                <Button
                  variant="secondary"
                  onClick={() =>
                    document.getElementById("avatar-input")?.click()
                  }
                  data-testid="button-change-photo"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                {form.profileImageUrl && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setForm((f) => ({ ...f, profileImageUrl: undefined }))
                    }
                    data-testid="button-remove-photo"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  data-testid="input-first-name"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  data-testid="input-last-name"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="janedoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />
                  <Input
                    id="email"
                    data-testid="input-email"
                    className="pl-9"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              data-testid="button-save-profile"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="bg-card/30 border-border rounded-2xl mb-8"
          data-testid="card-preferences"
        >
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 opacity-80" />
              Preferences
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Appearance and language settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(v: "system" | "light" | "dark") => {
                  setTheme(v);
                  setForm((f) => ({ ...f, theme: v }));
                }}
              >
                <SelectTrigger data-testid="select-theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70 z-10" />
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
                >
                  <SelectTrigger className="pl-9" data-testid="select-language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              data-testid="button-save-preferences"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="bg-card/30 border-border rounded-2xl mb-8"
          data-testid="card-notifications"
        >
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 opacity-80" />
              Notifications
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose how you want to be notified about activity and progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-muted-foreground">
                  Updates about challenges and weekly summaries.
                </p>
              </div>
              <Switch
                checked={form.emailNotifications}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, emailNotifications: !!v }))
                }
                data-testid="switch-email-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified instantly on new activity.
                </p>
              </div>
              <Switch
                checked={form.pushNotifications}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, pushNotifications: !!v }))
                }
                data-testid="switch-push-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly summary</p>
                <p className="text-sm text-muted-foreground">
                  A recap of your progress every week.
                </p>
              </div>
              <Switch
                checked={form.weeklySummary}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, weeklySummary: !!v }))
                }
                data-testid="switch-weekly-summary"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              data-testid="button-save-notifications"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="bg-card/30 border-border rounded-2xl mb-8"
          data-testid="card-privacy"
        >
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 opacity-80" />
              Privacy
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Control who can see your activity and how your data is used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile visibility</Label>
              <Select
                value={form.profileVisibility}
                onValueChange={(v: "public" | "friends" | "private") =>
                  setForm((f) => ({ ...f, profileVisibility: v }))
                }
              >
                <SelectTrigger data-testid="select-profile-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Allow anonymized data sharing</p>
                <p className="text-sm text-muted-foreground">
                  Help us improve by sharing usage metrics.
                </p>
              </div>
              <Switch
                checked={form.dataSharing}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, dataSharing: !!v }))
                }
                data-testid="switch-data-sharing"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              data-testid="button-save-privacy"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="bg-card/30 border-border rounded-2xl mb-8"
          data-testid="card-challenge-scheduling"
        >
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 opacity-80" />
              Challenge Scheduling
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Set up when you want to receive challenge notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable scheduled notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive automatic challenge notifications during your selected time slots.
                </p>
              </div>
              <Switch
                checked={form.enableNotifications ?? false}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, enableNotifications: !!v }))
                }
                data-testid="switch-enable-notifications"
              />
            </div>

            {form.enableNotifications && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Active Time Slots (HH:MM format)</Label>
                <p className="text-sm text-muted-foreground">
                  Add time slots when you want to receive challenges. For example: 09:00, 14:30, 18:00
                </p>
                <div className="space-y-2">
                  {(form.challengeScheduleTimes || []).map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...(form.challengeScheduleTimes || [])];
                          newTimes[index] = e.target.value;
                          setForm((f) => ({ ...f, challengeScheduleTimes: newTimes }));
                        }}
                        data-testid={`input-time-slot-${index}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newTimes = (form.challengeScheduleTimes || []).filter(
                            (_, i) => i !== index
                          );
                          setForm((f) => ({ ...f, challengeScheduleTimes: newTimes }));
                        }}
                        data-testid={`button-remove-time-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newTimes = [...(form.challengeScheduleTimes || []), "09:00"];
                      setForm((f) => ({ ...f, challengeScheduleTimes: newTimes }));
                    }}
                    data-testid="button-add-time-slot"
                  >
                    + Add Time Slot
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => saveScheduleMutation.mutate({
                enableNotifications: form.enableNotifications ?? false,
                challengeScheduleTimes: form.challengeScheduleTimes ?? [],
              })}
              disabled={saveScheduleMutation.isPending}
              data-testid="button-save-scheduling"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveScheduleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="bg-card/30 border-border rounded-2xl"
          data-testid="card-danger-zone"
        >
          <CardHeader>
            <CardTitle className="text-foreground">Danger Zone</CardTitle>
            <CardDescription className="text-muted-foreground">
              Irreversible actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-medium text-destructive">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove your account and all associated
                  data.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: "Not implemented",
                    description: "Account deletion feature is not yet available",
                    variant: "destructive",
                  });
                }}
                data-testid="button-delete-account"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
