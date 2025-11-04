import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import ChallengeDetail from "@/pages/ChallengeDetail";
import Challenges from "@/pages/Challenges";
import Progress from "@/pages/Progress";
import History from "@/pages/History";
import Achievements from "@/pages/Achievements";
import Analytics from "@/pages/Analytics";
import CreateChallenge from "@/pages/CreateChallenge";
import MyChallenges from "@/pages/MyChallenges";
import Friends from "@/pages/Friends";
import Profile from "@/pages/Profile";
import Journal from "@/pages/Journal";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import ShareAchievement from "@/pages/ShareAchievement";
import NotFound from "@/pages/not-found";
import { LogOut } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/share/achievement/:id" component={ShareAchievement} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Show onboarding if user hasn't completed it
  if (user && user.onboardingCompleted === 0) {
    return <Onboarding />;
  }

  // Show main app with sidebar
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <NotificationProvider>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </header>
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/challenge/:id" component={ChallengeDetail} />
                <Route path="/challenges" component={Challenges} />
                <Route path="/progress" component={Progress} />
                <Route path="/history" component={History} />
                <Route path="/journal" component={Journal} />
                <Route path="/achievements" component={Achievements} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/my-challenges" component={MyChallenges} />
                <Route path="/create-challenge" component={CreateChallenge} />
                <Route path="/edit-challenge/:id">
                  {(params) => <CreateChallenge editId={params.id} />}
                </Route>
                <Route path="/friends" component={Friends} />
                <Route path="/profile" component={Profile} />
                <Route path="/settings" component={Settings} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/logout" component={Login} />
                <Route
                  path="/share/achievement/:id"
                  component={ShareAchievement}
                />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
