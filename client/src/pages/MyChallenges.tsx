import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categoryConfig } from "@/lib/categories";
import { Plus, Edit, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import type { Challenge } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function MyChallenges() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);

  const { data: userChallenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/user/my-challenges"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/challenges/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Deleted",
        description: "Your challenge has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/user/my-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (challenge: Challenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (challengeToDelete) {
      deleteMutation.mutate(challengeToDelete.id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading your challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                My Custom Challenges
              </h1>
              <p className="text-muted-foreground">
                Manage your personalized 2-minute challenges
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/create-challenge")} data-testid="button-create-challenge">
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        {/* Challenges List */}
        {!userChallenges || userChallenges.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Custom Challenges Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first custom challenge to personalize your 2Mins experience. Design challenges that fit your unique goals and interests!
              </p>
              <Button onClick={() => navigate("/create-challenge")} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Challenge
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4" data-testid="challenges-list">
            {userChallenges.map((challenge) => (
              <Card key={challenge.id} className="hover-elevate" data-testid={`challenge-card-${challenge.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-xl" data-testid={`challenge-title-${challenge.id}`}>
                          {challenge.title}
                        </CardTitle>
                        <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {categoryConfig[challenge.category as keyof typeof categoryConfig]?.label}
                        </Badge>
                        <Badge variant="secondary">
                          {challenge.points} points
                        </Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/edit-challenge/${challenge.id}`)}
                        data-testid={`button-edit-${challenge.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(challenge)}
                        data-testid={`button-delete-${challenge.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Instructions:</p>
                    <p className="text-sm text-muted-foreground">{challenge.instructions}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{challengeToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
