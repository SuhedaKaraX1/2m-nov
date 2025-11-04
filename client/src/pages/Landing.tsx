import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  Clock,
  Trophy,
  Flame,
  Sword,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              2Mins
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Transform your life, two minutes at a time
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-xl mx-auto">
              Build better habits through quick daily challenges. Complete
              2-minute activities across physical health, mental wellness,
              learning, finance, and relationships.
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => (window.location.href = "/api/login")}
                className="text-lg px-8 py-6"
                data-testid="button-login"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Five Areas of Growth
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Physical Health</h3>
              <p className="text-muted-foreground">
                Quick workouts, stretches, and cardio bursts to keep you active
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Mental Wellness</h3>
              <p className="text-muted-foreground">
                Meditation, mindfulness, and cognitive exercises for mental
                clarity
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Learning & Discovery</h3>
              <p className="text-muted-foreground">
                Expand your knowledge with facts, skills, and new concepts
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Personal Finance</h3>
              <p className="text-muted-foreground">
                Track spending, set goals, and make smarter money decisions
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Relationships</h3>
              <p className="text-muted-foreground">
                Strengthen connections through meaningful communication
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Just 2 Minutes</h3>
              <p className="text-muted-foreground">
                Every challenge takes exactly 2 minutes - perfect for any
                schedule
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why 2Mins Works
        </h2>
        <div className="grid gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Build Streaks</h3>
              <p className="text-muted-foreground">
                Complete challenges daily to build momentum. Track your streaks
                and watch your consistency grow.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Earn Points</h3>
              <p className="text-muted-foreground">
                Easy challenges earn 10 points, medium 20, and hard 30. Level up
                your life systematically.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Micro Habits</h3>
              <p className="text-muted-foreground">
                Small, consistent actions create lasting change. 2 minutes is
                easy to start, impossible to skip.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-br from-primary/10 to-background">
          <CardContent className="p-12 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands building better habits. Your first 2-minute
              challenge awaits.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/api/login")}
              className="text-lg px-8 py-6"
              data-testid="button-login-cta"
            >
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
