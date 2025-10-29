import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { AchievementWithProgress } from "@shared/schema";
import {
  Trophy,
  Award,
  Target,
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Coins,
  Gem,
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  CircleDot,
  Footprints,
  TrendingUp,
  Share2,
  Copy,
  Check,
  type LucideIcon,
} from "lucide-react";

// Map icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Award,
  Target,
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Coins,
  Gem,
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  CircleDot,
  Footprints,
  TrendingUp,
};

// Tier colors
const tierColors = {
  bronze: "text-amber-700 dark:text-amber-600 border-amber-700/50 dark:border-amber-600/50",
  silver: "text-slate-400 dark:text-slate-300 border-slate-400/50 dark:border-slate-300/50",
  gold: "text-yellow-500 dark:text-yellow-400 border-yellow-500/50 dark:border-yellow-400/50",
  platinum: "text-cyan-400 dark:text-cyan-300 border-cyan-400/50 dark:border-cyan-300/50",
};

const tierBgColors = {
  bronze: "bg-amber-950/20 dark:bg-amber-950/30",
  silver: "bg-slate-900/20 dark:bg-slate-900/30",
  gold: "bg-yellow-950/20 dark:bg-yellow-950/30",
  platinum: "bg-cyan-950/20 dark:bg-cyan-950/30",
};

export default function Achievements() {
  const { data: achievements, isLoading } = useQuery<AchievementWithProgress[]>({
    queryKey: ["/api/achievements/user"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const unlockedAchievements = achievements?.filter(a => a.unlocked) || [];
  const lockedAchievements = achievements?.filter(a => !a.unlocked) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-achievements-title">
            Achievements
          </h1>
          <p className="text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Overall Progress</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep completing challenges to unlock more achievements
                </p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{Math.floor((unlockedCount / totalCount) * 100)}%</span>
              </div>
              <Progress value={(unlockedCount / totalCount) * 100} />
            </div>
          </CardContent>
        </Card>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Unlocked</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Locked</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementWithProgress }) {
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = iconMap[achievement.icon] || Trophy;
  const tierColor = tierColors[achievement.tier as keyof typeof tierColors] || tierColors.bronze;
  const tierBg = tierBgColors[achievement.tier as keyof typeof tierBgColors] || tierBgColors.bronze;

  const shareUrl = achievement.userAchievementId
    ? `${window.location.origin}/share/achievement/${achievement.userAchievementId}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share this achievement with your friends.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden transition-all ${achievement.unlocked ? "hover-elevate" : "opacity-60"}`}
        data-testid={`card-achievement-${achievement.id}`}
      >
        {achievement.unlocked && (
          <div className={`absolute inset-0 ${tierBg} pointer-events-none`} />
        )}
        <CardContent className="relative p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${tierBg} border ${tierColor}`}>
              <Icon className={`h-6 w-6 ${tierColor}`} />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${tierColor} capitalize`}
                data-testid={`badge-tier-${achievement.tier}`}
              >
                {achievement.tier}
              </Badge>
              {achievement.unlocked && achievement.userAchievementId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShareDialogOpen(true)}
                  data-testid={`button-share-${achievement.id}`}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg" data-testid={`text-achievement-name-${achievement.id}`}>
              {achievement.name}
            </h3>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>

          {!achievement.unlocked && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {achievement.progress}/{achievement.requirementValue}
                </span>
              </div>
              <Progress value={achievement.progressPercent} />
            </div>
          )}

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent data-testid="dialog-share-achievement">
          <DialogHeader>
            <DialogTitle>Share Achievement</DialogTitle>
            <DialogDescription>
              Share your "{achievement.name}" achievement with friends
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                data-testid="input-share-url"
              />
              <Button
                onClick={handleCopyLink}
                data-testid="button-copy-link"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Anyone with this link can see this achievement and when you unlocked it.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
