import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categoryConfig } from "@/lib/categories";
import { ArrowLeft } from "lucide-react";
import type { Challenge } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  category: z.enum(["physical", "mental", "learning", "finance", "relationships"]),
  subcategory: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.coerce.number().int().min(10).max(50),
  instructions: z.string().min(20, "Instructions must be at least 20 characters").max(1000, "Instructions too long"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateChallengeProps {
  editId?: string;
}

export default function CreateChallenge({ editId }: CreateChallengeProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!editId;

  // Fetch existing challenge if editing
  const { data: existingChallenge, isLoading: loadingChallenge } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${editId}`],
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "physical",
      subcategory: "",
      difficulty: "easy",
      points: 10,
      instructions: "",
    },
  });

  // Reset form with existing challenge data when it loads
  useEffect(() => {
    if (existingChallenge && isEditing) {
      form.reset({
        title: existingChallenge.title,
        description: existingChallenge.description,
        category: existingChallenge.category as any,
        subcategory: existingChallenge.subcategory || "",
        difficulty: existingChallenge.difficulty as any,
        points: existingChallenge.points,
        instructions: existingChallenge.instructions,
      });
    }
  }, [existingChallenge, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/challenges/${editId}`, data);
      } else {
        return await apiRequest("POST", "/api/challenges", data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Challenge Updated!" : "Challenge Created!",
        description: isEditing 
          ? "Your challenge has been updated successfully."
          : "Your custom challenge is now available.",
      });
      
      // Invalidate challenges cache
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/user/my-challenges"] });
      
      navigate("/my-challenges");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (loadingChallenge) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/my-challenges")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              {isEditing ? "Edit Challenge" : "Create Custom Challenge"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update your custom challenge" : "Design your own 2-minute challenge"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Details</CardTitle>
            <CardDescription>
              Fill in the details for your custom 2-minute challenge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Gratitude Journal" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormDescription>
                        A short, catchy name for your challenge
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Write down three things you're grateful for" 
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormDescription>
                        A brief overview of what the challenge involves
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category and Difficulty Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoryConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subcategory and Points Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., gratitude, mindfulness" {...field} data-testid="input-subcategory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points (10-50)</FormLabel>
                        <FormControl>
                          <Input type="number" min={10} max={50} {...field} data-testid="input-points" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Instructions */}
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide step-by-step instructions for completing this challenge..."
                          className="min-h-32"
                          {...field}
                          data-testid="input-instructions"
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed instructions on how to complete the challenge in 2 minutes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Saving..." : (isEditing ? "Update Challenge" : "Create Challenge")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/my-challenges")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
