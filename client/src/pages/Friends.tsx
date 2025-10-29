import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserMinus, Check, X, Loader2, Activity } from "lucide-react";
import { format } from "date-fns";
import type { FriendWithDetails } from "@shared/schema";

type FriendActivity = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  challengeTitle: string;
  completedAt: string;
  pointsEarned: number;
};

export default function Friends() {
  const { toast } = useToast();
  const [friendEmail, setFriendEmail] = useState("");

  const { data: friends = [], isLoading: loadingFriends } = useQuery<FriendWithDetails[]>({
    queryKey: ["/api/friends"],
  });

  const { data: pendingRequests = [], isLoading: loadingPending } = useQuery<FriendWithDetails[]>({
    queryKey: ["/api/friends/pending"],
  });

  const { data: friendActivity = [], isLoading: loadingActivity } = useQuery<FriendActivity[]>({
    queryKey: ["/api/friends/activity"],
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/friends/request", { email });
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully.",
      });
      setFriendEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return await apiRequest("PATCH", `/api/friends/${friendshipId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/activity"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return await apiRequest("PATCH", `/api/friends/${friendshipId}/decline`);
    },
    onSuccess: () => {
      toast({
        title: "Request Declined",
        description: "Friend request has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline friend request",
        variant: "destructive",
      });
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return await apiRequest("DELETE", `/api/friends/${friendshipId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend Removed",
        description: "You are no longer friends.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/activity"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendEmail.trim()) {
      sendRequestMutation.mutate(friendEmail.trim());
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getFullName = (firstName: string | null, lastName: string | null) => {
    return [firstName, lastName].filter(Boolean).join(" ") || "Unknown User";
  };

  if (loadingFriends || loadingPending) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Friends</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: Friends list and add friend form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Friend Form */}
            <Card data-testid="card-add-friend">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Friend
                </CardTitle>
                <CardDescription>Send a friend request by email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendRequest} className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="friend-email" className="sr-only">Friend's Email</Label>
                    <Input
                      id="friend-email"
                      type="email"
                      placeholder="friend@example.com"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      disabled={sendRequestMutation.isPending}
                      data-testid="input-friend-email"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!friendEmail.trim() || sendRequestMutation.isPending}
                    data-testid="button-send-request"
                  >
                    {sendRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send Request"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card data-testid="card-pending-requests">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Pending Requests
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </CardTitle>
                  <CardDescription>Friend requests waiting for your response</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                      data-testid={`pending-request-${request.friendshipId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(request.firstName, request.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid={`text-requester-name-${request.friendshipId}`}>
                            {getFullName(request.firstName, request.lastName)}
                          </p>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(request.friendshipId)}
                          disabled={acceptMutation.isPending}
                          data-testid={`button-accept-${request.friendshipId}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineMutation.mutate(request.friendshipId)}
                          disabled={declineMutation.isPending}
                          data-testid={`button-decline-${request.friendshipId}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Friends List */}
            <Card data-testid="card-friends-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Friends
                  <Badge variant="secondary">{friends.length}</Badge>
                </CardTitle>
                <CardDescription>People you're connected with</CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No friends yet</p>
                    <p className="text-sm mt-1">Add friends to see their activity and compete!</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="friends-list">
                    {friends.map((friend) => (
                      <div
                        key={friend.friendshipId}
                        className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                        data-testid={`friend-${friend.friendshipId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(friend.firstName, friend.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" data-testid={`text-friend-name-${friend.friendshipId}`}>
                              {getFullName(friend.firstName, friend.lastName)}
                            </p>
                            <p className="text-sm text-muted-foreground">{friend.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unfriendMutation.mutate(friend.friendshipId)}
                          disabled={unfriendMutation.isPending}
                          data-testid={`button-unfriend-${friend.friendshipId}`}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Unfriend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Friend Activity Feed */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6" data-testid="card-activity-feed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Friend Activity
                </CardTitle>
                <CardDescription>Recent challenges completed by friends</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : friendActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Your friends haven't completed any challenges yet</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="activity-feed">
                    {friendActivity.map((activity, index) => (
                      <div key={`${activity.userId}-${activity.completedAt}-${index}`}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="space-y-2" data-testid={`activity-${index}`}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activity.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(activity.firstName, activity.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getFullName(activity.firstName, activity.lastName)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.completedAt), "MMM d, h:mm a")}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              +{activity.pointsEarned}
                            </Badge>
                          </div>
                          <p className="text-sm pl-10">{activity.challengeTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
